import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { OrderDetail, OrderSummary } from '@core/models/ordenes/ordenesModels';
import { OrdenesService } from '@core/services/ordenes/OrdenesService';
import { ErrorMensajesService, ReglaError } from '@core/services/errores/ErrorMensajesService';
import {PageHero} from '../../layout/page-hero/page-hero';

@Component({
  selector: 'app-mis-compras',
  imports: [CurrencyPipe, DatePipe, RouterLink, TranslatePipe, LucideEye, LucideEyeOff, PageHero],
  templateUrl: './mis-compras.html',
  styleUrl: './mis-compras.css',
})
export class MisCompras implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ordenesService = inject(OrdenesService);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly errores = inject(ErrorMensajesService);

  readonly esDetalle = signal(false);
  readonly ordenActualId = signal<number | null>(null);
  readonly ordenes = signal<OrderSummary[] | null>(null);
  readonly detalle = signal<OrderDetail | null>(null);
  readonly cargando = signal(true);
  readonly errorCarga = signal<string | null>(null);
  private readonly codigosVisibles = signal<Set<string>>(new Set());

  private readonly reglasError: ReglaError[] = [
    // El ID de la orden no tiene un formato válido
    { status: 400, clave: 'ORDERS.INVALID_ID' },
    // "Order not found with ID: 42" (no existe o no es del cliente)
    { status: 404, clave: 'ORDERS.NOT_FOUND' },
  ];

  ordenCancelada(status: string): boolean {
    const normalizedStatus = status.trim().toUpperCase();
    return ['CANCELLED', 'CANCELED', 'CANCELADO', 'CANCELADA'].includes(normalizedStatus);
  }

  codigoVisible(orderId: number, productId: number, index: number): boolean {
    return this.codigosVisibles().has(`${orderId}:${productId}:${index}`);
  }

  alternarVisibilidadCodigo(orderId: number, productId: number, index: number) {
    const key = `${orderId}:${productId}:${index}`;
    this.codigosVisibles.update(current => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const idParam = params.get('id');
      if (idParam === null) {
        this.cargarOrdenes();
        return;
      }

      const id = Number(idParam);
      if (!Number.isSafeInteger(id) || id < 1) {
        this.esDetalle.set(true);
        this.ordenActualId.set(null);
        this.detalle.set(null);
        this.cargando.set(false);
        this.errorCarga.set(this.translate.instant('ORDERS.INVALID_ID'));
        return;
      }

      this.cargarDetalle(id);
    });
  }

  reintentarCarga() {
    const ordenId = this.ordenActualId();
    if (ordenId !== null) {
      this.cargarDetalle(ordenId);
      return;
    }

    if (!this.esDetalle()) {
      this.cargarOrdenes();
    }
  }

  private cargarOrdenes() {
    this.ordenActualId.set(null);
    this.esDetalle.set(false);
    this.ordenes.set(null);
    this.detalle.set(null);
    this.cargando.set(true);
    this.errorCarga.set(null);

    this.ordenesService.listarMisOrdenes().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ordenes => {
        this.ordenes.set(ordenes);
        this.cargando.set(false);
      },
      error: error => {
        this.cargando.set(false);
        this.errorCarga.set(this.mensajeError(error, 'ORDERS.LOAD_ERROR'));
      },
    });
  }

  private cargarDetalle(id: number) {
    this.ordenActualId.set(id);
    this.codigosVisibles.set(new Set());
    this.esDetalle.set(true);
    this.ordenes.set(null);
    this.detalle.set(null);
    this.cargando.set(true);
    this.errorCarga.set(null);

    this.ordenesService.obtenerDetalle(id).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: detalle => {
        this.detalle.set(detalle);
        this.cargando.set(false);
      },
      error: error => {
        this.cargando.set(false);
        this.errorCarga.set(this.mensajeError(error, 'ORDERS.DETAIL_ERROR'));
      },
    });
  }

  private mensajeError(error: unknown, translationKey: string): string {
    return this.errores.resolver(error, {
      porDefecto: translationKey,
      reglas: this.reglasError,
    });
  }
}