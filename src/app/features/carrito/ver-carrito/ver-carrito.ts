import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, of, switchMap } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LucideTrash2, LucidePackage } from '@lucide/angular';
import { CarritosService } from '@core/services/carrito/CarritosService';
import { AlertaService } from '@core/services/modals/ModalsService';
import { ErrorMensajesService, OpcionesError } from '@core/services/errores/ErrorMensajesService';
import { reglasStock } from '@core/services/errores/reglas-error';
import { CartResponse } from '@core/models/carrito/carritoModels';
import {PageHero} from '../../layout/page-hero/page-hero';
type ItemCarrito = CartResponse['items'][number];

@Component({
  selector: 'app-ver-carrito',
  imports: [CommonModule, LucideTrash2, LucidePackage, TranslatePipe,PageHero],
  templateUrl: './ver-carrito.html',
  styleUrl: './ver-carrito.css',
})
export class VerCarrito {
  private carritoService = inject(CarritosService);
  private alerta = inject(AlertaService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private errores = inject(ErrorMensajesService);

  // IDs de productos cuya imagen no cargó (se muestra el ícono de paquete)
  private imagenesFallidas = signal<Set<number>>(new Set());

  // Cada .next() vuelve a pedir el carrito sin vaciar la pantalla mientras llega
  private recargar$ = new BehaviorSubject<void>(undefined);
  errorCarga = signal<string | null>(null);
  carrito$ = this.recargar$.pipe(
    switchMap(() => {
      this.errorCarga.set(null);
      return this.carritoService.obtenerCarrito().pipe(
        catchError(error => {
          // 404 = el cliente aún no tiene carrito: se trata como carrito vacío
          if (this.errores.tieneStatus(error, 404)) {
            return of(null);
          }

          this.errorCarga.set(this.errores.resolver(error, this.opcionesError('CART.LOAD_ERROR')));
          return of(null);
        })
      );
    })
  );

  imagenFallida(productoId: number): boolean {
    return this.imagenesFallidas().has(productoId);
  }

  marcarImagenFallida(productoId: number) {
    this.imagenesFallidas.update(s => new Set(s).add(productoId));
  }

  cambiarCantidad(item: ItemCarrito, delta: number) {
    const nueva = item.quantity + delta;
    if (nueva < 1) return;

    const request = { productId: item.productId, quantity: nueva };

    this.carritoService.actualizar(request).subscribe({
      next: () => this.recargar$.next(),
      error: error => {
        this.alerta.error(this.errores.resolver(error, this.opcionesError('CART.UPDATE_QUANTITY_ERROR')));
        // Si el producto o el carrito ya no existen, refrescamos para mostrar el estado real
        if (this.errores.tieneStatus(error, 404)) {
          this.recargar$.next();
        }
      }
    });
  }

  eliminar(productId: number) {
    this.carritoService.eliminar(productId).subscribe({
      next: () => {
        this.alerta.exito(this.translate.instant('CART.REMOVE_SUCCESS'));
        this.recargar$.next();
      },
      error: error => {
        this.alerta.error(this.errores.resolver(error, this.opcionesError('CART.REMOVE_ERROR')));
        if (this.errores.tieneStatus(error, 404)) {
          this.recargar$.next();
        }
      }
    });
  }

  reintentarCarga() {
    this.recargar$.next();
  }

  seguirComprando() {
    this.router.navigate(['/productos']);
  }

  irACheckout() {
    this.router.navigate(['/checkout']);
  }

  private opcionesError(porDefecto: string): OpcionesError {
    return {
      porDefecto,
      prefijoCampos: 'CART.ERRORS.FIELD_',
      reglas: [
        ...reglasStock(),
        // "Product not found with ID: 2"
        { status: 404, contiene: 'Product not found', clave: 'CART.ERRORS.PRODUCT_NOT_FOUND' },
        // "Product with ID 2 is not in the cart"
        { status: 404, contiene: 'not in the cart', clave: 'CART.ERRORS.PRODUCT_NOT_IN_CART' },
        // "Cart not found: 42" / "No cart found for customer 42"
        { status: 404, contiene: 'Cart not found', clave: 'CART.ERRORS.CART_NOT_FOUND' },
        { status: 404, contiene: 'No cart found', clave: 'CART.ERRORS.CART_NOT_FOUND' },
      ],
    };
  }
}