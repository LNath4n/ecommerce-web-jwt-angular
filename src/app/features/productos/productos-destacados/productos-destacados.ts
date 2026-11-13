import { Component, computed, inject, OnDestroy, OnInit, signal, WritableSignal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Observable, Subscription } from 'rxjs';
import { LucidePackage } from '@lucide/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { PublicProductResponse } from '@core/models/producto/productoModels';
import { AuthService } from '@core/services/auth/auth';
import { ProductosService } from '@core/services/producto/ProductosService';
import {PageHero} from '../../layout/page-hero/page-hero';

type TipoTop = 'calificacion' | 'vistas' | 'resenas';

interface SeccionTop {
  id: TipoTop;
  titulo: string; // clave de traducción
  productos: WritableSignal<PublicProductResponse[]>;
  cargando: WritableSignal<boolean>;
  error: WritableSignal<boolean>;
  cargar: () => void;
}

@Component({
  selector: 'app-productos-destacados',
  imports: [RouterLink, LucidePackage, TranslatePipe, PageHero],
  templateUrl: './productos-destacados.html',
  styleUrl: './productos-destacados.css',
})
export class ProductosDestacados implements OnInit, OnDestroy {
  private readonly productosService = inject(ProductosService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly peticiones = new Subscription();
  private readonly tamanoTop = 10;
  private readonly imagenesFallidas = signal<Set<number>>(new Set());
  private animacionInicialTimer?: ReturnType<typeof setTimeout>;

  isLoggedIn = this.authService.isLoggedIn;
  nombreUsuario = this.authService.nombre;
  animarEntrada = signal(true);

  readonly secciones: SeccionTop[] = [
    this.crearSeccion('calificacion', 'PRODUCTS_PAGE.TOP_RATED', () => this.productosService.obtenerTopCalificados()),
    this.crearSeccion('vistas', 'PRODUCTS_PAGE.TOP_VIEWS', () => this.productosService.obtenerTopVistas()),
    this.crearSeccion('resenas', 'PRODUCTS_PAGE.TOP_REVIEWED', () => this.productosService.obtenerTopResenados()),
  ];

  /** Todas terminaron de cargar, sin error y sin productos */
  todoVacio = computed(() =>
    this.secciones.every(s => !s.cargando() && !s.error() && s.productos().length === 0)
  );

  ngOnInit() {
    this.secciones.forEach(s => s.cargar());
  }

  ngOnDestroy() {
    this.peticiones.unsubscribe();
    this.detenerAnimacionEntrada();
  }

  imagenFallida(id: number): boolean {
    return this.imagenesFallidas().has(id);
  }

  marcarImagenFallida(id: number) {
    this.imagenesFallidas.update(actuales => new Set(actuales).add(id));
  }

  desplazarCarrusel(seccion: HTMLElement, direccion: -1 | 1) {
  const carrusel = seccion.querySelector<HTMLElement>('.top-carrusel');
  carrusel?.scrollBy({ left: carrusel.clientWidth * direccion, behavior: 'smooth' });
}

  verDetalle(slug: string) {
    this.router.navigate(['/productos', slug]);
  }

  private crearSeccion(
    id: TipoTop,
    titulo: string,
    fuente: () => Observable<PublicProductResponse[]>
  ): SeccionTop {
    const seccion: SeccionTop = {
      id,
      titulo,
      productos: signal<PublicProductResponse[]>([]),
      cargando: signal(true),
      error: signal(false),
      cargar: () => this.cargarTop(seccion, fuente),
    };
    return seccion;
  }

  private cargarTop(seccion: SeccionTop, fuente: () => Observable<PublicProductResponse[]>) {
    seccion.cargando.set(true);
    seccion.error.set(false);
    this.peticiones.add(fuente().subscribe({
      next: productos => {
        seccion.productos.set(productos.slice(0, this.tamanoTop));
        seccion.cargando.set(false);
        if (productos.length > 0) this.programarFinAnimacionInicial();
      },
      error: () => {
        seccion.cargando.set(false);
        seccion.error.set(true);
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