import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  LucidePencil,
  LucideTrash2,
  LucideSearch,
  LucideChevronLeft,
  LucideChevronRight,
  LucideImageOff,
} from '@lucide/angular';
import {
  CategoriaOpcionResponse,
  ProductoPublicoResponse,
  ProductoRequest,
  TipoProducto,
} from '@core/models/producto/productoModels';
import { ProductosService } from '@core/services/producto/ProductosService';
import { ProductoAdminService } from '@core/services/admin/productoadminservice/ProductoAdminService';
import { AlertaService } from '@core/services/modals/ModalsService';
import { ComponenteConCambios } from '@core/guard/cambios-sin-guardar-guard';
import { switchMap, of, catchError, throwError } from 'rxjs';

@Component({
  imports: [
    FormsModule,
    TranslatePipe,
    LucidePencil,
    LucideTrash2,
    LucideSearch,
    LucideChevronLeft,
    LucideChevronRight,
    LucideImageOff,
  ],
  selector: 'app-administrar-productos',
  styleUrl: './administrar-productos.css',
  templateUrl: './administrar-productos.html',
})
export class AdministrarProductos implements OnInit, OnDestroy, ComponenteConCambios {
  private productosService = inject(ProductosService);
  private adminService = inject(ProductoAdminService);
  private alerta = inject(AlertaService);
  private translate = inject(TranslateService);

  productos = signal<ProductoPublicoResponse[]>([]);
  categorias = signal<CategoriaOpcionResponse[]>([]);
  readonly tiposProducto: TipoProducto[] = [
    'GIFT_CARD',
    'CLAVE_JUEGO',
    'LICENCIA_SOFTWARE',
    'RECARGA',
    'SUSCRIPCION',
  ];
  editandoId = signal<number | null>(null);

  form: ProductoRequest = this.formularioVacio();
  private inicial = JSON.stringify(this.form);

  //  Imagen 
  private readonly maxBytesImagen = 5 * 1024 * 1024; // igual que spring.servlet.multipart.max-file-size
  archivoImagen: File | null = null;
  vistaPrevia = signal<string | null>(null); // URL actual del producto o blob local
  inputKey = signal(0);                      // cambia para recrear el <input type="file"> y limpiarlo
  private blobUrl: string | null = null;

  //  Búsqueda y paginación 
  private readonly tamanoPagina = 5;
  textoBusqueda = '';
  paginaActual = signal(0); // base 0
  totalPaginas = signal(1);
  // Ventana de 5 botones alrededor de la página actual
  paginas = computed(() => {
    const total = this.totalPaginas();
    const ventana = 5;
    let inicio = Math.max(0, this.paginaActual() - Math.floor(ventana / 2));
    const fin = Math.min(total, inicio + ventana);
    inicio = Math.max(0, fin - ventana);
    return Array.from({ length: fin - inicio }, (_, i) => inicio + i);
  });

  ngOnInit() {
    this.cargar();
    this.productosService.obtenerListaDeCategorias().subscribe({
      next: categorias => this.categorias.set(categorias),
      error: err => this.mostrarError(err, 'ADMIN_PRODUCTS.CATEGORIES_LOAD_ERROR'),
    });
  }

  ngOnDestroy() {
    this.liberarBlob();
  }

  cargar() {
    this.productosService
      .buscar({ q: this.textoBusqueda }, this.paginaActual(), this.tamanoPagina)
      .subscribe({
        next: res => {
          // Si se borro el último de la última página, retrocede una
          if (res.content.length === 0 && this.paginaActual() > 0) {
            this.irAPagina(this.paginaActual() - 1);
            return;
          }
          this.productos.set(res.content);
          this.totalPaginas.set(Math.max(res.totalPages, 1));
        },
        error: err => this.mostrarError(err, 'ADMIN_PRODUCTS.PRODUCTS_LOAD_ERROR'),
      });
  }

  limpiarBusqueda() {
    this.textoBusqueda = '';
    this.buscar();
  }

  buscar() {
    this.paginaActual.set(0);
    this.cargar();
  }

  irAPagina(pagina: number) {
    if (pagina < 0 || pagina >= this.totalPaginas()) return;
    this.paginaActual.set(pagina);
    this.cargar();
  }

  onArchivoSeleccionado(event: Event) {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;

    if (archivo && !['image/jpeg', 'image/png'].includes(archivo.type)) {
      this.alerta.error(this.translate.instant('ADMIN_PRODUCTS.IMAGE_FORMAT_ERROR'));
      input.value = '';
      return;
    }
    if (archivo && archivo.size > this.maxBytesImagen) {
      this.alerta.error(this.translate.instant('ADMIN_PRODUCTS.IMAGE_SIZE_ERROR'));
      input.value = '';
      return;
    }

    this.liberarBlob();
    this.archivoImagen = archivo;
    if (archivo) {
      this.blobUrl = URL.createObjectURL(archivo);
      this.vistaPrevia.set(this.blobUrl);
    }
  }

