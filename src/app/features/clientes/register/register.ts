import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ClientesService } from '@core/services/cliente/ClientesService';
import { AlertaService } from '@core/services/modals/ModalsService';
import { ErrorMensajesService } from '@core/services/errores/ErrorMensajesService';
import { Router } from '@angular/router';

type ErroresForm = { email?: string; password?: string };

@Component({
  selector: 'app-Register',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

  private clientesService = inject(ClientesService);
  private alerta = inject(AlertaService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  // Ojo: "errores" ya es el signal de errores del formulario
  private mensajesError = inject(ErrorMensajesService);

  email = '';
  password = '';

  errores = signal<ErroresForm>({});
  cargando = signal(false);

  private validar(): boolean {
    const nuevos: ErroresForm = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!this.email?.trim()) {
      nuevos.email = 'REGISTER_PAGE.ERRORS.EMAIL_REQUIRED';
    } else if (!emailRegex.test(this.email.trim())) {
      nuevos.email = 'REGISTER_PAGE.ERRORS.EMAIL_INVALID';
    }

    if (!this.password) {
      nuevos.password = 'REGISTER_PAGE.ERRORS.PASSWORD_REQUIRED';
    } else if (this.password.length < 8 || this.password.length > 72) {
      nuevos.password = 'REGISTER_PAGE.ERRORS.PASSWORD_LENGTH';
    }

    this.errores.set(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  limpiarError(campo: 'email' | 'password') {
    this.errores.update(e => ({ ...e, [campo]: undefined }));
  }

  registro() {
    if (this.cargando() || !this.validar()) return;
    this.cargando.set(true);

    this.clientesService.create({ email: this.email.trim(), password: this.password })
      .subscribe({
        next: () => {
          this.cargando.set(false);
          this.alerta.exito(
            this.translate.instant('REGISTER_PAGE.SUCCESS_MESSAGE'),
            this.translate.instant('REGISTER_PAGE.SUCCESS_TITLE')
          );
        },
        error: (error: HttpErrorResponse) => {
          this.cargando.set(false);

          // 409: el correo ya existe -> error debajo del campo
          if (error.status === 409) {
            this.errores.set({ email: 'REGISTER_PAGE.EMAIL_ALREADY_REGISTERED' });
            return;
          }

          // 400: validación del backend -> errores debajo de cada campo
          if (error.status === 400) {
            const e = error.error?.errors;
            const nuevos: ErroresForm = {};
            if (e?.email) nuevos.email = 'REGISTER_PAGE.ERRORS.EMAIL_INVALID';
            if (e?.password) nuevos.password = 'REGISTER_PAGE.ERRORS.PASSWORD_INVALID';

            if (nuevos.email || nuevos.password) {
              this.errores.set(nuevos);
              return;
            }
          }

          // Todo lo demás (sin conexión, 5xx, otros 400...) -> alerta explícita
          this.alerta.error(
            this.mensajesError.resolver(error, { porDefecto: 'REGISTER_PAGE.ERROR' })
          );
        }
      });
  }

  irLogin() {
    this.router.navigate(['/login']);
  }

  regresar() {
    this.router.navigate(['/']);
  }
}