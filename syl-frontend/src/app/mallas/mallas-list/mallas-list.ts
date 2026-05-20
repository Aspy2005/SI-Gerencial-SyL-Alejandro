import {
  Component,
  OnInit,
  ChangeDetectorRef,
  NgZone
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { MallasService } from '../../core/services/mallas.service';

@Component({
  selector: 'app-mallas-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './mallas-list.html',
  styleUrls: ['./mallas-list.scss']
})
export class MallasListComponent implements OnInit {

  mallaSeleccionada: any = null;
  previewData: any[] = [];
  previewReady = false;
  uploading = false;
  uploadDone = false;
  selectedFile!: File;
  mallas: any[] = [];
  totalSedes = 0;
  totalUnidades = 0;

  constructor(
    private mallasService: MallasService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadMallas();
  }

  loadMallas(): void {
    this.mallasService.getMallas().subscribe({
      next: (data: any) => {
        this.ngZone.run(() => {
          this.mallas = data;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error(err); 
      }
    });
  }

  verMalla(malla: any): void {
    this.mallaSeleccionada = malla;
    this.cdr.detectChanges();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;
    this.selectedFile = file;
    this.uploadFile();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (!event.dataTransfer?.files.length) return;
    this.selectedFile = event.dataTransfer.files[0];
    this.uploadFile();
  }

  uploadFile(): void {
    if (!this.selectedFile) return;

    const formData = new FormData();
    formData.append('archivo', this.selectedFile);

    this.ngZone.run(() => {
      this.uploading = true;
      this.uploadDone = false;
      this.previewReady = false;
      this.previewData = [];
      this.totalSedes = 0;
      this.totalUnidades = 0;
      this.cdr.detectChanges();
    });

    this.mallasService.previewMalla(formData).subscribe({
      next: (data: any) => {
        this.ngZone.run(() => {
          this.previewData   = data.sedes || [];
          this.totalSedes    = data.total_sedes || 0;
          this.totalUnidades = data.total_unidades || 0;
          this.uploading     = false;
          this.uploadDone    = true;
          this.previewReady  = true;
          this.cdr.detectChanges();
        });
      },
      error: (error) => {
        this.ngZone.run(() => {
          console.error(error);
          this.uploading    = false;
          this.uploadDone   = false;
          this.previewReady = false;
          this.cdr.detectChanges();
          alert('Error procesando archivo');
        });
      }
    });
  }

  guardarMalla(): void {
    if (!this.selectedFile) {
      alert('Seleccione un archivo');
      return;
    }

    const formData = new FormData();
    formData.append('archivo', this.selectedFile);
    formData.append('nombre_ruta', this.selectedFile.name);
    formData.append('fecha_distribucion', new Date().toISOString().split('T')[0]);
    formData.append('formato', this.selectedFile.name.endsWith('.pdf') ? 'pdf' : 'xlsx');
    formData.append('observaciones', '');

    this.ngZone.run(() => {
      this.uploading = true;
      this.cdr.detectChanges();
    });

    this.mallasService.uploadMalla(formData).subscribe({
      next: (response: any) => {
        this.ngZone.run(() => {
          this.uploading        = false;
          this.previewReady     = false;
          this.uploadDone       = false;
          this.previewData      = [];
          this.totalSedes       = 0;
          this.totalUnidades    = 0;
          this.selectedFile     = null as any;
          this.mallaSeleccionada = response;
          this.loadMallas();
          this.cdr.detectChanges();
          alert('Malla guardada correctamente');
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          console.error(err);
          this.uploading = false;
          this.cdr.detectChanges();
          alert('Error guardando malla');
        });
      }
    });
  }
}