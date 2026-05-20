import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'error';

export interface ScanResult {
  value: string;
  format: string;
}

@Injectable({ providedIn: 'root' })
export class BarcodeCameraService implements OnDestroy {

  private statusSubject  = new BehaviorSubject<CameraStatus>('idle');
  private resultSubject  = new Subject<ScanResult>();
  private errorSubject   = new BehaviorSubject<string>('');
  private devicesSubject = new BehaviorSubject<MediaDeviceInfo[]>([]);

  status$  = this.statusSubject.asObservable();
  result$  = this.resultSubject.asObservable();
  error$   = this.errorSubject.asObservable();
  devices$ = this.devicesSubject.asObservable();

  private codeReader:    BrowserMultiFormatReader;
  private activeStream:  MediaStream | null = null;
  private scanning       = false;
  private videoEl:       HTMLVideoElement | null = null;
  private currentDevice  = '';

  // Canvas offscreen para decode manual
  private canvas  = document.createElement('canvas');
  private ctx     = this.canvas.getContext('2d', { willReadFrequently: true })!;
  private rafId:  number | null = null;

  constructor(private ngZone: NgZone) {
    this.codeReader = this.createReader();
  }

  // ── Crear reader con hints amplios ──────────────────────
  private createReader(): BrowserMultiFormatReader {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    return new BrowserMultiFormatReader(hints);
  }

  // ── Listar cámaras ──────────────────────────────────────
  async getDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const temp = await navigator.mediaDevices.getUserMedia({ video: true });
      temp.getTracks().forEach(t => t.stop());

      const all     = await navigator.mediaDevices.enumerateDevices();
      const cameras = all.filter(d => d.kind === 'videoinput');
      this.devicesSubject.next(cameras);
      return cameras;
    } catch (err) {
      this.errorSubject.next('No se pudo acceder a las cámaras.');
      return [];
    }
  }

  // ── Iniciar escaneo ─────────────────────────────────────
  async startScan(videoElement: HTMLVideoElement, deviceId?: string): Promise<void> {
    this.stopScan();
    this.statusSubject.next('requesting');
    this.errorSubject.next('');

    try {
      const devices = await this.getDevices();
      if (!devices.length) throw new Error('No se encontraron cámaras.');

      const selectedId = deviceId || devices[0].deviceId;
      this.currentDevice = selectedId;
      this.videoEl       = videoElement;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId:   selectedId ? { exact: selectedId } : undefined,
          facingMode: { ideal: 'environment' },
          width:      { ideal: 1280 },
          height:     { ideal: 720 },
          frameRate:  { ideal: 30, min: 15 },
        },
        audio: false,
      });

      this.activeStream        = stream;
      videoElement.srcObject   = stream;
      videoElement.muted       = true;
      videoElement.setAttribute('playsinline', 'true');

      await videoElement.play();

      this.scanning = true;
      this.statusSubject.next('active');

      // Usar loop manual con requestAnimationFrame en lugar de decodeFromVideoDevice
      this.startRafLoop(videoElement);

    } catch (err: any) {
      this.ngZone.run(() => {
        this.errorSubject.next(this.friendlyError(err));
        this.statusSubject.next('error');
        this.scanning = false;
      });
    }
  }

  // ── Loop de decode frame a frame ────────────────────────
  private startRafLoop(video: HTMLVideoElement): void {
    let lastDecode = 0;
    const INTERVAL_MS = 200; // intenta decodificar cada 200ms

    const loop = (ts: number) => {
      if (!this.scanning) return;

      if (ts - lastDecode >= INTERVAL_MS) {
        lastDecode = ts;
        this.decodeFrame(video);
      }

      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  // ── Decode de un frame ───────────────────────────────────
  private decodeFrame(video: HTMLVideoElement): void {
    if (video.readyState < video.HAVE_ENOUGH_DATA) return;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    this.canvas.width  = video.videoWidth;
    this.canvas.height = video.videoHeight;
    this.ctx.drawImage(video, 0, 0);

    try {
      const result = this.codeReader.decodeFromCanvas(this.canvas);

      if (result) {
        const text = result.getText();
        this.ngZone.run(() => {
          this.resultSubject.next({
            value:  text,
            format: result.getBarcodeFormat().toString(),
          });
        });
      }
    } catch {
      // NotFoundException normal entre frames — ignorar
    }
  }

  // ── Cambiar cámara ──────────────────────────────────────
  async switchDevice(videoElement: HTMLVideoElement, deviceId: string): Promise<void> {
    await this.startScan(videoElement, deviceId);
  }

  // ── Detener escaneo ─────────────────────────────────────
  stopScan(): void {
    this.scanning = false;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.activeStream) {
      this.activeStream.getTracks().forEach(t => t.stop());
      this.activeStream = null;
    }

    this.codeReader = this.createReader();
    this.videoEl    = null;
    this.statusSubject.next('idle');
  }

  get isScanning(): boolean { return this.scanning; }

  ngOnDestroy(): void { this.stopScan(); }

  private friendlyError(err: any): string {
    const msg = err?.message || String(err);
    if (msg.includes('Permission denied') || msg.includes('NotAllowedError'))
      return 'Permiso de cámara denegado.';
    if (msg.includes('NotFoundError'))
      return 'No se encontró ninguna cámara.';
    if (msg.includes('NotReadableError'))
      return 'La cámara está siendo usada por otra aplicación.';
    return msg || 'Error desconocido.';
  }
}