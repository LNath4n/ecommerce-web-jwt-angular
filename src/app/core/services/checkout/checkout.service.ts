import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface CheckoutResponse {
  orderId: string;
}

export interface CheckoutConfirmResponse {
  orderId: number;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/checkout`;

  crearOrden(): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(this.url, null);
  }

  confirmarPago(orderId: string): Observable<CheckoutConfirmResponse> {
    return this.http.post<CheckoutConfirmResponse>(`${this.url}/confirm`, { orderId });
  }

  cancelarOrden(orderId: string): Observable<void> {
    return this.http.post<void>(`${this.url}/cancel`, { orderId });
  }
}
