import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { CheckoutService } from '@core/services/checkout/checkout.service';
import {
  PayPalButtonOptions,
  PayPalSdkService,
} from '@core/services/checkout/paypal-sdk.service';
import { PayPalButtonComponent } from './paypal-button';

describe('PayPalButtonComponent', () => {
  let fixture: ComponentFixture<PayPalButtonComponent>;
  let options!: PayPalButtonOptions;
  const checkoutServiceMock = {
    crearOrden: vi.fn().mockReturnValue(of({ orderId: 'PAYPAL-ORDER-1' })),
    confirmarPago: vi.fn().mockReturnValue(of({ orderId: 7, status: 'PAID' })),
    cancelarOrden: vi.fn().mockReturnValue(of(undefined)),
  };
  const buttonInstance = { render: vi.fn().mockResolvedValue(undefined) };
  const sdkMock = {
    load: vi.fn().mockResolvedValue({
      Buttons: vi.fn((buttonOptions: PayPalButtonOptions) => {
        options = buttonOptions;
        return buttonInstance;
      }),
    }),
  };

  beforeEach(async () => {
    checkoutServiceMock.crearOrden.mockClear();
    checkoutServiceMock.confirmarPago.mockClear();
    checkoutServiceMock.cancelarOrden.mockClear();
    sdkMock.load.mockClear();
    buttonInstance.render.mockClear();

    await TestBed.configureTestingModule({
      imports: [PayPalButtonComponent],
      providers: [
        { provide: CheckoutService, useValue: checkoutServiceMock },
        { provide: PayPalSdkService, useValue: sdkMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PayPalButtonComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('creates an order, confirms approval, and emits the result', async () => {
    const paymentSuccess = vi.fn();
    fixture.componentInstance.paymentSuccess.subscribe(paymentSuccess);

    await expect(options.createOrder()).resolves.toBe('PAYPAL-ORDER-1');
    await options.onApprove({ orderID: 'PAYPAL-ORDER-1' });

    expect(checkoutServiceMock.crearOrden).toHaveBeenCalledOnce();
    expect(checkoutServiceMock.confirmarPago).toHaveBeenCalledWith('PAYPAL-ORDER-1');
    expect(paymentSuccess).toHaveBeenCalledWith({ orderId: 7, status: 'PAID' });
  });

  it('cancels the backend order and emits cancellation', async () => {
    const paymentCancelled = vi.fn();
    fixture.componentInstance.paymentCancelled.subscribe(paymentCancelled);

    await options.onCancel({ orderID: 'PAYPAL-ORDER-1' });

    expect(checkoutServiceMock.cancelarOrden).toHaveBeenCalledWith('PAYPAL-ORDER-1');
    expect(paymentCancelled).toHaveBeenCalledOnce();
  });
});
