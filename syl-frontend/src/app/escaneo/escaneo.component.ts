import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';
import { Subscription } from 'rxjs';
import { LotesService } from '../core/services/lotes.service';
import { BarcodeCameraService, CameraStatus } from '../core/services/barcode-camera.service';

interface LogEscaneo {
  num: number;
  timestamp: Date;
  codigo: string;
  sede: string;
  lote: string;
  loteId: number;
  cuota_total: number;
  cuota_escaneada: number;
  cuota_pendiente: number;
  estado: 'ok' | 'duplicado' | 'error' | 'merma';
  mensaje: string;
}

@Component({
  standalone: false,
  selector: 'app-escaneo',
  templateUrl: './escaneo.html',
  styleUrls: ['./escaneo.scss']
})
export class EscaneoComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('scanInput')  scanInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('cameraVideo') cameraVideoRef!: ElementRef<HTMLVideoElement>;

  // ── Estado general ──────────────────────────────────────
  lotes:          any[]        = [];
  loteActivo:     any          = null;
  procesando                   = false;
  ultimaBolsa:    any          = null;
  errorMsg                     = '';
  log:            LogEscaneo[] = [];
  progresoActual: any          = null;
  private contador             = 0;

  // ── Merma rápida ────────────────────────────────────────
  mermaCodigoBarras = '';
  mermaMotivo       = 'Etiqueta ilegible';
  mermaError        = '';
  mermaSubmitting   = false;

  readonly MOTIVOS_MERMA = [
    'Etiqueta ilegible',
    'Bolsa dañada',
    'Código duplicado',
    'Otro',
  ];

  // ── Cámara ──────────────────────────────────────────────
  camaraStatus: CameraStatus = 'idle';
  camaraError  = '';
  camaras:      MediaDeviceInfo[] = [];
  camaraActiva = '';
  mostrarCamara = false;

  // ── Debounce mejorado: evita falsos positivos por lecturas parciales ──
  private ultimoCodigoEscaneado = '';
  private ultimoTimestamp       = 0;
  private debounceTimer: any    = null;
  private readonly DEBOUNCE_MS  = 2500; // ms entre lecturas del mismo código
  private readonly MIN_LENGTH   = 6;    // ignora lecturas muy cortas/ruido

  private subs = new Subscription();

  constructor(
    private lotesService: LotesService,
    private cdr:          ChangeDetectorRef,
    private ngZone:       NgZone,
    public  camera:       BarcodeCameraService,
  ) {}

  // ── Ciclo de vida ───────────────────────────────────────
  ngOnInit(): void {
    this.cargarLotes();
    this.suscribirCamara();
  }

  ngAfterViewInit(): void {
    // Ya no conectamos WebSocket; la cámara se inicia manualmente
  }

  ngOnDestroy(): void {
    this.camera.stopScan();
    this.subs.unsubscribe();
    clearTimeout(this.debounceTimer);
  }

  // ── Suscripciones a la cámara ───────────────────────────
  private suscribirCamara(): void {
    this.subs.add(
      this.camera.status$.subscribe(s => {
        this.camaraStatus = s;
        this.cdr.detectChanges();
      })
    );

    this.subs.add(
      this.camera.error$.subscribe(e => {
        this.camaraError = e;
        this.cdr.detectChanges();
      })
    );

    this.subs.add(
      this.camera.devices$.subscribe(d => {
        this.camaras = d;
        if (d.length && !this.camaraActiva) {
          this.camaraActiva = d[0].deviceId;
        }
        this.cdr.detectChanges();
      })
    );

    this.subs.add(
      this.camera.result$.subscribe(res => {
        this.onCodigoEscaneado(res.value);
      })
    );
  }

  // ── Toggle cámara ────────────────────────────────────────
  async toggleCamara(): Promise<void> {
    this.mostrarCamara = !this.mostrarCamara;

    if (!this.mostrarCamara) {
      this.camera.stopScan();
      return;
    }

    // Esperar a que Angular renderice el <video>
    setTimeout(async () => {
      const video = this.cameraVideoRef?.nativeElement;
      if (!video) return;
      await this.camera.startScan(video, this.camaraActiva || undefined);
      this.cdr.detectChanges();
    }, 100);
  }

  async onCamaraChange(event: Event): Promise<void> {
    const deviceId = (event.target as HTMLSelectElement).value;
    this.camaraActiva = deviceId;

    if (this.mostrarCamara) {
      const video = this.cameraVideoRef?.nativeElement;
      if (video) await this.camera.switchDevice(video, deviceId);
    }
  }

  // ── Debounce de lectura mejorado ────────────────────────
  // Ignora ruido (lecturas muy cortas) y evita re-disparar el mismo
  // código dentro de la ventana DEBOUNCE_MS.
  private onCodigoEscaneado(codigo: string): void {
    // Ignorar lecturas cortas (ruido de cámara)
    if (!codigo || codigo.length < this.MIN_LENGTH) return;

    const ahora = Date.now();
    const mismoCodigo = codigo === this.ultimoCodigoEscaneado;
    const muyReciente = ahora - this.ultimoTimestamp < this.DEBOUNCE_MS;

    if (mismoCodigo && muyReciente) return;

    this.ultimoCodigoEscaneado = codigo;
    this.ultimoTimestamp       = ahora;

    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.ultimoCodigoEscaneado = '';
    }, this.DEBOUNCE_MS);

    this.procesarEscaneo(codigo);
  }

  // ── Getter: log filtrado por lote activo ────────────────
  get logDelLoteActivo(): LogEscaneo[] {
    if (!this.loteActivo) return this.log;
    return this.log.filter(item => item.loteId === this.loteActivo.id);
  }

  // ── Carga de lotes ──────────────────────────────────────
  cargarLotes(): void {
    this.lotesService.getLotes().subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.lotes = data.filter((l: any) => l.estado !== 'cancelado');
          if (this.lotes.length) {
            this.loteActivo = this.lotes[0];
            this.cargarProgresoLote(this.loteActivo.id);
          }
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error(err)
    });
  }

  onLoteChange(event: Event): void {
    const id        = Number((event.target as HTMLSelectElement).value);
    this.loteActivo = this.lotes.find((l: any) => l.id === id) || null;
    this.ultimaBolsa = null;
    this.errorMsg    = '';

    if (this.loteActivo) {
      this.cargarProgresoLote(this.loteActivo.id);
    }
    this.cdr.detectChanges();
  }

  // ── Progreso real desde backend ─────────────────────────
  cargarProgresoLote(loteId: number): void {
    this.lotesService.getProgresoLote(loteId).subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.progresoActual = data;
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error('Error cargando progreso:', err)
    });
  }

  // ── Fallback: teclado / HID ──────────────────────────────
  onScanKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;

    const input = this.scanInputRef?.nativeElement;
    if (!input) return;

    const codigo = input.value.trim();
    input.value  = '';

    if (!codigo || this.procesando) return;
    this.procesarEscaneo(codigo);
  }

  // ── Lógica principal de escaneo ─────────────────────────
  procesarEscaneo(codigo: string): void {
    if (!this.loteActivo) {
      this.errorMsg = 'Selecciona un lote activo primero';
      this.cdr.detectChanges();
      return;
    }

    if (this.procesando) return; // ignorar si ya hay una petición en vuelo

    this.procesando = true;
    this.errorMsg   = '';
    this.cdr.detectChanges();

    this.lotesService.escanearBolsa(codigo, this.loteActivo.id).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.ultimaBolsa = res;

          this.progresoActual = {
            total:      res.lote_total,
            escaneadas: res.lote_escaneado,
            pendientes: res.lote_pendiente,
          };

          this.contador++;
          this.log.unshift({
            num:             this.contador,
            timestamp:       new Date(),
            codigo:          res.codigo_barras,
            sede:            res.sede,
            lote:            res.lote,
            loteId:          this.loteActivo.id,
            cuota_total:     res.cuota_total,
            cuota_escaneada: res.cuota_escaneada,
            cuota_pendiente: res.cuota_pendiente,
            estado:          'ok',
            mensaje:         '',
          });

          this.procesando = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          const msg         = err.error?.error || 'Error desconocido';
          const esDuplicado = err.status === 409;

          this.errorMsg = msg;
          this.contador++;
          this.log.unshift({
            num:             this.contador,
            timestamp:       new Date(),
            codigo,
            sede:            err.error?.sede || '—',
            lote:            this.loteActivo?.codigo_lote || '—',
            loteId:          this.loteActivo?.id,
            cuota_total:     0,
            cuota_escaneada: 0,
            cuota_pendiente: 0,
            estado:          esDuplicado ? 'duplicado' : 'error',
            mensaje:         msg,
          });

          this.procesando = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ── Merma rápida ────────────────────────────────────────
  onMermaKeydown(event: KeyboardEvent): void {
    event.stopPropagation();
  }

  registrarMerma(): void {
    const codigo = this.mermaCodigoBarras.trim();

    if (!codigo) {
      this.mermaError = 'Ingresa o escanea el código dañado';
      return;
    }
    if (!this.loteActivo) {
      this.mermaError = 'Selecciona un lote activo primero';
      return;
    }

    this.mermaSubmitting = true;
    this.mermaError      = '';
    this.cdr.detectChanges();

    this.lotesService
      .registrarMerma(codigo, this.mermaMotivo, this.loteActivo.id)
      .subscribe({
        next: (res) => {
          this.ngZone.run(() => {
            this.mermaCodigoBarras = '';
            this.mermaSubmitting   = false;

            this.contador++;
            this.log.unshift({
              num:             this.contador,
              timestamp:       new Date(),
              codigo,
              sede:            res.sede           || '—',
              lote:            res.lote           || this.loteActivo?.codigo_lote || '—',
              loteId:          this.loteActivo.id,
              cuota_total:     res.cuota_total     || 0,
              cuota_escaneada: res.cuota_escaneada || 0,
              cuota_pendiente: res.cuota_pendiente || 0,
              estado:          'merma',
              mensaje:         this.mermaMotivo,
            });

            this.cargarProgresoLote(this.loteActivo.id);
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.mermaError      = err.error?.error || 'Error desconocido';
            this.mermaSubmitting = false;
            this.cdr.detectChanges();
          });
        }
      });
  }

  // ── Helpers ─────────────────────────────────────────────
  limpiarLog(): void {
    this.log         = [];
    this.ultimaBolsa = null;
    this.errorMsg    = '';
    this.contador    = 0;
    this.cdr.detectChanges();
  }

  porcentaje(escaneadas: number, total: number): number {
    if (!total) return 0;
    return Math.min(100, Math.round((escaneadas / total) * 100));
  }

  porcentajeWidth(escaneadas: number, total: number): string {
    return this.porcentaje(escaneadas, total) + '%';
  }

  badgeEstado(estado: string): string {
    const map: Record<string, string> = {
      ok:        'badge-green',
      duplicado: 'badge-warn',
      error:     'badge-danger',
      merma:     'badge-orange',
    };
    return map[estado] ?? 'badge-muted';
  }

  labelEstado(estado: string): string {
    const map: Record<string, string> = {
      ok:        'OK',
      duplicado: 'Duplicado',
      error:     'Error',
      merma:     'Merma',
    };
    return map[estado] ?? estado;
  }

  enfocarInput(): void {
    this.scanInputRef?.nativeElement?.focus();
  }

  get camaraLabel(): string {
    const map: Record<CameraStatus, string> = {
      idle:       'Cámara inactiva',
      requesting: 'Iniciando cámara...',
      active:     '● Cámara activa',
      error:      '● Error de cámara',
    };
    return map[this.camaraStatus];
  }

  get camaraBadgeClass(): string {
    const map: Record<CameraStatus, string> = {
      idle:       'badge-muted',
      requesting: 'badge-warn',
      active:     'badge-green',
      error:      'badge-danger',
    };
    return map[this.camaraStatus];
  }
}