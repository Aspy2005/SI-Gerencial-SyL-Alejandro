import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CalidadService } from '../../../core/services/calidad';

@Component({
  standalone: false,
  selector: 'app-calidad-list',
  templateUrl: './calidad-list.html',
  styleUrls: ['./calidad-list.scss']
})
export class CalidadListComponent implements OnInit {

  lotes: any[]         = [];
  loteSeleccionado: any = null;
  accionActual          = '';   // 'aprobar' | 'rechazar'
  observaciones         = '';
  motivoRechazo         = '';
  motivoRechazoTipo     = '';
  motivoError           = '';
  submitting            = false;
  showAprobarModal      = false;
  showRechazarModal     = false;

  criterios = {
    integridadFisica:  false,
    legibilidadCodigo: false,
    concordanciaPeso:  false,
    temperatura:       false,
  };

  constructor(
    private calidadService: CalidadService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadLotes();
  }

  loadLotes(): void {
    this.calidadService.getLotesEnRevision().subscribe({
      next: (data: any[]) => {
        this.ngZone.run(() => {
          this.lotes = data;
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => console.error(err)
    });
  }

  seleccionarLote(lote: any, accion: 'aprobar' | 'rechazar'): void {
    this.loteSeleccionado  = lote;
    this.accionActual      = accion;
    this.observaciones     = '';
    this.motivoRechazo     = '';
    this.motivoRechazoTipo = '';
    this.motivoError       = '';
    this.showAprobarModal  = accion === 'aprobar';
    this.showRechazarModal = accion === 'rechazar';
    this.criterios = {
      integridadFisica:  false,
      legibilidadCodigo: false,
      concordanciaPeso:  false,
      temperatura:       false,
    };
  }

  onMotivoTipoChange(): void {
    if (this.motivoRechazoTipo && this.motivoRechazoTipo !== 'Otro') {
      this.motivoRechazo = this.motivoRechazoTipo;
    } else {
      this.motivoRechazo = '';
    }
  }

  confirmarAprobacion(): void {
    if (!this.loteSeleccionado) return;
    this.submitting = true;
    this.calidadService.aprobarLote(this.loteSeleccionado.id, this.observaciones).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.submitting       = false;
          this.loteSeleccionado = null;
          this.accionActual     = '';
          this.showAprobarModal  = false;
          this.showRechazarModal = false;
          this.loadLotes();
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        this.ngZone.run(() => {
          console.error(err);
          this.submitting = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  confirmarRechazo(): void {
    if (!this.loteSeleccionado) return;
    if (!this.motivoRechazo.trim()) {
      this.motivoError = 'El motivo de rechazo es obligatorio';
      return;
    }
    this.motivoError = '';
    this.submitting  = true;
    this.calidadService.rechazarLote(this.loteSeleccionado.id, this.motivoRechazo).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.submitting       = false;
          this.loteSeleccionado = null;
          this.accionActual     = '';
          this.showAprobarModal  = false;
          this.showRechazarModal = false;
          this.loadLotes();
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        this.ngZone.run(() => {
          console.error(err);
          this.submitting = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  porcentajeWidth(valor: number, total: number): string {
    if (!total) return '0%';
    return Math.min(100, Math.round((valor / total) * 100)) + '%';
  }

  donutOffset(integridad: number): number {
    return 314 - (314 * integridad) / 100;
  }
}