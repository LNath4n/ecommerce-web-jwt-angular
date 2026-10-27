import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LucideChevronLeft, LucideChevronRight, LucideSearch } from '@lucide/angular';
import { ProductoPublicoResponse } from '@core/models/producto/productoModels';
import { ProductosService } from '@core/services/producto/ProductosService';
import { AlertaService } from '@core/services/modals/ModalsService';
import { CodigosAdminService } from '@core/services/admin/codigosadminservice/codigos-admin-service';

@Component({
  imports: [FormsModule, TranslatePipe, LucideChevronLeft, LucideChevronRight, LucideSearch],
  selector: 'app-administrar-codigos',
  styleUrl: './administrar-codigos.css',
  templateUrl: './administrar-codigos.html',
})
export class AdministrarCodigos implements OnInit {
  private readonly productosService = inject(ProductosService);
  private readonly codigosAdminService = inject(CodigosAdminService);
  private readonly alerta = inject(AlertaService);
  private readonly translate = inject(TranslateService);
  private readonly tamanoPagina = 5;

  readonly productos = signal<ProductoPublicoResponse[]>([]);
  readonly productoSeleccionado = signal<ProductoPublicoResponse | null>(null);
  readonly cargandoProductos = signal(false);
  readonly cargandoCodigos = signal(false);
  readonly paginaActual = signal(0);
  readonly totalPaginas = signal(1);
  readonly paginas = computed(() => {
    const total = this.totalPaginas();
    const ventana = 5;
    let inicio = Math.max(0, this.paginaActual() - Math.floor(ventana / 2));
    const fin = Math.min(total, inicio + ventana);
    inicio = Math.max(0, fin - ventana);
    return Array.from({ length: fin - inicio }, (_, i) => inicio + i);
  });

  textoBusqueda = '';
  textoCodigos = '';

  ngOnInit() {
    this.cargarProductos();
  }

  cargarProductos() {
    this.consultarProductos(this.paginaActual());
  }

  private consultarProductos(pagina: number) {
    this.cargandoProductos.set(true);
    this.productosService.buscar({ q: this.textoBusqueda }, pagina, this.tamanoPagina).subscribe({
      next: respuesta => {
        if (respuesta.content.length === 0 && pagina > 0) {
          this.paginaActual.set(pagina - 1);
          this.consultarProductos(pagina - 1);
          return;
        }
        this.productos.set(respuesta.content);
        this.totalPaginas.set(Math.max(respuesta.totalPages, 1));
        this.cargandoProductos.set(false);
      },
      error: error => {
        this.cargandoProductos.set(false);
        this.mostrarError(error, 'ADMIN_CODES.PRODUCTS_LOAD_ERROR');
      },
    });
  }

  buscarProductos() {
    this.paginaActual.set(0);
    this.consultarProductos(0);
  }

  limpiarBusqueda() {
    this.textoBusqueda = '';
    this.buscarProductos();
  }

  irAPagina(pagina: number) {
    if (pagina < 0 || pagina >= this.totalPaginas()) return;
    this.paginaActual.set(pagina);
    this.consultarProductos(pagina);
  }

  seleccionarProducto(producto: ProductoPublicoResponse) {
    this.productoSeleccionado.set(producto);
  }

  cantidadCodigosIngresados(): number {
    return this.textoCodigos.split(/\r?\n/).filter(codigo => codigo.trim().length > 0).length;
  }

  cargarCodigos() {
    const producto = this.productoSeleccionado();
    const codigos = this.textoCodigos
      .split(/\r?\n/)
      .map(codigo => codigo.trim())
      .filter(codigo => codigo.length > 0);

    if (!producto) {
      this.alerta.error(this.translate.instant('ADMIN_CODES.SELECT_PRODUCT_ERROR'));
      return;
    }
    if (codigos.length === 0) {
      this.alerta.error(this.translate.instant('ADMIN_CODES.EMPTY_CODES_ERROR'));
      return;
    }
    if (codigos.length > 500) {
      this.alerta.error(this.translate.instant('ADMIN_CODES.MAX_CODES_ERROR'));
      return;
    }

    this.cargandoCodigos.set(true);
    this.codigosAdminService.cargarCodigos(producto.id, { codigos }).subscribe({
      next: respuesta => {
        this.cargandoCodigos.set(false);
        this.textoCodigos = '';
        this.alerta.exito(this.translate.instant('ADMIN_CODES.UPLOAD_SUCCESS', {
          count: respuesta.guardados,
          product: producto.nombre,
        }));
      },
      error: error => {
        this.cargandoCodigos.set(false);
        this.mostrarError(error, 'ADMIN_CODES.UPLOAD_ERROR');
      },
    });
  }

  private mostrarError(error: unknown, mensajeDefaultKey: string) {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string' && error.error.trim()) {
        this.alerta.error(error.error);
        return;
      }
      if (error.status === 400) {
        this.alerta.error(this.translate.instant('ADMIN_CODES.INVALID_REQUEST'));
        return;
      }
      if (error.status === 404) {
        this.alerta.error(this.translate.instant('ADMIN_CODES.PRODUCT_NOT_FOUND'));
        return;
      }
      if (error.status === 409) {
        this.alerta.error(this.translate.instant('ADMIN_CODES.DUPLICATE_CODES'));
        return;
      }
    }
    this.alerta.error(this.translate.instant(mensajeDefaultKey));
  }
}
