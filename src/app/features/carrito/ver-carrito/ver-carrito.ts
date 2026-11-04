import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, switchMap } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LucideTrash2, LucidePackage } from '@lucide/angular';
import { CarritosService } from '@core/services/carrito/CarritosService';
import { AlertaService } from '@core/services/modals/ModalsService';
import { Carrito } from '@core/models/carrito/carritoModels';

type ItemCarrito = Carrito['productos'][number];

@Component({
  selector: 'app-ver-carrito',
  imports: [CommonModule, LucideTrash2, LucidePackage, TranslatePipe],
  templateUrl: './ver-carrito.html',
  styleUrl: './ver-carrito.css',
})
export class VerCarrito {
  private carritoService = inject(CarritosService);
  private alerta = inject(AlertaService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  // IDs de productos cuya imagen no cargó (se muestra el ícono de paquete)
  private imagenesFallidas = signal<Set<number>>(new Set());

  // Cada .next() vuelve a pedir el carrito sin vaciar la pantalla mientras llega
  private recargar$ = new BehaviorSubject<void>(undefined);
  carrito$ = this.recargar$.pipe(
    switchMap(() => this.carritoService.obtenerCarrito()) // GET /carrito
  );

  imagenFallida(productoId: number): boolean {
    return this.imagenesFallidas().has(productoId);
  }

  marcarImagenFallida(productoId: number) {
    this.imagenesFallidas.update(s => new Set(s).add(productoId));
  }

  cambiarCantidad(item: ItemCarrito, delta: number) {
    const nueva = item.cantidad + delta;
    if (nueva < 1) return;

    const request = { idProducto: item.productoId, cantidad: nueva };

    this.carritoService.actualizar(request).subscribe({
      next: () => this.recargar$.next(),
      error: error => {
        const mensaje = this.mensajeError(error);
        this.alerta.error(
          mensaje ?? this.translate.instant('CART.UPDATE_QUANTITY_ERROR')
        );
      }
    });
  }

  eliminar(productoId: number) {
    this.carritoService.eliminar(productoId).subscribe({
      next: () => {
        this.alerta.exito(this.translate.instant('CART.REMOVE_SUCCESS'));
        this.recargar$.next();
      },
      error: () => this.alerta.error(this.translate.instant('CART.REMOVE_ERROR'))
    });
  }

  seguirComprando() {
    this.router.navigate(['/productos']);
  }

  private mensajeError(error: unknown): string | null {
    if (!(error instanceof HttpErrorResponse)) return null;

    const cuerpo: unknown = error.error;
    if (typeof cuerpo === 'string' && cuerpo.trim()) return cuerpo.trim();

    if (typeof cuerpo === 'object' && cuerpo !== null) {
      if ('error' in cuerpo && typeof cuerpo.error === 'string' && cuerpo.error.trim()) {
        return cuerpo.error.trim();
      }
      if ('message' in cuerpo && typeof cuerpo.message === 'string' && cuerpo.message.trim()) {
        return cuerpo.message.trim();
      }
    }

    return null;
  }
}