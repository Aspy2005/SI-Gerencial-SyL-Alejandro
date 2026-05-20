import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CalidadService } from '../../../core/services/calidad';
import { LotesService } from '../../../core/services/lotes.service';

@Component({
  standalone: false,
  selector: 'app-mermas-list',
  templateUrl: './mermas-list.html',
  styleUrls: ['./mermas-list.scss']
})
export class MermasListComponent implements OnInit {

  lotes:        any[] = [];
  mermasTurno:  any[] = [];

  codigoBarras  = '';
  loteId:       number | null = null;
  tipoMerma     = 'Daño físico';
  descripcion   = '';
  errorMsg      = '';
  submitting    = false;

  constructor(
    private calidadService: CalidadService,
    private lotesService:   LotesService,
    private cdr:            ChangeDetectorRef,
    private ngZone:         NgZone
  ) {}

  ngOnInit(): void {
    this.loadLotes();
    this.loadMermas();
  }

  loadLotes(): void {
    this.lotesService.getLotes().subscribe({
      next: (data: any[]) => {
        this.ngZone.run(() => {
          this.lotes = data;
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => console.error(err)
    });
  }

  loadMermas(): void {
    this.calidadService.getMermasTurno().subscribe({
      next: (data: any[]) => {
        this.ngZone.run(() => {
          this.mermasTurno = data;
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => console.error(err)
    });
  }

  registrarMerma(): void {
    if (!this.codigoBarras.trim() || !this.loteId) {
      this.errorMsg = 'Código y lote son obligatorios';
      return;
    }

    this.submitting = true;
    this.errorMsg   = '';

    const payload = {
      codigo_barras: this.codigoBarras.trim(),
      lote_id:       this.loteId,
      motivo:        `${this.tipoMerma}${this.descripcion ? ' — ' + this.descripcion : ''}`,
    };

    this.calidadService.registrarMerma(payload).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.codigoBarras = '';
          this.descripcion  = '';
          this.submitting   = false;
          this.loadMermas();
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        this.ngZone.run(() => {
          this.errorMsg   = err.error?.error || 'Error al registrar merma';
          this.submitting = false;
          this.cdr.detectChanges();
        });
      }
    });
  }
}