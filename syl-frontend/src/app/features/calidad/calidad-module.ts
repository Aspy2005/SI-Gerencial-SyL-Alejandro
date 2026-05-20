import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CalidadRoutingModule } from './calidad-routing-module';
import { CalidadListComponent } from './calidad-list/calidad-list';

@NgModule({
  declarations: [CalidadListComponent],
  imports: [
    CommonModule,
    FormsModule,
    CalidadRoutingModule,
  ]
})
export class CalidadModule {}