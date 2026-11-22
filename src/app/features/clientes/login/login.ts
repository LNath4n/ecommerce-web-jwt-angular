import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ClientesService } from '@core/services/cliente/ClientesService';
import { AuthService } from '@core/services/auth/auth';
import { AlertaService } from '@core/services/modals/ModalsService';
import { ErrorMensajesService, OpcionesError } from '@core/services/errores/ErrorMensajesService';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  private clientesService = inject(ClientesService);
  private authService = inject(AuthService);
  private alerta = inject(AlertaService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private errores = inject(ErrorMensajesService);

  email = '';
  password = '';

  // true cuando el backend respondió 403 (correo sin verificar)
  correoNoVerificado = signal(false);
  reenviando = signal(false);

  private readonly opcionesError: OpcionesError = {
    porDefecto: 'LOGIN_PAGE.ERROR',
    prefijoCampos: 'LOGIN_PAGE.ERRORS.FIELD_',
    reglas: [
      // En el login, un 401 significa credenciales incorrectas (no sesión expirada)
      { status: 401, clave: 'LOGIN_PAGE.INVALID_CREDENTIALS' },
    ],
  };

  login() {
    this.correoNoVerificado.set(false);

    this.clientesService.login({ email: this.email, password: this.password })
      .subscribe({
        next: (res) => {
          this.authService.setToken(res.token);
          this.alerta.exito(
            this.translate.instant('LOGIN_PAGE.SUCCESS_MESSAGE'),
            this.translate.instant('LOGIN_PAGE.SUCCESS_TITLE')
          );
          this.irProductos();
        },
        error: error => {
          // 403 = correo sin verificar: mostramos el aviso con el botón de reenviar
          if (this.errores.tieneStatus(error, 403)) {
            this.correoNoVerificado.set(true);
            return;
          }
          this.alerta.error(this.errores.resolver(error, this.opcionesError));
        }
      });
  }

  reenviarVerificacion() {
    if (this.reenviando()) return;
    this.reenviando.set(true);

    this.clientesService.resendVerification(this.email).subscribe({
      next: () => {
        this.reenviando.set(false);
        this.alerta.exito(this.translate.instant('LOGIN_PAGE.RESEND_SUCCESS'));
      },
      error: error => {
        this.reenviando.set(false);
        this.alerta.error(this.errores.resolver(error, this.opcionesError));
      }
    });
  }

  irProductos() {
    this.router.navigate(['/productos']);
  }

  irRegistro() {
    this.router.navigate(['/registro']);
  }

  regresar() {
    this.router.navigate(['/']);
  }
}