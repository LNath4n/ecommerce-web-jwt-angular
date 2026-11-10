import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OrderDetail, OrderSummary } from '@core/models/ordenes/ordenesModels';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class OrdenesService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/orders`;

  listarMisOrdenes(): Observable<OrderSummary[]> {
    return this.http.get<OrderSummary[]>(this.url);
  }

  obtenerDetalle(id: number): Observable<OrderDetail> {
    return this.http.get<OrderDetail>(`${this.url}/${id}`);
  }
}
