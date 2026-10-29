import { AfterViewInit, Component, computed, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild, WritableSignal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { LucidePackage } from '@lucide/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { ProductoPublicoResponse } from '@core/models/producto/productoModels';
import { AuthService } from '@core/services/auth/auth';
import { ProductosService } from '@core/services/producto/ProductosService';

type SeleccionEspecial = 'calificacion' | 'vistas' | 'resenas';

@Component({
  selector: 'app-productos-destacados',
  imports: [RouterLink, LucidePackage, TranslatePipe],
  templateUrl: './productos-destacados.html',
  styleUrl: './productos-destacados.css',
})
export class ProductosDestacados implements OnInit, AfterViewInit, OnDestroy {
  private readonly productosService = inject(ProductosService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly peticionesTop = new Subscription();
  private readonly tamanoTop = 10;
  private readonly imagenesFallidas = signal<Set<number>>(new Set());

  isLoggedIn = this.authService.isLoggedIn;
  nombreUsuario = this.authService.nombre;
  animarEntrada = signal(true);
  productosMasVistos = signal<ProductoPublicoResponse[]>([]);
  productosMejorCalificados = signal<ProductoPublicoResponse[]>([]);
  productosMasResenados = signal<ProductoPublicoResponse[]>([]);
  cargandoTopVistas = signal(true);
  cargandoTopCalificados = signal(true);
  cargandoTopResenados = signal(true);
  errorTopVistas = signal(false);
  errorTopCalificados = signal(false);
  errorTopResenados = signal(false);
  seleccionEspecial = signal<SeleccionEspecial>('calificacion');

  productosSeleccionados = computed(() => {
    switch (this.seleccionEspecial()) {
      case 'vistas': return this.productosMasVistos();
      case 'resenas': return this.productosMasResenados();
      default: return this.productosMejorCalificados();
    }
  });
  cargandoSeleccionEspecial = computed(() => {
    switch (this.seleccionEspecial()) {
      case 'vistas': return this.cargandoTopVistas();
      case 'resenas': return this.cargandoTopResenados();
      default: return this.cargandoTopCalificados();
    }
  });
  errorSeleccionEspecial = computed(() => {
    switch (this.seleccionEspecial()) {
      case 'vistas': return this.errorTopVistas();
      case 'resenas': return this.errorTopResenados();
      default: return this.errorTopCalificados();
    }
  });

  @ViewChild('topCarrusel') private topCarrusel?: ElementRef<HTMLElement>;
  private carruselTimer?: ReturnType<typeof setInterval>;
  private animacionInicialTimer?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    this.cargarTopVistas();
    this.cargarTopCalificados();
    this.cargarTopResenados();
  }

  ngAfterViewInit() {
    this.reanudarCarrusel();
  }

  ngOnDestroy() {
    this.peticionesTop.unsubscribe();
    this.pausarCarrusel();
    this.detenerAnimacionEntrada();
  }

  seleccionarEspecial(seleccion: SeleccionEspecial) {
    this.detenerAnimacionEntrada();
    this.seleccionEspecial.set(seleccion);
    this.topCarrusel?.nativeElement.scrollTo({ left: 0, behavior: 'smooth' });
  }

  imagenFallida(id: number): boolean {
    return this.imagenesFallidas().has(id);
  }

  marcarImagenFallida(id: number) {
    this.imagenesFallidas.update(actuales => new Set(actuales).add(id));
  }

  desplazarCarrusel(carrusel: HTMLElement, direccion: -1 | 1) {
    carrusel.scrollBy({ left: carrusel.clientWidth * direccion, behavior: 'smooth' });
  }

  pausarCarrusel() {
    if (this.carruselTimer) {
      clearInterval(this.carruselTimer);
      this.carruselTimer = undefined;
    }
  }

  reanudarCarrusel() {
    this.pausarCarrusel();
    if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    this.carruselTimer = setInterval(() => {
      const carrusel = this.topCarrusel?.nativeElement;
      if (!carrusel || carrusel.scrollWidth <= carrusel.clientWidth) return;

      const alFinal = carrusel.scrollLeft + carrusel.clientWidth >= carrusel.scrollWidth - 2;
      if (alFinal) {
        carrusel.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }

      const slide = carrusel.querySelector<HTMLElement>('.top-carrusel-slide');
      const espacio = Number.parseFloat(window.getComputedStyle(carrusel).columnGap) || 0;
      carrusel.scrollBy({ left: (slide?.offsetWidth ?? carrusel.clientWidth) + espacio, behavior: 'smooth' });
    }, 4000);
  }

  reintentarSeleccionEspecial() {
    switch (this.seleccionEspecial()) {
      case 'vistas': this.cargarTopVistas(); break;
      case 'resenas': this.cargarTopResenados(); break;
      default: this.cargarTopCalificados();
    }
  }

  verDetalle(slug: string) {
    this.router.navigate(['/productos', slug]);
  }

  private cargarTopVistas() {
    this.cargarTop(
      this.productosService.obtenerTopVistas(),
      this.productosMasVistos,
      this.cargandoTopVistas,
      this.errorTopVistas
    );
  }

  private cargarTopCalificados() {
    this.cargarTop(
      this.productosService.obtenerTopCalificados(),
      this.productosMejorCalificados,
      this.cargandoTopCalificados,
      this.errorTopCalificados
    );
  }

  private cargarTopResenados() {
    this.cargarTop(
      this.productosService.obtenerTopResenados(),
      this.productosMasResenados,
      this.cargandoTopResenados,
      this.errorTopResenados
    );
  }

  private cargarTop(
    solicitud: Observable<ProductoPublicoResponse[]>,
    destino: WritableSignal<ProductoPublicoResponse[]>,
    cargando: WritableSignal<boolean>,
    error: WritableSignal<boolean>
  ) {
    cargando.set(true);
    error.set(false);
    this.peticionesTop.add(solicitud.subscribe({
      next: productos => {
        destino.set(productos.slice(0, this.tamanoTop));
        cargando.set(false);
        if (this.productosSeleccionados().length > 0) {
          this.programarFinAnimacionInicial();
        }
      },
      error: () => {
        cargando.set(false);
        error.set(true);
      },
    }));
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
}
