import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  standalone: false,
  selector: 'app-topbar',
  templateUrl: './topbar.html',
  styleUrls: ['./topbar.scss']
})
export class TopbarComponent {
  pageTitle = 'Dashboard General';
  pageBreadcrumb = 'Sistema S&L › Principal';

  private titles: Record<string, [string, string]> = {
    '/dashboard':  ['Dashboard General',           'Sistema S&L › Principal'],
    '/mallas':     ['Carga de Mallas Logísticas',  'Sistema S&L › Mallas Logísticas'],
    '/lotes':      ['Gestión de Lotes & BarTender','Sistema S&L › Operación › Lotes'],
    '/produccion': ['Órdenes de Producción',       'Sistema S&L › Producción'],
  };

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      const match = this.titles[e.urlAfterRedirects];
      if (match) { this.pageTitle = match[0]; this.pageBreadcrumb = match[1]; }
    });
  }
}