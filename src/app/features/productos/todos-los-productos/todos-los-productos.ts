import { AfterViewInit, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, Subscription } from 'rxjs';
import { LucidePackage, LucideSearch } from '@lucide/angular';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ProductosService } from '@core/services/producto/ProductosService';
import { CarritosService } from '@core/services/carrito/CarritosService';
import { AuthService } from '@core/services/auth/auth';
import { OrdenProducto, ProductoPublicoResponse } from '@core/models/producto/productoModels';
import { AlertaService } from '@core/services/modals/ModalsService';

@Component({
  selector: 'app-todos-los-productos',
  imports: [CommonModule, FormsModule, RouterLink, LucideSearch, LucidePackage, TranslatePipe],
  templateUrl: './todos-los-productos.html',
  styleUrl: './todos-los-productos.css',
})
export class TodosLosProductos implements OnInit, AfterViewInit, OnDestroy {

  private productosService = inject(ProductosService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private carritosService = inject(CarritosService);
  private alerta = inject(AlertaService);
  private translate = inject(TranslateService);

  isLoggedIn = this.authService.isLoggedIn;
  nombreUsuario = this.authService.nombre;

  private readonly tamanoPagina = 24;   // múltiplo de 2, 3 y 4: filas completas en cualquier ancho
  productos = signal<ProductoPublicoResponse[]>([]);
  animarEntrada = signal(true);
  reemplazandoResultados = signal(false);
  cargando = signal(false);
  errorCarga = signal(false);
  paginaActual = 0;
  hayMasPaginas = true;

  textoBusqueda = '';              // lo que el usuario está escribiendo
  ordenSeleccionado: OrdenProducto = '';
  private busquedaActiva = '';     // lo que realmente se buscó (para las páginas siguientes)
  private peticion?: Subscription;
  private readonly cambiosBusqueda = new Subject<string>();
  private suscripcionBusqueda?: Subscription;
  private animacionInicialTimer?: ReturnType<typeof setTimeout>;
  private reemplazarProductosAlCargar = false;

  // IDs de productos cuya imagen no existe (se muestra el ícono de paquete)
  private imagenesFallidas = signal<Set<number>>(new Set());

  private scrollListener!: () => void;
  private sidenavContent!: Element;

  ngOnInit() {
    this.suscripcionBusqueda = this.cambiosBusqueda.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe(termino => {
      if (termino !== this.busquedaActiva) {
        this.ejecutarBusqueda(termino);
      }
    });
  }

  ngAfterViewInit() {
    this.cargarMas(); // Carga inicial

    const el = document.querySelector('mat-sidenav-content');
    if (!el) return;

    this.sidenavContent = el;
    this.scrollListener = () => this.checkScroll();
    this.sidenavContent.addEventListener('scroll', this.scrollListener);
  }

  ngOnDestroy() {
    this.peticion?.unsubscribe();
    this.suscripcionBusqueda?.unsubscribe();
    this.detenerAnimacionEntrada();
    this.sidenavContent?.removeEventListener('scroll', this.scrollListener);
  }

  private checkScroll() {
    const el = this.sidenavContent;
    const distanciaAlFondo = el.scrollHeight - el.scrollTop - el.clientHeight;

    // Cuando estemos a menos de 300px del fondo, cargamos
    if (distanciaAlFondo < 300) {
      this.cargarMas();
    }
  }

  cargarMas() {
    if (this.cargando() || !this.hayMasPaginas) return;

    this.cargando.set(true);
    this.peticion = this.productosService
      .buscar({ q: this.busquedaActiva, orden: this.ordenSeleccionado }, this.paginaActual, this.tamanoPagina)
      .subscribe({
        next: (page) => {
          if (this.reemplazarProductosAlCargar) {
            this.productos.set(page.content);
            this.reemplazarProductosAlCargar = false;
          } else {
            this.productos.update(actual => [...actual, ...page.content]);
          }
          this.reemplazandoResultados.set(false);
          this.programarFinAnimacionInicial();
          this.hayMasPaginas = this.paginaActual < page.totalPages - 1;
          this.paginaActual++;
          this.cargando.set(false);
          this.errorCarga.set(false);
        },
        error: () => {
          this.cargando.set(false);
          this.reemplazandoResultados.set(false);
          this.errorCarga.set(true);
        }
      });
  }

  buscar() {
    this.detenerAnimacionEntrada();
    this.cambiosBusqueda.next(this.textoBusqueda);
    this.ejecutarBusqueda(this.textoBusqueda);
  }

  cambiarOrden(orden: OrdenProducto) {
    this.detenerAnimacionEntrada();
    this.ordenSeleccionado = orden;
    this.ejecutarBusqueda(this.textoBusqueda);
  }

  programarBusqueda(termino: string) {
    this.detenerAnimacionEntrada();
    this.cambiosBusqueda.next(termino);
  }

  private ejecutarBusqueda(termino: string) {
    this.detenerAnimacionEntrada();
    this.peticion?.unsubscribe();           // descarta una respuesta vieja que siga en camino
    this.busquedaActiva = termino;
    this.reemplazarProductosAlCargar = true;
    this.reemplazandoResultados.set(true);
    this.paginaActual = 0;
    this.hayMasPaginas = true;
    this.errorCarga.set(false);
    this.cargando.set(false);
    this.cargarMas();
  }

  private programarFinAnimacionInicial() {
    if (!this.animarEntrada() || this.animacionInicialTimer) return;
    this.animacionInicialTimer = setTimeout(() => this.detenerAnimacionEntrada(), 1400);
  }

  private detenerAnimacionEntrada() {
    if (this.animacionInicialTimer) {
      clearTimeout(this.animacionInicialTimer);
      this.animacionInicialTimer = undefined;
    }
    this.animarEntrada.set(false);
  }

  limpiarBusqueda() {
    this.textoBusqueda = '';
    this.buscar();
  }

  reintentarCarga() {
    this.errorCarga.set(false);
    this.cargarMas();
  }


  imagenFallida(id: number): boolean {
    return this.imagenesFallidas().has(id);
  }

  marcarImagenFallida(id: number) {
    this.imagenesFallidas.update(s => new Set(s).add(id));
  }

  verDetalle(slug: string) {
    this.router.navigate(['/productos', slug]);
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
}