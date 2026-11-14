import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CartResponse } from '@core/models/carrito/carritoModels';
import { CheckoutConfirmResponse } from '@core/services/checkout/checkout.service';
import { CarritosService } from '@core/services/carrito/CarritosService';
import { ErrorMensajesService, OpcionesError } from '@core/services/errores/ErrorMensajesService';
import { reglasStock } from '@core/services/errores/reglas-error';
import { PayPalButtonComponent } from '../paypal-button/paypal-button';
import {PageHero} from '../layout/page-hero/page-hero';
import { LucideInfo } from '@lucide/angular';

@Component({
  selector: 'app-checkout',
  imports: [CurrencyPipe, RouterLink, TranslatePipe, PayPalButtonComponent, PageHero,LucideInfo],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
  private readonly carritosService = inject(CarritosService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly errores = inject(ErrorMensajesService);
 private readonly lucideInfo = LucideInfo;
  readonly carrito = signal<CartResponse | null>(null);
  readonly cargando = signal(true);
  readonly errorCarga = signal<string | null>(null);
  readonly mensajePago = signal<string | null>(null);
  readonly pago = signal<CheckoutConfirmResponse | null>(null);

  ngOnInit() {
    this.cargarCarrito();
  }

  cargarCarrito() {
    this.cargando.set(true);
    this.errorCarga.set(null);
    this.carritosService.obtenerCarrito().subscribe({
      next: carrito => {
        this.carrito.set(carrito);
        this.cargando.set(false);
      },
      error: error => {
        this.cargando.set(false);
        // 404 = el cliente aún no tiene carrito: se trata como carrito vacío
        if (this.errores.tieneStatus(error, 404)) {
          this.carrito.set(null);
          return;
        }
        this.errorCarga.set(this.errores.resolver(error, this.opcionesError('CHECKOUT.LOAD_ERROR')));
      },
    });
  }

  pagoExitoso(response: CheckoutConfirmResponse) {
    this.pago.set(response);
    this.mensajePago.set(null);
    void this.router.navigate(['/mis-compras', response.orderId]);
  }

  pagoCancelado() {
    this.mensajePago.set(this.translate.instant('CHECKOUT.CANCELLED'));
  }

  pagoConError(error: unknown) {
    this.mensajePago.set(this.errores.resolver(error, this.opcionesError('CHECKOUT.PAYMENT_ERROR')));
  }

  private opcionesError(porDefecto: string): OpcionesError {
    return {
      porDefecto,
      prefijoCampos: 'CHECKOUT.ERRORS.FIELD_',
      reglas: [
        // 400: "The cart is empty"
        { status: 400, contiene: 'cart is empty', clave: 'CHECKOUT.ERRORS.EMPTY_CART' },
        // 400: "Cannot have 3 units of X; only 2 are in stock"
        ...reglasStock('CHECKOUT.ERRORS.STOCK_EXCEEDED'),

        // 404: carrito, producto u orden
        { status: 404, contiene: 'No cart found', clave: 'CHECKOUT.ERRORS.CART_NOT_FOUND' },
        { status: 404, contiene: 'Cart not found', clave: 'CHECKOUT.ERRORS.CART_NOT_FOUND' },
        { status: 404, contiene: 'Product not found', clave: 'CHECKOUT.ERRORS.PRODUCT_UNAVAILABLE' },
        { status: 404, contiene: 'Order not found', clave: 'CHECKOUT.ERRORS.ORDER_NOT_FOUND' },

        // 409: estados del pago
        // "Order 42 cannot be paid because its status is CANCELLED"
        { status: 409, contiene: 'cannot be paid', clave: 'CHECKOUT.ERRORS.ORDER_NOT_PAYABLE' },
        // "The reservation for order 42 has expired"
        { status: 409, patron: /reservation.*expired/, clave: 'CHECKOUT.ERRORS.RESERVATION_EXPIRED' },
        // "The payment was not completed"
        { status: 409, contiene: 'not completed', clave: 'CHECKOUT.ERRORS.PAYMENT_NOT_COMPLETED' },
        // "Payment for order 42 is still being processed"
        { status: 409, contiene: 'still being processed', clave: 'CHECKOUT.ERRORS.PAYMENT_PROCESSING' },

        // 5xx: pide revisar "Mis compras" antes de reintentar (evita dobles cobros)
        { status: [500, 502, 503, 504], clave: 'CHECKOUT.ERRORS.SERVER_PAYMENT' },
      ],
    };
  }
}