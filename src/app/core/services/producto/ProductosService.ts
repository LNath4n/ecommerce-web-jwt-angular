import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  CategoryOptionResponse,
  ProductOrder,
  PageResponse,
  PublicProductResponse,
} from '@core/models/producto/productoModels';
import { ReviewPage, ReviewSummary } from '@core/models/producto/resenaModels';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/products`;

  getAll(page: number = 0, size: number = 20): Observable<PageResponse<PublicProductResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<PublicProductResponse>>(this.url, { params });
  }

  getById(id: number): Observable<PublicProductResponse> {
    return this.http.get<PublicProductResponse>(`${this.url}/${id}`);
  }

  getBySlug(slug: string): Observable<PublicProductResponse> {
    return this.http.get<PublicProductResponse>(
      `${this.url}/slug/${encodeURIComponent(slug)}`
    );
  }

  obtenerResenas(idProducto: number, page = 0, size = 10): Observable<ReviewPage> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<ReviewPage>(`${this.url}/${idProducto}/reviews`, { params });
  }

  obtenerResumenResenas(idProducto: number): Observable<ReviewSummary> {
    return this.http.get<ReviewSummary>(`${this.url}/${idProducto}/reviews/summary`);
  }

  obtenerTopVistas(): Observable<PublicProductResponse[]> {
    return this.http.get<PublicProductResponse[]>(`${this.url}/top/views`);
  }

  obtenerTopCalificados(): Observable<PublicProductResponse[]> {
    return this.http.get<PublicProductResponse[]>(`${this.url}/top/rated`);
  }

  obtenerTopResenados(): Observable<PublicProductResponse[]> {
    return this.http.get<PublicProductResponse[]>(`${this.url}/top/reviewed`);
  }

  obtenerPlataformas(): Observable<string[]> {
    return this.http.get<string[]>(`${this.url}/platforms`);
  }

  obtenerListaDeCategorias(): Observable<CategoryOptionResponse[]> {
    return this.http.get<CategoryOptionResponse[]>(`${this.url}/categories`);
  }

  buscar(
    filtros: { q?: string; plataforma?: string; categoriaId?: number; orden?: ProductOrder },
    page: number = 0,
    size: number = 20
  ): Observable<PageResponse<PublicProductResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    const q = filtros.q?.trim();
    if (q) params = params.set('q', q);
    if (filtros.plataforma) params = params.set('plataforma', filtros.plataforma);
    if (filtros.categoriaId != null) {
      params = params.set('categoriaId', filtros.categoriaId.toString());
    }
    if (filtros.orden) params = params.set('orden', filtros.orden);

    return this.http.get<PageResponse<PublicProductResponse>>(`${this.url}/search`, { params });
  }
}