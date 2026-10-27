import { Component, inject, signal } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { LucidePackage, LucideArrowLeft } from '@lucide/angular';
import { ProductoPublicoResponse } from '@core/models/producto/productoModels';
import { ProductosService } from '@core/services/producto/ProductosService';
import { AuthService } from '@core/services/auth/auth';
import { CarritosService } from '@core/services/carrito/CarritosService';
import { AlertaService } from '@core/services/modals/ModalsService';

type ProductoEstado =
  | { status: 'loading' }
  | { status: 'loaded'; producto: ProductoPublicoResponse }
  | { status: 'not-found' }
  | { status: 'error' };

@Component({
  selector: 'app-un-producto',
  imports: [AsyncPipe, LucidePackage, LucideArrowLeft, TranslatePipe],
  templateUrl: './un-producto.html',
  styleUrl: './un-producto.css',
})
export class UnProducto {

  private productosService = inject(ProductosService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private carritosService = inject(CarritosService);
  private alerta = inject(AlertaService);
  private translate = inject(TranslateService);

  // IDs de productos cuya imagen no existe (se muestra el ícono de paquete)
  private imagenesFallidas = signal<Set<number>>(new Set());

  productoEstado$ = this.route.paramMap.pipe(
    map(params => params.get('slug') ?? ''),
    switchMap(slug => {
      if (!slug) return of<ProductoEstado>({ status: 'not-found' });

      return this.productosService.getBySlug(slug).pipe(
        map(producto => ({ status: 'loaded', producto }) as const),
        startWith({ status: 'loading' } as const),
        catchError(error => of<ProductoEstado>({
          status: error instanceof HttpErrorResponse && error.status === 404
            ? 'not-found'
            : 'error'
        }))
      );
    })
  );

  imagenFallida(id: number): boolean {
    return this.imagenesFallidas().has(id);
  }

  marcarImagenFallida(id: number) {
    this.imagenesFallidas.update(s => new Set(s).add(id));
  }

  agregarAlCarrito(idProducto: number) {
    if (!this.authService.getToken()) {
      this.alerta.advertencia(this.translate.instant('PRODUCT_DETAIL.LOGIN_REQUIRED'));
      return;
    }

    this.carritosService.agregar({ idProducto, cantidad: 1 })
      .subscribe({
        next: () => {
          this.alerta.exito(this.translate.instant('PRODUCT_DETAIL.ADDED_TO_CART'));
        },
        error: error => {
          const mensaje = this.mensajeError(error);
          this.alerta.error(
            mensaje ?? this.translate.instant('PRODUCT_DETAIL.ADD_TO_CART_ERROR')
          );
        }
      });
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

  regresar() {
    this.router.navigate(['/productos']);
  }
}