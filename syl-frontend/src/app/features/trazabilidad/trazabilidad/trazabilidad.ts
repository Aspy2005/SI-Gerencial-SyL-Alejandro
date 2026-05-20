import {
  Component, OnInit, AfterViewInit, ChangeDetectorRef
} from '@angular/core';
import { TrazabilidadService, HistorialLote } from '../../../core/services/trazabilidad';

@Component({
  standalone: false,
  selector: 'app-trazabilidad',
  templateUrl: './trazabilidad.html',
  styleUrls: ['./trazabilidad.scss']
})
export class TrazabilidadComponent implements OnInit, AfterViewInit {

  query    = '';
  cargando = false;
  error    = '';
  resultado: HistorialLote | null = null;

  constructor(
    private trazabilidadSvc: TrazabilidadService,
    private cdr:             ChangeDetectorRef
  ) {}

  ngOnInit(): void {}

  // Garantiza que el interceptor JWT ya está activo antes de cualquier llamada
  ngAfterViewInit(): void {}

  buscar(): void {
    const q = this.query.trim();
    if (!q) return;

    this.cargando  = true;
    this.error     = '';
    this.resultado = null;
    this.cdr.detectChanges();

    this.trazabilidadSvc.buscar(q).subscribe({
      next: (data: HistorialLote) => {
        this.resultado = data;
        this.cargando  = false;
        this.cdr.detectChanges();   // ← fuerza render del resultado
      },
      error: (err: any) => {
        this.error = err.status === 404
          ? 'No se encontró ningún lote o bolsa con ese código.'
          : 'Error al consultar la trazabilidad. Intenta nuevamente.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.buscar();
  }

  dotClass(tipo: string): string {
    const map: Record<string, string> = {
      creacion: '', bartender: 'done', escaneo: 'done',
      merma: 'warn', calidad: 'done', liberacion: 'done',
    };
    return map[tipo] ?? '';
  }

  iconoEvento(tipo: string): string {
    const map: Record<string, string> = {
      creacion: '📦', bartender: '🖨️', escaneo: '🔍',
      merma: '⚠️', calidad: '✅', liberacion: '🔓',
    };
    return map[tipo] ?? '•';
  }
}