import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from '../../core/services/auth';

@Component({
  standalone: false,
  selector: 'app-sidebar',
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  userName     = '';
  userRole     = '';
  userRol      = '';
  userInitials = '';

  private sub!: Subscription;

  private rolLabels: Record<string, string> = {
    jefe_planta:      'Jefe de Planta',
    operario:         'Operario',
    analista_calidad: 'Analista de Calidad'
  };

  constructor(private authService: AuthService) {}

  ngOnInit(): void {

    console.log('=== SIDEBAR INIT ===');
  console.log('user$ value:', this.authService['userSubject'].getValue());
    // Suscripción reactiva: se ejecuta al inicio Y cada vez que el usuario cambia
    this.sub = this.authService.user$.subscribe(user => {

      console.log('=== SIDEBAR user$ emitió ===', user);
      if (user) {
        this.userName     = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.username;
        this.userRole     = this.rolLabels[user.rol] ?? user.rol;
        this.userRol      = user.rol;
        this.userInitials = this.getInitials(this.userName);
      } else {
        this.userName     = '';
        this.userRole     = '';
        this.userRol      = '';
        this.userInitials = '';
      }console.log('=== userRol quedó en:', this.userRol, '===');
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  logout(): void {
    this.authService.logout();
  }

  
}