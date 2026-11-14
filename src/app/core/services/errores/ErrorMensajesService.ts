import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

/**
 * Un caso especial: si el error cumple las condiciones, se muestra `clave`.
 * Las reglas se evalúan en orden y la primera que coincide gana.
 * Una regla sin status, contiene ni patron coincide con cualquier error.
 */
export interface ReglaError {
  /** Status (o lista de status) en que aplica. */
  status?: number | number[];
  /** Texto que debe contener el body (respuestas text/plain del backend). */
  contiene?: string;
  /** Expresión regular sobre el body; permite extraer datos para la traducción. */
  patron?: RegExp;
  /** Clave de traducción completa. */
  clave: string;
  /** Convierte las coincidencias del patrón en parámetros de la traducción. */
  params?: (coincidencia: RegExpMatchArray) => Record<string, string>;
}

export interface OpcionesError {
  /** Clave de traducción si nada coincide. */
  porDefecto: string;
  /** Casos especiales del componente, evaluados antes que los comunes. */
  reglas?: ReglaError[];
  /** Prefijo para traducir validaciones por campo, ej. 'CART.ERRORS.FIELD_'. */
  prefijoCampos?: string;
}

@Injectable({ providedIn: 'root' })
export class ErrorMensajesService {
  private readonly translate = inject(TranslateService);

  /** true si el error es un HttpErrorResponse con alguno de los status indicados. */
  tieneStatus(error: unknown, ...status: number[]): boolean {
    return error instanceof HttpErrorResponse && status.includes(error.status);
  }

  resolver(error: unknown, opciones: OpcionesError): string {
    if (!(error instanceof HttpErrorResponse)) {
      return this.translate.instant(opciones.porDefecto);
    }

    const body = error.error;
    // Texto del error: body text/plain, o "message" / "error" si el body es JSON
    const texto = typeof body === 'string'
      ? body
      : typeof body?.message === 'string'
        ? body.message
        : typeof body?.error === 'string'
          ? body.error
          : '';

    const campos: Record<string, string> | undefined =
      body && typeof body === 'object' ? body.errors : undefined;

    // 1. Casos especiales del componente
    for (const regla of opciones.reglas ?? []) {
      const mensaje = this.aplicarRegla(regla, error.status, texto);
      if (mensaje) return mensaje;
    }

    // 2. Casos comunes
    if (error.status === 0) return this.translate.instant('ERRORS.NETWORK');

    if (error.status === 400) {
      if (campos) return this.mensajesPorCampo(campos, opciones.prefijoCampos);
      // Sin regla ni campos: mostrar el texto real del backend en vez del genérico
      if (texto) return texto;
      return this.translate.instant('ERRORS.BAD_REQUEST');
    }

    if (error.status === 401) return this.translate.instant('ERRORS.SESSION_EXPIRED');
    if (error.status >= 500) return this.translate.instant('ERRORS.SERVER');

    // 3. Por defecto
    return this.translate.instant(opciones.porDefecto);
  }

  private aplicarRegla(regla: ReglaError, status: number, texto: string): string | null {
    if (regla.status !== undefined) {
      const lista = Array.isArray(regla.status) ? regla.status : [regla.status];
      if (!lista.includes(status)) return null;
    }

    if (regla.contiene && !texto.includes(regla.contiene)) return null;

    if (regla.patron) {
      const coincidencia = texto.match(regla.patron);
      if (!coincidencia) return null;
      return this.translate.instant(regla.clave, regla.params?.(coincidencia));
    }

    return this.translate.instant(regla.clave);
  }

  private mensajesPorCampo(campos: Record<string, string>, prefijo?: string): string {
    const mensajes = Object.keys(campos).map(campo => {
      if (prefijo) {
        const clave = `${prefijo}${campo.toUpperCase()}`;
        const traducido = this.translate.instant(clave);
        if (traducido !== clave) return traducido;
      }
      // Sin traducción: se muestra el texto que mandó el backend
      return campos[campo];
    });
    return [...new Set(mensajes)].join('\n');
  }
}