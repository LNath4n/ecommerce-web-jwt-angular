import { Injectable, signal } from '@angular/core';

export type TipoAlerta = 'exito' | 'error' | 'advertencia';

export interface Alerta {
  id: number;
  tipo: TipoAlerta;
  titulo: string;
  texto: string;
}

export interface Confirmacion {
  titulo: string;
  texto: string;
  textoAceptar: string;
}

@Injectable({ providedIn: 'root' })
export class AlertaService {
  readonly alertas = signal<Alerta[]>([]);
  readonly alertasCerrando = signal<Set<number>>(new Set());
  readonly confirmacion = signal<Confirmacion | null>(null);
  private contador = 0;
  private resolverConfirmacion: ((confirmada: boolean) => void) | null = null;
  private readonly duracionSalidaMs = 300;

  private mostrar(tipo: TipoAlerta, titulo: string, texto: string, duracionMs = 4000) {
    const id = ++this.contador;
    this.alertas.update(actual => [...actual, { id, tipo, titulo, texto }]);
    setTimeout(() => this.cerrar(id), duracionMs);
  }

  exito(texto: string, titulo = '¡Listo!') {
    this.mostrar('exito', titulo, texto);
  }

  error(texto: string, titulo = 'Ups...') {
    this.mostrar('error', titulo, texto);
  }

  advertencia(texto: string, titulo = 'Atención') {
    this.mostrar('advertencia', titulo, texto);
  }

  solicitarConfirmacion(
    titulo: string,
    texto: string,
    textoAceptar = 'Confirmar'
  ): Promise<boolean> {
    this.resolverConfirmacion?.(false);
    this.confirmacion.set({ titulo, texto, textoAceptar });

    return new Promise(resolve => {
      this.resolverConfirmacion = resolve;
    });
  }

  responderConfirmacion(confirmada: boolean) {
    const resolver = this.resolverConfirmacion;
    this.resolverConfirmacion = null;
    this.confirmacion.set(null);
    resolver?.(confirmada);
  }

  cerrar(id: number) {
    if (this.alertasCerrando().has(id)) return;

    this.alertasCerrando.update(actual => new Set(actual).add(id));
    setTimeout(() => {
      this.alertas.update(actual => actual.filter(a => a.id !== id));
      this.alertasCerrando.update(actual => {
        const nuevas = new Set(actual);
        nuevas.delete(id);
        return nuevas;
      });
    }, this.duracionSalidaMs);
  }
}