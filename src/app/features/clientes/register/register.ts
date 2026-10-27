import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ClientesService } from '@core/services/cliente/ClientesService';
import { AlertaService } from '@core/services/modals/ModalsService';
import { Router } from '@angular/router';

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

  email = '';
  password = '';

  registro() {
    this.clientesService.create({ email: this.email, password: this.password })
      .subscribe({
        next: () => {
          this.alerta.exito(
            this.translate.instant('REGISTER_PAGE.SUCCESS_MESSAGE'),
            this.translate.instant('REGISTER_PAGE.SUCCESS_TITLE')
          );
        },
        error: () => {
          this.alerta.error(this.translate.instant('REGISTER_PAGE.ERROR'));
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