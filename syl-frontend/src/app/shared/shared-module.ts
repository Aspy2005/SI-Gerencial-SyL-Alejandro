import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';  // ← ya estaba pero falta en imports
import { RouterModule } from '@angular/router';
import { ShellComponent } from './shell/shell';
import { SidebarComponent } from './sidebar/sidebar';
import { TopbarComponent } from './topbar/topbar';

@NgModule({
  declarations: [ShellComponent, SidebarComponent, TopbarComponent],
  imports: [
    CommonModule,   // ← esto es lo que faltaba
    RouterModule
  ],
  exports: [ShellComponent, SidebarComponent, TopbarComponent]
})
export class SharedModule {}