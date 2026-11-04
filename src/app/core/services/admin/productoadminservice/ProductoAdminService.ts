import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  CategoriaOpcionResponse,
  CategoriaRequest,
  ProductoAdminResponse,
  ProductoPublicoResponse,
  ProductoRequest,
} from '@core/models/producto/productoModels';

@Injectable({ providedIn: 'root' })
export class ProductoAdminService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/admin/productos`;
  private categoriasUrl = `${environment.apiUrl}/admin/categorias`;

  crearCategoria(body: CategoriaRequest): Observable<CategoriaOpcionResponse> {
    return this.http.post<CategoriaOpcionResponse>(this.categoriasUrl, body);
  }

  editarCategoria(id: number, body: CategoriaRequest): Observable<CategoriaOpcionResponse> {
    return this.http.put<CategoriaOpcionResponse>(`${this.categoriasUrl}/${id}`, body);
  }

  borrarCategoria(id: number): Observable<string> {
    return this.http.delete(`${this.categoriasUrl}/${id}`, { responseType: 'text' });
  }

  obtener(id: number): Observable<ProductoAdminResponse> {
    return this.http.get<ProductoAdminResponse>(`${this.url}/${id}`);
  }

  crear(body: ProductoRequest): Observable<ProductoPublicoResponse> {
    return this.http.post<ProductoPublicoResponse>(this.url, body);
  }

  editar(id: number, body: ProductoRequest): Observable<ProductoPublicoResponse> {
    return this.http.put<ProductoPublicoResponse>(`${this.url}/${id}`, body);
  }

  borrar(id: number): Observable<string> {
    // El backend devuelve un String plano, no JSON
    return this.http.delete(`${this.url}/${id}`, { responseType: 'text' });
  }

  desactivar(id: number): Observable<string> {
    return this.http.patch(`${this.url}/${id}/desactivar`, null, { responseType: 'text' });
  }

  subirImagen(id: number, file: File): Observable<ProductoAdminResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ProductoAdminResponse>(`${this.url}/${id}/imagen`, formData);
  }

  quitarImagen(id: number): Observable<ProductoAdminResponse> {
    return this.http.delete<ProductoAdminResponse>(`${this.url}/${id}/imagen`);
  }
}
