import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  output,
  PLATFORM_ID,
  viewChild,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import {
  CheckoutConfirmResponse,
  CheckoutService,
} from '@core/services/checkout/checkout.service';
import {
  PayPalButtonOptions,
  PayPalButtonsInstance,
  PayPalSdkService,
} from '@core/services/checkout/paypal-sdk.service';

@Component({
  selector: 'app-paypal-button',
  templateUrl: './paypal-button.html',
})
export class PayPalButtonComponent implements AfterViewInit {
  readonly paymentSuccess = output<CheckoutConfirmResponse>();
  readonly paymentCancelled = output<void>();
  readonly paymentError = output<unknown>();

  private readonly buttonHost = viewChild.required<ElementRef<HTMLDivElement>>('buttonHost');
  private readonly platformId = inject(PLATFORM_ID);
  private readonly sdk = inject(PayPalSdkService);
  private readonly checkoutService = inject(CheckoutService);
  private paypalButtons: PayPalButtonsInstance | null = null;

  async ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const paypal = await this.sdk.load(environment.paypalClientId);
      if (!this.buttonHost().nativeElement.isConnected) return;

      const options: PayPalButtonOptions = {
        createOrder: async () => {
          const response = await firstValueFrom(this.checkoutService.crearOrden());
          if (!response.orderId.trim()) {
            throw new Error('PAYPAL_ORDER_ID_MISSING');
          }
          return response.orderId;
        },
        onApprove: async ({ orderID }) => {
          try {
            const response = await firstValueFrom(this.checkoutService.confirmarPago(orderID));
            this.paymentSuccess.emit(response);
          } catch (error) {
            this.paymentError.emit(error);
          }
        },
        onCancel: async ({ orderID }) => {
          try {
            if (orderID) {
              await firstValueFrom(this.checkoutService.cancelarOrden(orderID));
            }
            this.paymentCancelled.emit();
          } catch (error) {
            this.paymentError.emit(error);
          }
        },
        onError: error => this.paymentError.emit(error),
      };

      this.paypalButtons = paypal.Buttons(options);
      await this.paypalButtons.render(this.buttonHost().nativeElement);
    } catch (error) {
      this.paymentError.emit(error);
    }
  }
}
