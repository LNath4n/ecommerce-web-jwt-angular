import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth';
import { ClientesService } from '@core/services/cliente/ClientesService';
import { AlertaService } from '@core/services/modals/ModalsService';
import { ClienteEditarRequest, ClientePublico } from '@core/models/cliente/clienteModels';
import { LucideUser } from '@lucide/angular';

@Component({
  selector: 'app-verperfil',
  imports: [FormsModule, LucideUser, TranslatePipe],
  styleUrl: './verperfil.css',
  templateUrl: './verperfil.html',
})
export class Verperfil implements OnInit, OnDestroy {
  private clientesService = inject(ClientesService);
  private authService = inject(AuthService);
  private alerta = inject(AlertaService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  perfil = signal<ClientePublico | null>(null);
  cargando = signal(true);
  guardando = signal(false);
  procesandoFoto = signal(false);
  fotoVistaPrevia = signal<string | null>(null);
  confirmandoFoto = signal(false);
  private fotoPendiente: File | null = null;
  private urlFotoTemporal: string | null = null;
  private readonly maximoFotoBytes = 5 * 1024 * 1024;

  email = signal('');
  nombre = signal('');
  telefono = signal('');
  passwordVieja = signal('');
  passwordNueva = signal('');

  ngOnInit() {
    this.obtenerPerfil();
  }

  ngOnDestroy() {
    this.liberarVistaPrevia();
  }

  obtenerPerfil() {
    this.cargando.set(true);
    this.clientesService.obtenerPerfil().subscribe({
      next: perfil => {
        this.perfil.set(perfil);
        this.email.set(perfil.email);
        this.nombre.set(perfil.nombre);
        this.telefono.set(perfil.telefono);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.alerta.error(this.translate.instant('PROFILE.LOAD_ERROR'));
      }
    });
  }

  guardarCambios(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }

    const perfilActual = this.perfil();
    if (!perfilActual) return;

    const request: ClienteEditarRequest = {};
    const email = (this.email() ?? '').trim();
    const nombre = (this.nombre() ?? '').trim();
    const telefono = (this.telefono() ?? '').trim();
    if (email && email !== perfilActual.email) request.email = email;
    if (nombre && nombre !== perfilActual.nombre) request.nombre = nombre;
    if (telefono && telefono !== perfilActual.telefono) request.telefono = telefono;

    if (this.passwordNueva()) {
      if (!this.passwordVieja()) {
        this.alerta.advertencia(this.translate.instant('PROFILE.CURRENT_PASSWORD_REQUIRED'));
        return;
      }
      request.passwordVieja = this.passwordVieja();
      request.passwordNueva = this.passwordNueva();
    }

    if (Object.keys(request).length === 0) {
      this.alerta.advertencia(this.translate.instant('PROFILE.NO_CHANGES'));
      return;
    }

    this.guardando.set(true);
    this.clientesService.editarPerfil(request).subscribe({
      next: perfil => {
        this.perfil.set(perfil);
        this.email.set(perfil.email);
        this.nombre.set(perfil.nombre);
        this.telefono.set(perfil.telefono);
        this.passwordVieja.set('');
        this.passwordNueva.set('');
        this.guardando.set(false);
        this.alerta.exito(this.translate.instant('PROFILE.SAVE_SUCCESS'));
      },
      error: () => {
        this.guardando.set(false);
        this.alerta.error(this.translate.instant('PROFILE.SAVE_ERROR'));
      }
    });
  }

  seleccionarFoto(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    input.value = '';
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      this.alerta.error(this.translate.instant('PROFILE.PHOTO_FORMAT_ERROR'));
      return;
    }
    if (file.size > this.maximoFotoBytes) {
      this.alerta.error(this.translate.instant('PROFILE.PHOTO_SIZE_ERROR'));
      return;
    }

    this.liberarVistaPrevia();
    this.fotoPendiente = file;
    this.urlFotoTemporal = URL.createObjectURL(file);
    this.fotoVistaPrevia.set(this.urlFotoTemporal);
    this.confirmandoFoto.set(true);
    this.alerta.solicitarConfirmacion(
      this.translate.instant('PROFILE.CONFIRM_PHOTO_TITLE'),
      this.translate.instant('PROFILE.CONFIRM_PHOTO_MESSAGE'),
      this.translate.instant('PROFILE.CONFIRM_PHOTO_ACTION')
    ).then(confirmada => {
      this.confirmandoFoto.set(false);
      if (confirmada) {
        this.subirFotoPendiente();
      } else {
        this.limpiarFotoPendiente();
      }
    });
  }

  private subirFotoPendiente() {
    const file = this.fotoPendiente;
    if (!file) return;

    this.procesandoFoto.set(true);
    this.clientesService.subirFoto(file).subscribe({
      next: perfil => {
        this.perfil.set(perfil);
        this.procesandoFoto.set(false);
        this.limpiarFotoPendiente();
        this.alerta.exito(this.translate.instant('PROFILE.PHOTO_UPDATE_SUCCESS'));
      },
      error: () => {
        this.procesandoFoto.set(false);
        this.limpiarFotoPendiente();
        this.alerta.error(this.translate.instant('PROFILE.PHOTO_UPLOAD_ERROR'));
      }
    });
  }

  quitarFoto() {
    this.procesandoFoto.set(true);
    this.clientesService.quitarFoto().subscribe({
      next: perfil => {
        this.perfil.set(perfil);
        this.procesandoFoto.set(false);
        this.alerta.exito(this.translate.instant('PROFILE.PHOTO_REMOVE_SUCCESS'));
      },
      error: () => {
        this.procesandoFoto.set(false);
        this.alerta.error(this.translate.instant('PROFILE.PHOTO_REMOVE_ERROR'));
      }
    });
  }

  desactivarCuenta() {
    this.alerta.solicitarConfirmacion(
      this.translate.instant('PROFILE.DEACTIVATE_TITLE'),
      this.translate.instant('PROFILE.DEACTIVATE_CONFIRM_MESSAGE'),
      this.translate.instant('PROFILE.DEACTIVATE_TITLE')
    ).then(confirmada => {
      if (!confirmada) return;

      this.clientesService.desactivarCuenta().subscribe({
        next: () => {
          this.authService.clearToken();
          this.alerta.exito(this.translate.instant('PROFILE.DEACTIVATE_SUCCESS'));
          this.router.navigate(['/login']);
        },
        error: () => this.alerta.error(this.translate.instant('PROFILE.DEACTIVATE_ERROR'))
      });
    });
  }

  private limpiarFotoPendiente() {
    this.fotoPendiente = null;
    this.fotoVistaPrevia.set(null);
    this.liberarVistaPrevia();
  }

  private liberarVistaPrevia() {
    if (!this.urlFotoTemporal) return;
    URL.revokeObjectURL(this.urlFotoTemporal);
    this.urlFotoTemporal = null;
  }
}
