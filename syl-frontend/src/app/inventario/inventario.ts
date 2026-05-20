import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';
import { LotesService } from '../core/services/lotes.service';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

interface ProductoInventario {
  producto:      string;
  num_lotes:     number;
  stock_real:    number;
  stock_teorico: number;
  diferencia:    number;
  mermas:        number;
  estado:        'concilia' | 'revisar' | 'diferencia';
}

interface Kpis {
  stock_total:    number;
  stock_liberado: number;
  en_revision:    number;
  mermas:         number;
}

@Component({
  standalone: false,
  selector: 'app-inventario',
  templateUrl: './inventario.html',
  styleUrls: ['./inventario.scss']
})
export class InventarioComponent implements OnInit, OnDestroy {

  kpis: Kpis = {
    stock_total:    0,
    stock_liberado: 0,
    en_revision:    0,
    mermas:         0,
  };

  productos: ProductoInventario[] = [];
  cargando  = true;
  errorMsg  = '';

  private refresco$!: Subscription;

  constructor(
    private lotesService: LotesService,
    private cdr:          ChangeDetectorRef,
    private ngZone:       NgZone
  ) {}

  ngOnInit(): void {
    this.cargarInventario();
    this.refresco$ = interval(30_000)
      .pipe(switchMap(() => this.lotesService.getInventario()))
      .subscribe({
        next: (data) => this.ngZone.run(() => this.aplicarDatos(data)),
        error: () => {}
      });
  }

  ngOnDestroy(): void {
    this.refresco$?.unsubscribe();
  }

  cargarInventario(): void {
    this.cargando = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.lotesService.getInventario().subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.aplicarDatos(data);
          this.cargando = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.errorMsg = 'No se pudo cargar el inventario. Verifica la conexión.';
          this.cargando = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  private aplicarDatos(data: any): void {
    this.kpis      = data.kpis;
    this.productos = data.productos;
    this.cdr.detectChanges();
  }

  porcentaje(real: number, teorico: number): number {
    if (!teorico) return 0;
    return Math.min(100, Math.round((real / teorico) * 100));
  }

  porcentajeWidth(real: number, teorico: number): string {
    return this.porcentaje(real, teorico) + '%';
  }

  fillClass(estado: string): string {
    return estado === 'concilia' ? 'fill-green'
         : estado === 'revisar'  ? 'fill-warn'
         :                         'fill-danger';
  }

  badgeEstado(estado: string): string {
    return estado === 'concilia' ? 'badge-green'
         : estado === 'revisar'  ? 'badge-warn'
         :                         'badge-danger';
  }

  labelEstado(estado: string): string {
    return estado === 'concilia' ? 'Concilia'
         : estado === 'revisar'  ? 'Revisar'
         :                         'Diferencia';
  }

  diferenciaClass(diff: number): string {
    if (diff === 0) return 'text-accent';
    if (diff >= -3) return 'text-warn';
    return 'text-danger';
  }

  signo(diff: number): string {
    return diff > 0 ? `+${diff}` : `${diff}`;
  }
}