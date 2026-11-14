import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CheckoutService } from './checkout.service';
import { environment } from '@environments/environment';

describe('CheckoutService', () => {
  let service: CheckoutService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CheckoutService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates a checkout order without a request body', () => {
    service.crearOrden().subscribe(response => {
      expect(response.orderId).toBe('PAYPAL-ORDER-1');
    });

    const request = http.expectOne(`${environment.apiUrl}/checkout`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    request.flush({ orderId: 'PAYPAL-ORDER-1' });
  });

  it('confirms an order with the backend contract', () => {
    service.confirmarPago('PAYPAL-ORDER-1').subscribe(response => {
      expect(response).toEqual({ orderId: 7, status: 'PAID' });
    });

    const request = http.expectOne(`${environment.apiUrl}/checkout/confirm`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ orderId: 'PAYPAL-ORDER-1' });
    request.flush({ orderId: 7, status: 'PAID' });
  });

  it('cancels an order with the backend contract', () => {
    service.cancelarOrden('PAYPAL-ORDER-1').subscribe();

    const request = http.expectOne(`${environment.apiUrl}/checkout/cancel`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ orderId: 'PAYPAL-ORDER-1' });
    request.flush(null);
  });
});
