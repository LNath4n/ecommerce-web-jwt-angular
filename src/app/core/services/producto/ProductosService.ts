import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  CategoriaOpcionResponse,
  PageResponse,
  ProductoPublicoResponse,
} from '@core/models/producto/productoModels';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/productos`;

  getAll(page: number = 0, size: number = 20): Observable<PageResponse<ProductoPublicoResponse>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<ProductoPublicoResponse>>(this.url, { params });
  }

  getById(id: number): Observable<ProductoPublicoResponse> {
    return this.http.get<ProductoPublicoResponse>(`${this.url}/${id}`);
  }

  getBySlug(slug: string): Observable<ProductoPublicoResponse> {
    return this.http.get<ProductoPublicoResponse>(
      `${this.url}/slug/${encodeURIComponent(slug)}`
    );
  }

  obtenerPlataformas(): Observable<string[]> {
    return this.http.get<string[]>(`${this.url}/plataformas`);
  }

  obtenerListaDeCategorias(): Observable<CategoriaOpcionResponse[]> {
    return this.http.get<CategoriaOpcionResponse[]>(`${this.url}/categorias`);
  }

  buscar(
    filtros: { q?: string; plataforma?: string; categoriaId?: number },
    page: number = 0,
    size: number = 20
  ): Observable<PageResponse<ProductoPublicoResponse>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    const q = filtros.q?.trim();
    if (q) params = params.set('q', q);
    if (filtros.plataforma) params = params.set('plataforma', filtros.plataforma);
    if (filtros.categoriaId != null) {
      params = params.set('categoriaId', filtros.categoriaId.toString());
    }

    return this.http.get<PageResponse<ProductoPublicoResponse>>(`${this.url}/buscar`, { params });
  }
}