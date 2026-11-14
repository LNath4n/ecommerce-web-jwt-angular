import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  AdminProductResponse,
  CategoryOptionResponse,
  CategoryRequest,
  ProductRequest,
  PublicProductResponse,
} from '@core/models/producto/productoModels';

@Injectable({ providedIn: 'root' })
export class ProductoAdminService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/admin/products`;
  private categoriasUrl = `${environment.apiUrl}/admin/categories`;

  crearCategoria(body: CategoryRequest): Observable<CategoryOptionResponse> {
    return this.http.post<CategoryOptionResponse>(this.categoriasUrl, body);
  }

  editarCategoria(id: number, body: CategoryRequest): Observable<CategoryOptionResponse> {
    return this.http.put<CategoryOptionResponse>(`${this.categoriasUrl}/${id}`, body);
  }

  borrarCategoria(id: number): Observable<string> {
    return this.http.delete(`${this.categoriasUrl}/${id}`, { responseType: 'text' });
  }

  obtener(id: number): Observable<AdminProductResponse> {
    return this.http.get<AdminProductResponse>(`${this.url}/${id}`);
  }

  crear(body: ProductRequest): Observable<PublicProductResponse> {
    return this.http.post<PublicProductResponse>(this.url, body);
  }

  editar(id: number, body: ProductRequest): Observable<PublicProductResponse> {
    return this.http.put<PublicProductResponse>(`${this.url}/${id}`, body);
  }

  borrar(id: number): Observable<string> {
    // El backend devuelve un String plano, no JSON
    return this.http.delete(`${this.url}/${id}`, { responseType: 'text' });
  }

  desactivar(id: number): Observable<string> {
    return this.http.patch(`${this.url}/${id}/deactivate`, null, { responseType: 'text' });
  }

  subirImagen(id: number, file: File): Observable<AdminProductResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<AdminProductResponse>(`${this.url}/${id}/image`, formData);
  }

  quitarImagen(id: number): Observable<AdminProductResponse> {
    return this.http.delete<AdminProductResponse>(`${this.url}/${id}/image`);
  }
}
