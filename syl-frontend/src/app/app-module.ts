import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing-module';
import { AppComponent } from './app';

import { CoreModule } from './core/core-module';
import { SharedModule } from './shared/shared-module'; // ← agregar

import { AuthInterceptor } from './core/interceptors/auth-interceptor';
import { InventarioComponent } from './inventario/inventario';
import { LiberacionComponent } from './liberacion.component/liberacion.component';

@NgModule({
  declarations: [AppComponent],

  imports: [
    BrowserModule,
    AppRoutingModule,
    CoreModule,
    HttpClientModule,
    SharedModule, // ← agregar
  ],

  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],

  bootstrap: [AppComponent],
})
export class AppModule {}
