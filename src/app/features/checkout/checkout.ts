import { HttpErrorResponse } from '@angular/common/http';
import { CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { CartResponse } from '@core/models/carrito/carritoModels';
import { CheckoutConfirmResponse } from '@core/services/checkout/checkout.service';
import { CarritosService } from '@core/services/carrito/CarritosService';
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
        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.carrito.set(null);
          return;
        }
        this.errorCarga.set(this.translate.instant('CHECKOUT.LOAD_ERROR'));
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

  pagoConError(_error: unknown) {
    this.mensajePago.set(this.translate.instant('CHECKOUT.PAYMENT_ERROR'));
  }
}
