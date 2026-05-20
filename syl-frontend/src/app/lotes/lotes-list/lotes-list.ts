import {
  Component,
  OnInit,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import { LotesService } from '../../core/services/lotes.service';
import { ProduccionService } from '../../core/services/produccion.service';

@Component({
  standalone: false,
  selector: 'app-lotes-list',
  templateUrl: './lotes-list.html',
  styleUrls: ['./lotes-list.scss']
})
export class LotesListComponent implements OnInit {

  lotes: any[] = [];
  ordenes: any[] = [];

  showModal = false;

  submitting = false;

  form!: FormGroup;

  readonly ESTADO_CLASS: Record<string, string> = {

    generado: 'badge-muted',

    en_cola: 'badge-warn',

    enviado: 'badge-green',

    error_api: 'badge-danger',

    completado: 'badge-blue',
  };

  constructor(
    private lotesService: LotesService,
    private produccionService: ProduccionService,
    private fb: FormBuilder,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}
loteSeleccionado: any = null;

  verLote(lote: any): void {

  this.loteSeleccionado = lote;

}
  ngOnInit(): void {

    this.buildForm();

    this.loadLotes();

    this.loadOrdenes();
  }
openModal(): void {

  console.log('MODAL ABIERTO');

  this.showModal = true;
}
  buildForm(): void {

    this.form = this.fb.group({

      orden: [null, Validators.required]

    });
  }
eliminarLote(lote: any): void {
  const confirmar = confirm(
    `¿Estás seguro de eliminar el lote ${lote.codigo_lote}? Esta acción no se puede deshacer.`
  );
  if (!confirmar) return;

  this.lotesService.deleteLote(lote.id).subscribe({
    next: () => {
      this.ngZone.run(() => {
        this.loadLotes();
        this.cdr.detectChanges();
      });
    },
    error: (err) => console.error('Error al eliminar lote', err)
  });
}
  loadLotes(): void {

    this.lotesService.getLotes().subscribe({

      next: (data) => {

        this.ngZone.run(() => {

          this.lotes = data;

          this.cdr.detectChanges();
        });
      },

      error: (err) => console.error(err)
    });
  }

  loadOrdenes(): void {

    this.produccionService.getOrdenes().subscribe({

      next: (data) => {

        this.ngZone.run(() => {

          this.ordenes = data.filter(
            (o: any) => o.estado !== 'cancelada'
          );

          this.cdr.detectChanges();
        });
      },

      error: (err) => console.error(err)
    });
  }

  generarLote(): void {
    if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
    }

    const ordenId = this.form.value.orden;
    const orden = this.ordenes.find((o: any) => o.id === Number(ordenId));

    if (!orden) return;

    // Solo enviar orden — el backend lee la malla desde ahí
    const payload = {
        orden: orden.id,
        producto: orden.producto,
        cantidad: orden.cantidad,
        estado: 'generado'
    };

    this.submitting = true;
    this.cdr.detectChanges();

    this.lotesService.createLote(payload).subscribe({
        next: () => {
            this.ngZone.run(() => {
                this.submitting = false;
                this.showModal = false;
                this.form.reset();
                this.loadLotes();
                this.cdr.detectChanges();
            });
        },
        error: (err) => {
            this.ngZone.run(() => {
                console.error('ERROR BACKEND', err.error);
                this.submitting = false;
                this.cdr.detectChanges();
            });
        }
    });
}

  enviarLote(lote: any): void {

    this.lotesService.enviarBartender(lote.id).subscribe({

      next: () => {

        this.loadLotes();
      },

      error: (err) => {

        console.error(err);

        this.loadLotes();
      }
    });
  }

  enviarTodos(): void {

    this.lotesService.enviarTodos().subscribe({

      next: () => {

        this.loadLotes();
      },

      error: (err) => console.error(err)
    });
  }
}