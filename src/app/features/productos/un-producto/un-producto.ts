import { Component, computed, inject, signal } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucidePackage, LucideArrowLeft } from '@lucide/angular';
import { PublicProductResponse } from '@core/models/producto/productoModels';
import {PageHero} from '../../layout/page-hero/page-hero';

import {
  ReviewEligibility,
  ReviewPage,
  ReviewResponse,
  ReviewSummary,
} from '@core/models/producto/resenaModels';
import { ProductosService } from '@core/services/producto/ProductosService';
import { ResenasService } from '@core/services/producto/ResenasService';
import { AuthService } from '@core/services/auth/auth';
import { CarritosService } from '@core/services/carrito/CarritosService';
import { AlertaService } from '@core/services/modals/ModalsService';

type ProductoEstado =
  | { status: 'loading' }
  | { status: 'loaded'; producto: PublicProductResponse }
  | { status: 'not-found'; message: string | null }
  | { status: 'error'; message: string | null };

@Component({
  selector: 'app-un-producto',
  imports: [AsyncPipe, DatePipe, RouterLink, LucidePackage, LucideArrowLeft, TranslatePipe, PageHero],
  templateUrl: './un-producto.html',
  styleUrl: './un-producto.css',
})
export class UnProducto {

  private productosService = inject(ProductosService);
  private resenasService = inject(ResenasService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private carritosService = inject(CarritosService);
  private alerta = inject(AlertaService);
  private translate = inject(TranslateService);
  private resenasProductId: number | null = null;
  private readonly pageSize = 10;
  readonly sesionActiva = this.authService.isLoggedIn;

  // IDs de productos cuya imagen no existe (se muestra el ícono de paquete)
  private imagenesFallidas = signal<Set<number>>(new Set());

  readonly resenas = signal<ReviewResponse[]>([]);
  readonly resumenResenas = signal<ReviewSummary | null>(null);
  readonly paginaResenas = signal(0);
  readonly totalPaginasResenas = signal(0);
  readonly cargandoResenas = signal(false);
  readonly errorResenas = signal(false);
  readonly errorResumenResenas = signal(false);
  readonly elegibilidadResena = signal<ReviewEligibility | null>(null);
  readonly miResena = signal<ReviewResponse | null>(null);
  readonly cargandoElegibilidad = signal(false);
  readonly errorElegibilidad = signal(false);
  readonly enviandoResena = signal(false);
  readonly eliminandoResena = signal(false);
  readonly calificacionResena = signal(5);
  readonly comentarioResena = signal('');
  readonly puedeEnviarResena = computed(() => {
    const eligibility = this.elegibilidadResena();
    return this.miResena() !== null || (
      eligibility?.purchased === true && !eligibility.alreadyReviewed
    );
  });

  productoEstado$ = this.route.paramMap.pipe(
    map(params => params.get('slug') ?? ''),
    switchMap(slug => {
      this.resenasProductId = null;
      this.limpiarResenas();
      if (!slug) return of<ProductoEstado>({ status: 'not-found', message: null });

      return this.productosService.getBySlug(slug).pipe(
        map(producto => {
          this.cargarResenas(producto.id);
          return { status: 'loaded', producto } as const;
        }),
        startWith({ status: 'loading' } as const),
        catchError(error => {
          const estado = error instanceof HttpErrorResponse && error.status === 404
            ? 'not-found'
            : 'error';
          return of<ProductoEstado>({
            status: estado,
            message: null,
          });
        })
      );
    })
  );

  imagenFallida(id: number): boolean {
    return this.imagenesFallidas().has(id);
  }

  marcarImagenFallida(id: number) {
    this.imagenesFallidas.update(s => new Set(s).add(id));
  }

  actualizarCalificacion(value: number) {
    if (Number.isInteger(value) && value >= 1 && value <= 5) {
      this.calificacionResena.set(value);
    }
  }

  actualizarComentario(event: Event) {
    this.comentarioResena.set((event.target as HTMLTextAreaElement).value);
  }

  cambiarPaginaResenas(delta: number) {
    const page = this.paginaResenas() + delta;
    if (page < 0 || page >= this.totalPaginasResenas() || this.resenasProductId === null) return;
    this.cargarListaResenas(this.resenasProductId, page);
  }

  reintentarResenas() {
    if (this.resenasProductId !== null) {
      this.cargarResenas(this.resenasProductId);
    }
  }

  guardarResena(productId: number) {
    if (this.enviandoResena()) return;

    const existing = this.miResena();
    const eligibility = this.elegibilidadResena();
    if (!existing && (!eligibility?.purchased || eligibility.alreadyReviewed)) return;

    const request = {
      rating: this.calificacionResena(),
      comment: this.comentarioResena().trim() || null,
    };
    this.enviandoResena.set(true);

    const operation = existing
      ? this.resenasService.actualizar(productId, request)
      : this.resenasService.crear(productId, request);

    operation.subscribe({
      next: () => {
        if (this.resenasProductId !== productId) return;
        this.enviandoResena.set(false);
        this.alerta.exito(this.translate.instant(
          existing ? 'PRODUCT_DETAIL.REVIEW_UPDATED' : 'PRODUCT_DETAIL.REVIEW_CREATED'
        ));
        this.cargarResenas(productId);
      },
      error: () => {
        if (this.resenasProductId !== productId) return;
        this.enviandoResena.set(false);
        this.alerta.error(this.translate.instant('PRODUCT_DETAIL.REVIEW_SAVE_ERROR'));
      },
    });
  }

  async eliminarMiResena(productId: number) {
    if (this.eliminandoResena() || !this.miResena()) return;

    const confirmada = await this.alerta.solicitarConfirmacion(
      this.translate.instant('PRODUCT_DETAIL.DELETE_REVIEW_TITLE'),
      this.translate.instant('PRODUCT_DETAIL.DELETE_REVIEW_CONFIRM'),
      this.translate.instant('PRODUCT_DETAIL.DELETE_REVIEW')
    );
    if (!confirmada || this.resenasProductId !== productId) return;

    this.eliminandoResena.set(true);
    this.resenasService.eliminar(productId).subscribe({
      next: () => {
        if (this.resenasProductId !== productId) return;
        this.eliminandoResena.set(false);
        this.alerta.exito(this.translate.instant('PRODUCT_DETAIL.REVIEW_DELETED'));
        this.cargarResenas(productId);
      },
      error: () => {
        if (this.resenasProductId !== productId) return;
        this.eliminandoResena.set(false);
        this.alerta.error(this.translate.instant('PRODUCT_DETAIL.REVIEW_DELETE_ERROR'));
      },
    });
  }

  private limpiarResenas() {
    this.resenas.set([]);
    this.resumenResenas.set(null);
    this.paginaResenas.set(0);
    this.totalPaginasResenas.set(0);
    this.cargandoResenas.set(false);
    this.errorResenas.set(false);
    this.errorResumenResenas.set(false);
    this.elegibilidadResena.set(null);
    this.miResena.set(null);
    this.cargandoElegibilidad.set(false);
    this.errorElegibilidad.set(false);
    this.enviandoResena.set(false);
    this.eliminandoResena.set(false);
    this.calificacionResena.set(5);
    this.comentarioResena.set('');
  }

  private cargarResenas(productId: number) {
    this.resenasProductId = productId;
    this.errorElegibilidad.set(false);
    this.cargarListaResenas(productId, 0);

    this.productosService.obtenerResumenResenas(productId).subscribe({
      next: summary => {
        if (this.resenasProductId === productId) {
          this.resumenResenas.set(summary);
          this.errorResumenResenas.set(false);
        }
      },
      error: () => {
        if (this.resenasProductId === productId) {
          this.resumenResenas.set(null);
          this.errorResumenResenas.set(true);
        }
      },
    });

    if (!this.authService.isLoggedIn()) {
      this.cargandoElegibilidad.set(false);
      return;
    }

    this.cargandoElegibilidad.set(true);
    this.errorElegibilidad.set(false);
    let elegibilidadRecibida = false;
    let miResenaRecibida = false;
    const actualizarCarga = () => {
      if (this.resenasProductId === productId && elegibilidadRecibida && miResenaRecibida) {
        this.cargandoElegibilidad.set(false);
      }
    };

    this.resenasService.obtenerElegibilidad(productId).subscribe({
      next: eligibility => {
        if (this.resenasProductId !== productId) return;
        this.elegibilidadResena.set(eligibility);
        elegibilidadRecibida = true;
        actualizarCarga();
      },
      error: () => {
        if (this.resenasProductId !== productId) return;
        this.errorElegibilidad.set(true);
        elegibilidadRecibida = true;
        actualizarCarga();
      },
    });

    this.resenasService.obtenerMiResena(productId).subscribe({
      next: review => {
        if (this.resenasProductId !== productId) return;
        this.establecerMiResena(review);
        miResenaRecibida = true;
        actualizarCarga();
      },
      error: error => {
        if (this.resenasProductId !== productId) return;
        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.establecerMiResena(null);
        } else {
          this.errorElegibilidad.set(true);
        }
        miResenaRecibida = true;
        actualizarCarga();
      },
    });
  }

