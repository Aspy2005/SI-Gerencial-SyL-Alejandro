import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const user = this.auth.getUser();
    const rolesPermitidos: string[] = route.data['roles'] || [];

    if (!user) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    if (rolesPermitidos.length && !rolesPermitidos.includes(user.rol)) {
      // ← antes redirigía a /dashboard, lo que recrea el Shell
      // Si el usuario está logueado pero no tiene el rol, solo bloquear
      this.router.navigate(['/dashboard']);
      return false;
    }

    return true;
  }
}