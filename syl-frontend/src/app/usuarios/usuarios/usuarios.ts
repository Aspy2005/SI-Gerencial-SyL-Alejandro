import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { UsuariosService, Usuario, CrearUsuario } from '../../core/services/usuarios';
import { AuthService } from '../../core/services/auth';

@Component({
  standalone: false,
  selector: 'app-usuarios',
  templateUrl: './usuarios.html',
  styleUrls: ['./usuarios.scss']
})
export class UsuariosComponent implements OnInit {

  usuarios: Usuario[]       = [];
  cargando                  = true;
  mostrarForm               = false;
  modoEdicion               = false;
  editandoId: number | null = null;
  guardando                 = false;
  errorMsg                  = '';
  usuarioActual: any        = null;

  form: CrearUsuario = this.formVacio();

  readonly roles = [
    { value: 'jefe_planta',      label: 'Jefe de Planta',     badge: 'badge-green', icon: '🏭' },
    { value: 'operario',         label: 'Operario',            badge: 'badge-blue',  icon: '👷' },
    { value: 'analista_calidad', label: 'Analista de Calidad', badge: 'badge-warn',  icon: '🔬' },
  ];

  constructor(
    private svc:  UsuariosService,
    private auth: AuthService,
    private cdr:  ChangeDetectorRef
  ) {
    this.usuarioActual = this.auth.getUser();
  }

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando = true;
    this.svc.getUsuarios().subscribe({
      next:  (data) => { this.usuarios = data; this.cargando = false; this.cdr.detectChanges(); },
      error: ()     => { this.cargando = false; this.cdr.detectChanges(); }
    });
  }

  abrirNuevo(): void {
    this.form        = this.formVacio();
    this.modoEdicion = false;
    this.editandoId  = null;
    this.errorMsg    = '';
    this.mostrarForm = true;
  }

  abrirEdicion(u: Usuario): void {
    this.form = {
      username:   u.username,
      email:      u.email,
      first_name: u.first_name,
      last_name:  u.last_name,
      rol:        u.rol,
      password:   '',
    };
    this.modoEdicion = true;
    this.editandoId  = u.id;
    this.errorMsg    = '';
    this.mostrarForm = true;
  }

  cerrarForm(): void {
    this.mostrarForm = false;
    this.editandoId  = null;
  }

  guardar(): void {
    if (!this.form.username || !this.form.email || !this.form.rol) {
      this.errorMsg = 'Username, correo y rol son obligatorios.';
      return;
    }
    if (!this.modoEdicion && !this.form.password) {
      this.errorMsg = 'La contraseña es obligatoria para nuevos usuarios.';
      return;
    }

    this.guardando = true;
    this.errorMsg  = '';

    const obs$ = this.modoEdicion
      ? this.svc.actualizarUsuario(this.editandoId!, {
          first_name: this.form.first_name,
          last_name:  this.form.last_name,
          email:      this.form.email,
          rol:        this.form.rol as any,
        })
      : this.svc.crearUsuario(this.form);

    obs$.subscribe({
      next: () => {
        this.guardando   = false;
        this.mostrarForm = false;
        this.editandoId  = null;
        this.cargar();
      },
      error: (e) => {
        this.guardando = false;
        this.errorMsg  = e?.error?.username?.[0]
                      ?? e?.error?.detail
                      ?? 'Error al guardar. Verifica los datos.';
        this.cdr.detectChanges();
      }
    });
  }

  toggleActivo(u: Usuario): void {
    this.svc.toggleActivo(u.id, !u.activo).subscribe({ next: () => this.cargar() });
  }

  rolLabel(rol: string): string { return this.roles.find(r => r.value === rol)?.label ?? rol; }
  rolBadge(rol: string): string { return this.roles.find(r => r.value === rol)?.badge ?? 'badge-muted'; }
  esMiPerfil(u: Usuario): boolean { return u.username === this.usuarioActual?.username; }

  private formVacio(): CrearUsuario {
    return { username: '', email: '', first_name: '', last_name: '', rol: 'operario', password: '' };
  }
}