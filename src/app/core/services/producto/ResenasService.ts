import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ReviewEligibility,
  ReviewRequest,
  ReviewResponse,
} from '@core/models/producto/resenaModels';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class ResenasService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/reviews/products`;

  obtenerMiResena(productId: number): Observable<ReviewResponse> {
    return this.http.get<ReviewResponse>(`${this.url}/${productId}/mine`);
  }

  obtenerElegibilidad(productId: number): Observable<ReviewEligibility> {
    return this.http.get<ReviewEligibility>(`${this.url}/${productId}/eligibility`);
  }

  crear(productId: number, request: ReviewRequest): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(`${this.url}/${productId}`, request);
  }

  actualizar(productId: number, request: ReviewRequest): Observable<ReviewResponse> {
    return this.http.put<ReviewResponse>(`${this.url}/${productId}`, request);
  }

  eliminar(productId: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${productId}`);
  }
}
