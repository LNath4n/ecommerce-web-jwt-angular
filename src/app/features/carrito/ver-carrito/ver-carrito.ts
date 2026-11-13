import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, of, switchMap } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LucideTrash2, LucidePackage } from '@lucide/angular';
import { CarritosService } from '@core/services/carrito/CarritosService';
import { AlertaService } from '@core/services/modals/ModalsService';
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
          if (error instanceof HttpErrorResponse && error.status === 404) {
            return of(null);
          }

          this.errorCarga.set(this.translate.instant('CART.LOAD_ERROR'));
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
      error: error => this.alerta.error(
        this.carritoService.obtenerMensajeError(error)
          ?? this.translate.instant('CART.UPDATE_QUANTITY_ERROR')
      )
    });
  }

  eliminar(productId: number) {
    this.carritoService.eliminar(productId).subscribe({
      next: () => {
        this.alerta.exito(this.translate.instant('CART.REMOVE_SUCCESS'));
        this.recargar$.next();
      },
      error: () => this.alerta.error(
        this.translate.instant('CART.REMOVE_ERROR')
      )
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

}