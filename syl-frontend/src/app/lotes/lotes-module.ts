import { NgModule } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { LotesRoutingModule } from './lotes-routing-module';

import { SharedModule } from '../shared/shared-module';

import { LotesListComponent } from './lotes-list/lotes-list';

@NgModule({

  declarations: [
    LotesListComponent
  ],

  imports: [

    CommonModule,

    FormsModule,

    ReactiveFormsModule,

    LotesRoutingModule,

    SharedModule

  ]

})

export class LotesModule {}