  private cargarListaResenas(productId: number, page: number) {
    this.cargandoResenas.set(true);
    this.errorResenas.set(false);
    this.productosService.obtenerResenas(productId, page, this.pageSize).subscribe({
      next: (response: ReviewPage) => {
        if (this.resenasProductId !== productId) return;
        this.resenas.set(response.content);
        this.paginaResenas.set(response.number);
        this.totalPaginasResenas.set(response.totalPages);
        this.cargandoResenas.set(false);
      },
      error: () => {
        if (this.resenasProductId !== productId) return;
        this.cargandoResenas.set(false);
        this.errorResenas.set(true);
      },
    });
  }

  private establecerMiResena(review: ReviewResponse | null) {
    this.miResena.set(review);
    this.calificacionResena.set(review?.rating ?? 5);
    this.comentarioResena.set(review?.comment ?? '');
  }

  agregarAlCarrito(idProducto: number) {
    if (!this.authService.getToken()) {
      this.alerta.advertencia(this.translate.instant('PRODUCT_DETAIL.LOGIN_REQUIRED'));
      return;
    }

    this.carritosService.agregar({ productId: idProducto, quantity: 1 })
      .subscribe({
        next: () => {
          this.alerta.exito(this.translate.instant('PRODUCT_DETAIL.ADDED_TO_CART'));
        },
        error: error => this.alerta.error(
          this.carritosService.obtenerMensajeError(error)
            ?? this.translate.instant('PRODUCT_DETAIL.ADD_TO_CART_ERROR')
        )
      });
  }

  regresar() {
    this.router.navigate(['/productos']);
  }
}