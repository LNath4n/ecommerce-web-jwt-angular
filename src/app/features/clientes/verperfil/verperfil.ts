import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth';
import { ClientesService } from '@core/services/cliente/ClientesService';
import { AlertaService } from '@core/services/modals/ModalsService';
import {
  ErrorMensajesService,
  OpcionesError,
  ReglaError,
} from '@core/services/errores/ErrorMensajesService';
import {
  PublicCustomerResponse,
  UpdateCustomerRequest,
} from '@core/models/cliente/clienteModels';
import {PageHero} from '../../layout/page-hero/page-hero';

import { LucideUser } from '@lucide/angular';

type ContextoError = 'cargar' | 'guardar' | 'foto' | 'desactivar';

@Component({
  selector: 'app-verperfil',
  imports: [FormsModule, LucideUser, TranslatePipe, PageHero],
  styleUrl: './verperfil.css',
  templateUrl: './verperfil.html',
})
export class Verperfil implements OnInit, OnDestroy {
  private clientesService = inject(ClientesService);
  private authService = inject(AuthService);
  private alerta = inject(AlertaService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private errores = inject(ErrorMensajesService);

  perfil = signal<PublicCustomerResponse | null>(null);
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
  cerrarSesiones = signal(false);

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
        this.aplicarPerfil(perfil);
        this.cargando.set(false);
      },
      error: error => {
        this.cargando.set(false);
        this.mostrarError(error, 'PROFILE.LOAD_ERROR', 'cargar');
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

    const request: UpdateCustomerRequest = {};
    const email = (this.email() ?? '').trim();
    const nombre = (this.nombre() ?? '').trim();
    const telefono = (this.telefono() ?? '').trim();
    if (email && email !== perfilActual.email) request.email = email;
    if (nombre && nombre !== perfilActual.name) request.name = nombre;
    if (telefono && telefono !== perfilActual.phone) request.phone = telefono;

    if (this.passwordNueva()) {
      if (!this.passwordVieja()) {
        this.alerta.advertencia(this.translate.instant('PROFILE.CURRENT_PASSWORD_REQUIRED'));
        return;
      }
      request.currentPassword = this.passwordVieja();
      request.newPassword = this.passwordNueva();
    }

    const cerrarSesiones = this.cerrarSesiones();
    if (cerrarSesiones) request.closeSessions = true;

    if (Object.keys(request).length === 0) {
      this.alerta.advertencia(this.translate.instant('PROFILE.NO_CHANGES'));
      return;
    }

    this.guardando.set(true);
    this.clientesService.editarPerfil(request).subscribe({
      next: () => {
        if (cerrarSesiones) {
          this.passwordVieja.set('');
          this.passwordNueva.set('');
          this.authService.clearToken();
          this.guardando.set(false);
          this.alerta.exito(this.translate.instant('PROFILE.SESSIONS_CLOSED_SUCCESS'));
          this.router.navigate(['/login']);
          return;
        }

        this.passwordVieja.set('');
        this.passwordNueva.set('');
        this.clientesService.obtenerPerfil().subscribe({
          next: perfil => {
            this.aplicarPerfil(perfil);
            this.guardando.set(false);
            this.alerta.exito(this.translate.instant('PROFILE.SAVE_SUCCESS'));
          },
          error: error => {
            this.guardando.set(false);
            this.mostrarError(error, 'PROFILE.LOAD_ERROR', 'cargar');
          }
        });
      },
      error: error => {
        this.guardando.set(false);
        this.mostrarError(error, 'PROFILE.SAVE_ERROR', 'guardar');
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
      error: error => {
        this.procesandoFoto.set(false);
        this.limpiarFotoPendiente();
        this.mostrarError(error, 'PROFILE.PHOTO_UPLOAD_ERROR', 'foto');
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
      error: error => {
        this.procesandoFoto.set(false);
        this.mostrarError(error, 'PROFILE.PHOTO_REMOVE_ERROR', 'foto');
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
        error: error => this.mostrarError(error, 'PROFILE.DEACTIVATE_ERROR', 'desactivar')
      });
    });
  }

  private limpiarFotoPendiente() {
    this.fotoPendiente = null;
    this.fotoVistaPrevia.set(null);
    this.liberarVistaPrevia();
  }

  private aplicarPerfil(perfil: PublicCustomerResponse) {
    this.perfil.set(perfil);
    this.email.set(perfil.email);
    this.nombre.set(perfil.name ?? '');
    this.telefono.set(perfil.phone ?? '');
    this.authService.setClientePublico(perfil);
  }

  private mostrarError(error: unknown, mensajePorDefecto: string, contexto?: ContextoError) {
    this.alerta.error(this.errores.resolver(error, this.opcionesError(mensajePorDefecto, contexto)));
  }

  private opcionesError(porDefecto: string, contexto?: ContextoError): OpcionesError {
    const reglas: ReglaError[] = [];

    // Al guardar, un 401 significa que la contraseña actual es incorrecta
    if (contexto === 'guardar') {
      reglas.push({ status: 401, clave: 'PROFILE.ERRORS.CURRENT_PASSWORD_WRONG' });
    }

reglas.push(
  { status: 400, contiene: 'Unsupported format', clave: 'PROFILE.PHOTO_FORMAT_ERROR' },
  { status: 400, contiene: 'not a valid image', clave: 'PROFILE.ERRORS.PHOTO_INVALID' },
  { status: 400, contiene: 'does not match its format', clave: 'PROFILE.ERRORS.PHOTO_MISMATCH' },
  { status: 400, contiene: 'too large', clave: 'PROFILE.ERRORS.PHOTO_DIMENSIONS' },
  { status: 400, contiene: 'Could not process', clave: 'PROFILE.ERRORS.PHOTO_PROCESS' },
  { status: 400, contiene: 'must be provided', clave: 'PROFILE.ERRORS.PHOTO_MISSING' },
  { status: 400, contiene: "'file'", clave: 'PROFILE.ERRORS.PHOTO_MISSING' },

  { status: 404, clave: 'PROFILE.ERRORS.NOT_FOUND' },
  { status: 409, clave: 'PROFILE.ERRORS.EMAIL_TAKEN' },
  { status: 413, clave: 'PROFILE.PHOTO_SIZE_ERROR' },
);

    return { porDefecto, prefijoCampos: 'PROFILE.ERRORS.FIELD_', reglas };
  }

  private liberarVistaPrevia() {
    if (!this.urlFotoTemporal) return;
    URL.revokeObjectURL(this.urlFotoTemporal);
    this.urlFotoTemporal = null;
  }
}