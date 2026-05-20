import {
  Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef
} from '@angular/core';
import { Subscription, interval, forkJoin } from 'rxjs';
import { LotesService } from '../../core/services/lotes.service';

export interface KpisDashboard {
  stock_total:    number;
  stock_liberado: number;
  en_revision:    number;
  mermas:         number;
}

export interface SedeCuadrante {
  sede:       string;
  escaneadas: number;
  total:      number;
  porcentaje: number;
}

export interface EventoActividad {
  modulo:      string;
  tipo:        string;
  icono:       string;
  descripcion: string;
  fecha:       string;
  usuario:     string;
}

@Component({
  standalone: false,
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {

  turnoActual  = 'Mañana';
  turnoHorario = '06:00 a 14:00';

  pasoActual   = 0;
  turnoCerrado = false;

  pasos = [
    { label: 'Malla\nCargada'    },
    { label: 'Lotes\nGenerados'  },
    { label: 'Escaneo\nen Curso' },
    { label: 'Calidad'           },
    { label: 'Liberación'        },
    { label: 'Cierre\nTurno'     },
  ];

  kpis: KpisDashboard = { stock_total: 0, stock_liberado: 0, en_revision: 0, mermas: 0 };

  lotesLiberados    = 0;
  lotesTotal        = 0;
  bolsasProducidas  = 0;
  bolsasEscaneadas  = 0;
  porcentajeEscaneo = 0;

  sedes:     SedeCuadrante[]   = [];
  actividad: EventoActividad[] = [];
  cargando = true;

  private sub$!: Subscription;

  constructor(
    private lotesSvc: LotesService,
    private cdr:      ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sub$ = interval(30_000).subscribe(() => this.cargar());
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.cargar(), 0);
  }

  ngOnDestroy(): void {
    this.sub$?.unsubscribe();
  }

  cargar(): void {
    this.cargando = true;

    forkJoin({
      inv:       this.lotesSvc.getInventario(),
      sedes:     this.lotesSvc.getProgresoGlobal(),
      lotes:     this.lotesSvc.getLiberacion(),   // ← usa /liberacion/ para leer RevisionCalidad real
      actividad: this.lotesSvc.getActividadReciente(20),
    }).subscribe({
      next: ({ inv, sedes, lotes, actividad }: any) => {

        this.kpis             = inv.kpis ?? this.kpis;
        this.bolsasProducidas = inv.kpis?.stock_total    ?? 0;
        this.bolsasEscaneadas = inv.kpis?.stock_liberado ?? 0;
        this.porcentajeEscaneo = this.bolsasProducidas > 0
          ? Math.round((this.bolsasEscaneadas / this.bolsasProducidas) * 100) : 0;

        this.lotesTotal     = lotes.length;
        // stock_liberado viene del endpoint /liberacion/ (lote.estado === 'completado')
        this.lotesLiberados = lotes.filter((l: any) => l.stock_liberado === true).length;

        this.sedes     = sedes;
        this.actividad = actividad;

        this.calcularPaso(inv, lotes);

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => { this.cargando = false; this.cdr.detectChanges(); }
    });
  }

  calcularPaso(inv: any, lotes: any[]): void {
    // Si el turno ya fue cerrado manualmente, no retroceder
    if (this.turnoCerrado) return;

    const totalBolsas = inv.kpis?.stock_total    ?? 0;
    const escaneadas  = inv.kpis?.stock_liberado ?? 0;
    const totalLotes  = lotes.length;

    // calidad_estado viene resuelto desde RevisionCalidad en el endpoint /liberacion/
    const lotesConCalidad = lotes.filter((l: any) =>
      l.calidad_estado === 'aprobado' || l.calidad_estado === 'rechazado'
    ).length;

    // stock_liberado es true cuando lote.estado === 'completado'
    const lotesCompletados = lotes.filter((l: any) =>
      l.stock_liberado === true
    ).length;

    if (totalLotes === 0) {
      this.pasoActual = 0; // Sin lotes → esperando malla
      return;
    }
    if (escaneadas === 0) {
      this.pasoActual = 1; // Lotes generados, sin escaneo
      return;
    }
    if (escaneadas < totalBolsas) {
      this.pasoActual = 2; // Escaneo en curso
      return;
    }
    if (lotesConCalidad < totalLotes) {
      this.pasoActual = 3; // Escaneo completo, falta calidad
      return;
    }
    if (lotesCompletados < totalLotes) {
      this.pasoActual = 4; // Calidad lista, falta liberación
      return;
    }
    this.pasoActual = 5; // Todo listo → puede cerrar turno
  }

  cerrarTurno(): void {
    if (this.pasoActual < 5 || this.turnoCerrado) return;
    const ok = confirm('¿Confirmas el cierre de turno? Esta acción registrará el cierre.');
    if (!ok) return;
    this.turnoCerrado = true;
    this.pasoActual   = 6;
    this.cdr.detectChanges();
  }

  formatFecha(fecha: string | null): string {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  }

  formatFechaCompleta(fecha: string | null): string {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleString('es-CO', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });
  }

  barraColor(pct: number): string {
    if (pct === 100) return 'fill-green';
    if (pct >= 70)   return 'fill-blue';
    if (pct >= 40)   return 'fill-warn';
    return 'fill-danger';
  }

  iconoActividad(ev: EventoActividad): string {
    return ev.icono ?? '•';
  }

  moduloBadge(modulo: string): string {
    const map: Record<string, string> = {
      'RF-01': 'badge-blue',   'RF-03': 'badge-warn',
      'RF-04': 'badge-muted',  'RF-05': 'badge-blue',
      'RF-07': 'badge-green',  'RF-08': 'badge-green',
      'RF-09': 'badge-danger',
    };
    return map[modulo] ?? 'badge-muted';
  }

  pasoClass(i: number): Record<string, boolean> {
    return {
      done:   i < this.pasoActual,
      active: i === this.pasoActual && this.pasoActual < 6,
    };
  }

  pasoLabel(i: number): string {
    if (this.pasoActual === 6) return '✓';  // turno cerrado, todo verde
    if (i < this.pasoActual)   return '✓';
    if (i === this.pasoActual) return '●';
    return String(i + 1);
  }
}