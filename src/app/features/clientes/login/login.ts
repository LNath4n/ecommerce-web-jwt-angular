import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ClientesService } from '@core/services/cliente/ClientesService';
import { AuthService } from '@core/services/auth/auth';
import { AlertaService } from '@core/services/modals/ModalsService';
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

  email = '';
  password = '';

  login() {
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
          const mensajeDefault = error instanceof HttpErrorResponse && error.status === 401
            ? 'LOGIN_PAGE.INVALID_CREDENTIALS'
            : 'LOGIN_PAGE.ERROR';
          this.alerta.error(this.translate.instant(mensajeDefault));
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