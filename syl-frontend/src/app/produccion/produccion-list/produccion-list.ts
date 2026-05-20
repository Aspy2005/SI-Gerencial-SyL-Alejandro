import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ProduccionService } from '../../core/services/produccion.service';
import { MallasService } from '../../core/services/mallas.service';

@Component({
  standalone: false,
  selector: 'app-produccion-list',
  templateUrl: './produccion-list.html',
  styleUrls: ['./produccion-list.scss']
})
export class ProduccionListComponent implements OnInit {

  ordenes: any[]  = [];
  mallas: any[]   = [];
  showModal       = false;
  submitting      = false;
  errorMsg        = '';
  form!: FormGroup;

  readonly ESTADO_CLASS: Record<string, string> = {
    pendiente:     'badge-muted',
    programada:    'badge-warn',
    en_produccion: 'badge-green',
    completada:    'badge-blue',
    cancelada:     'badge-danger',
  };

  constructor(
    private fb:          FormBuilder,
    private produccion:  ProduccionService,
    private mallasService: MallasService,
    private ngZone:      NgZone,
    private cdr:         ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadOrdenes();
    this.loadMallas();
  }
onMallaChange(event: any): void {

  const mallaId = Number(event.target.value);

  const mallaSeleccionada = this.mallas.find(
    (m: any) => m.id === mallaId
  );

  if (!mallaSeleccionada) return;

  // Aplicar automáticamente total de bolsas
  this.form.patchValue({
    cantidad: mallaSeleccionada.total_unidades
  });

  console.log(
    'Cantidad aplicada:',
    mallaSeleccionada.total_unidades
  );
}
  buildForm(): void {
    this.form = this.fb.group({
      producto:  ['', Validators.required],
      malla:     [null, Validators.required],
      cantidad:  [null, [Validators.required, Validators.min(1)]],
      turno:     ['', Validators.required],
    });
  }

  loadOrdenes(): void {
    this.produccion.getOrdenes().subscribe({
      next: data => this.ngZone.run(() => {
        this.ordenes = data;
        this.cdr.detectChanges();
      }),
      error: err => console.error(err)
    });
  }

  loadMallas(): void {
    this.mallasService.getMallas().subscribe({
      next: data => this.ngZone.run(() => {
        // Solo mostrar mallas activas para asociar
        this.mallas = data.filter((m: any) => m.estado === 'activa');
        this.cdr.detectChanges();
      }),
      error: err => console.error(err)
    });
  }

  openModal(): void {
  console.log('CLICK MODAL');

  
  this.form.reset();
  this.errorMsg  = '';
  this.showModal = true;
  this.cdr.detectChanges();
}

closeModal(): void {
  this.showModal = false;
  this.cdr.detectChanges(); // ← agregar
}

  submitOrden(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMsg   = '';
    this.cdr.detectChanges();

    this.produccion.createOrden(this.form.value).subscribe({
      next: () => this.ngZone.run(() => {
        this.submitting = false;
        this.showModal  = false;
        this.loadOrdenes();
        this.cdr.detectChanges();
      }),
      error: err => this.ngZone.run(() => {
        this.submitting = false;
        this.errorMsg   = 'Error al crear la orden. Verifique los datos.';
        this.cdr.detectChanges();
        console.error(err);
      })
    });
  }

  cambiarEstado(orden: any, nuevoEstado: string): void {
    this.produccion.updateOrden(orden.id, { estado: nuevoEstado }).subscribe({
      next: () => this.ngZone.run(() => {
        orden.estado         = nuevoEstado;
        orden.estado_display = this.estadoLabel(nuevoEstado);
        this.cdr.detectChanges();
      }),
      error: err => console.error(err)
    });
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      pendiente:     'Pendiente',
      programada:    'Programada',
      en_produccion: 'En Producción',
      completada:    'Completada',
      cancelada:     'Cancelada',
    };
    return map[estado] ?? estado;
  }

  // Helpers para validación en template
  invalid(campo: string): boolean {
    const c = this.form.get(campo);
    return !!(c && c.invalid && c.touched);
  }
}