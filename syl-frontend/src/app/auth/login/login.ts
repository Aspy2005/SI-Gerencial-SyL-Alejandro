import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  selectedRole = 'jefe';
  error = '';
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
  if (this.loginForm.invalid) {
    this.error = 'Por favor completa todos los campos';
    this.cdr.detectChanges();
    return;
  }

  const rolMap: any = {
    'jefe':     'jefe_planta',
    'operario': 'operario',
    'analista': 'analista_calidad'
  };

  this.loading = true;
  this.error = '';

  const { username, password } = this.loginForm.value;

  this.authService.login(username, password).subscribe({
    next: (res) => {
      this.loading = false;
      const rolUsuario = res.user?.rol;
      const rolSeleccionado = rolMap[this.selectedRole];

      if (rolUsuario !== rolSeleccionado) {
        this.authService.logout();
        this.error = 'El perfil seleccionado no corresponde a tu usuario';
        this.cdr.detectChanges();
        return;
      }

      this.router.navigate(['/dashboard']);
    },
    error: (err) => {
      this.loading = false;
      this.error = err.status === 401
        ? 'Usuario o contraseña incorrectos'
        : 'Error de conexión con el servidor';
      this.cdr.detectChanges();
    }
  });
}
}