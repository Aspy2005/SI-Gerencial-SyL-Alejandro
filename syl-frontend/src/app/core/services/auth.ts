import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'auth_token';
  private userKey  = 'current_user';

  private userSubject: BehaviorSubject<any>;
  user$: Observable<any>;

  constructor(private http: HttpClient, private router: Router) {
    // ← inicializar en el constructor, no en la declaración
    // Así cuando RoleGuard se instancia, localStorage ya está disponible
    const stored = localStorage.getItem(this.userKey);
    const initialUser = stored ? JSON.parse(stored) : null;
    this.userSubject = new BehaviorSubject<any>(initialUser);
    this.user$ = this.userSubject.asObservable();
  }

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/login/`, { username, password }).pipe(
      tap((res: any) => {
        localStorage.setItem(this.tokenKey, res.access);
        localStorage.setItem(this.userKey, JSON.stringify(res.user));
        this.userSubject.next(res.user);
      }),
      catchError((err) => { throw err; })
    );
  }

  getUser(): any {
    // Leer siempre del subject, no de localStorage directamente
    return this.userSubject.getValue();
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.userSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.userSubject.getValue();
  }
}