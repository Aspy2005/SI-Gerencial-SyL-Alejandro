import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MermasRoutingModule } from './mermas-routing-module';
import { MermasListComponent } from './mermas-list/mermas-list';

@NgModule({
  declarations: [MermasListComponent],
  imports: [
    CommonModule,
    FormsModule,
    MermasRoutingModule,
  ]
})
export class MermasModule {}