  guardar() {
    const id = this.editandoId();
    const archivo = this.archivoImagen;

    const guardarDatos$ = id !== null
      ? this.adminService.editar(id, this.form)
      : this.adminService.crear(this.form);

    guardarDatos$.pipe(
      switchMap(producto => {
        if (!archivo) return of(null);

        return this.adminService.subirImagen(producto.id, archivo).pipe(
          catchError(err => {
            // El producto ya existe: pasa a modo edición para que reintentar no lo duplique
            this.editandoId.set(producto.id);
            this.inicial = JSON.stringify(this.form);
            this.cargar();
            this.alerta.advertencia(this.translate.instant('ADMIN_PRODUCTS.IMAGE_UPLOAD_RETRY'));
            return throwError(() => err);
          })
        );
      })
    ).subscribe({
      next: () => {
        this.alerta.exito(this.translate.instant(
          id !== null ? 'ADMIN_PRODUCTS.UPDATE_SUCCESS' : 'ADMIN_PRODUCTS.CREATE_SUCCESS'
        ));
        this.cancelar();
        this.cargar();
      },
      error: err => this.mostrarError(err, 'ADMIN_PRODUCTS.SAVE_ERROR'),
    });
  }

  editar(p: ProductoPublicoResponse) {
    this.adminService.obtener(p.id).subscribe({
      next: ({ id, imagenUrl, slug, stock, fechaCreacion, ...datos }) => {
        this.editandoId.set(id);
        this.reiniciarForm(datos);
        this.reiniciarImagen(imagenUrl);
      },
      error: err => this.mostrarError(err, 'ADMIN_PRODUCTS.PRODUCT_LOAD_ERROR'),
    });
  }

  borrar(id: number) {
    if (!confirm(this.translate.instant('ADMIN_PRODUCTS.DELETE_CONFIRM'))) return;
    this.adminService.borrar(id).subscribe({
      next: () => {
        this.alerta.exito(this.translate.instant('ADMIN_PRODUCTS.DELETE_SUCCESS'));
        if (this.editandoId() === id) this.cancelar();
        this.cargar();
      },
      error: err => this.mostrarError(err, 'ADMIN_PRODUCTS.DELETE_ERROR'),
    });
  }

  desactivar(id: number) {
    if (!confirm(this.translate.instant('ADMIN_PRODUCTS.DEACTIVATE_CONFIRM'))) return;
    this.adminService.desactivar(id).subscribe({
      next: () => {
        this.alerta.exito(this.translate.instant('ADMIN_PRODUCTS.DEACTIVATE_SUCCESS'));
        if (this.editandoId() === id) this.cancelar();
        this.cargar();
      },
      error: err => this.mostrarError(err, 'ADMIN_PRODUCTS.DEACTIVATE_ERROR'),
    });
  }

  quitarImagen() {
    const id = this.editandoId();
    if (id === null || !this.vistaPrevia()) return;
    if (!confirm(this.translate.instant('ADMIN_PRODUCTS.REMOVE_IMAGE_CONFIRM'))) return;

    this.adminService.quitarImagen(id).subscribe({
      next: () => {
        this.reiniciarImagen(null);
        this.alerta.exito(this.translate.instant('ADMIN_PRODUCTS.REMOVE_IMAGE_SUCCESS'));
      },
      error: err => this.mostrarError(err, 'ADMIN_PRODUCTS.REMOVE_IMAGE_ERROR'),
    });
  }

  cancelar() {
    this.editandoId.set(null);
    this.reiniciarForm(this.formularioVacio());
    this.reiniciarImagen(null);
  }

  hayCambiosSinGuardar(): boolean {
    return JSON.stringify(this.form) !== this.inicial || this.archivoImagen !== null;
  }

  private reiniciarForm(valor: ProductoRequest) {
    this.form = valor;
    this.inicial = JSON.stringify(valor);
  }

  private reiniciarImagen(urlActual: string | null) {
    this.liberarBlob();
    this.archivoImagen = null;
    this.vistaPrevia.set(urlActual);
    this.inputKey.update(k => k + 1); // recrea el input y borra el nombre del archivo
  }

  private formularioVacio(): ProductoRequest {
    return {
      sku: '',
      nombre: '',
      tipo: 'GIFT_CARD',
      precioVenta: 0,
      activo: true,
    };
  }

  private liberarBlob() {
    if (this.blobUrl) {
      URL.revokeObjectURL(this.blobUrl);
      this.blobUrl = null;
    }
  }

  private mostrarError(err: unknown, mensajeDefaultKey: string) {
    if (err instanceof HttpErrorResponse && typeof err.error === 'string') {
      this.alerta.error(err.error);
      return;
    }
    this.alerta.error(this.translate.instant(mensajeDefaultKey));
  }
}