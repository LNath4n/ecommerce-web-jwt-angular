import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ClientesService } from '@core/services/cliente/ClientesService'; // ajusta el path
import { ErrorMensajesService } from '@core/services/errores/ErrorMensajesService';

type EstadoVerificacion = 'cargando' | 'exito' | 'error' | 'sinToken';

@Component({
  imports: [TranslatePipe],
  selector: 'app-verificar-correo',
  styleUrl: './verificar-correo.css',
  templateUrl: './verificar-correo.html',
})
export class VerificarCorreo implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private clientesService = inject(ClientesService);
  private errores = inject(ErrorMensajesService);

  estado = signal<EstadoVerificacion>('cargando');

  // Clave de traducción del error (el HTML hace {{ claveError() | translate }})
  claveError = signal<string>('VERIFY_EMAIL.GENERIC_ERROR');

  ngOnInit() {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.estado.set('sinToken');
      return;
    }

    this.verificar(token);
  }

  private verificar(token: string) {
    this.estado.set('cargando');

    this.clientesService.verifyEmail(token).subscribe({
      next: () => this.estado.set('exito'),
      error: error => {
        // 400 = token inválido, expirado o ya usado
        this.claveError.set(
          this.errores.tieneStatus(error, 400)
            ? 'VERIFY_EMAIL.INVALID_TOKEN'
            : 'VERIFY_EMAIL.GENERIC_ERROR'
        );
        this.estado.set('error');
      },
    });
  }

  irALogin() {
    this.router.navigate(['/login']);
  }

  irAlInicio() {
    this.router.navigate(['/']);
  }
}