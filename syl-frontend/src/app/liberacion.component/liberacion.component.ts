// src/app/features/liberacion/liberacion.component.ts
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';

import {
  LiberacionService,
  LoteLiberable,
} from '../core/services/liberacion.service'

@Component({
  standalone: false,
  selector: 'app-liberacion',
  templateUrl: './liberacion.component.html',
  styleUrls: ['./liberacion.component.scss'],
})
export class LiberacionComponent implements OnInit {

  lotes: LoteLiberable[] = [];
  loteSeleccionado: LoteLiberable | null = null;
  loading  = false;
  liberando = false;
  toast: { tipo: 'ok' | 'error'; mensaje: string } | null = null;

  filtro: 'todos' | 'disponible' | 'liberado' | 'bloqueado' = 'todos';

  constructor(
    private liberacionService: LiberacionService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarLotes();
  }

  cargarLotes(): void {
    this.loading = true;
    this.liberacionService.getLotesParaLiberacion().subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.lotes   = data;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  get lotesFiltrados(): LoteLiberable[] {
    switch (this.filtro) {
      case 'disponible': return this.lotes.filter(l => !l.stock_bloqueado && !l.stock_liberado);
      case 'liberado':   return this.lotes.filter(l =>  l.stock_liberado);
      case 'bloqueado':  return this.lotes.filter(l =>  l.stock_bloqueado);
      default:           return this.lotes;
    }
  }

  get kpis() {
    return {
      total:       this.lotes.length,
      disponibles: this.lotes.filter(l => !l.stock_bloqueado && !l.stock_liberado).length,
      liberados:   this.lotes.filter(l =>  l.stock_liberado).length,
      bloqueados:  this.lotes.filter(l =>  l.stock_bloqueado).length,
    };
  }

  // Abre el panel inline; si ya estaba abierto para ese lote, lo cierra
  toggleConfirmacion(lote: LoteLiberable): void {
    if (this.loteSeleccionado?.id === lote.id) {
      this.loteSeleccionado = null;
    } else {
      this.loteSeleccionado = lote;
    }
  }

  cerrarConfirmacion(): void {
    this.loteSeleccionado = null;
  }

  confirmarLiberacion(): void {
    if (!this.loteSeleccionado) return;

    this.liberando = true;
    this.liberacionService.liberarStock(this.loteSeleccionado.id).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.liberando        = false;
          this.loteSeleccionado = null;
          this.mostrarToast('ok', res.mensaje);
          this.cargarLotes();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.liberando        = false;
          this.loteSeleccionado = null;
          const msg = err.error?.error || 'Error al liberar el stock.';
          this.mostrarToast('error', msg);
          this.cdr.detectChanges();
        });
      },
    });
  }

  mostrarToast(tipo: 'ok' | 'error', mensaje: string): void {
    this.toast = { tipo, mensaje };
    setTimeout(() => {
      this.ngZone.run(() => {
        this.toast = null;
        this.cdr.detectChanges();
      });
    }, 4000);
  }

  badgeCalidad(estado: string): string {
    const map: Record<string, string> = {
      aprobado:  'badge-green',
      rechazado: 'badge-danger',
      pendiente: 'badge-warn',
    };
    return map[estado] ?? 'badge-muted';
  }

  badgeStock(lote: LoteLiberable): { clase: string; label: string } {
    if (lote.stock_liberado)   return { clase: 'badge-green', label: 'Liberado ✔' };
    if (!lote.stock_bloqueado) return { clase: 'badge-blue',  label: 'Disponible para liberar' };
    return { clase: 'badge-muted', label: 'Bloqueado — RF-08' };
  }
}