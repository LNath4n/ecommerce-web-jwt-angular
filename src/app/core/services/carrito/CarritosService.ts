
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
    AddCartItemRequest,
    CartResponse,
    UpdateCartItemQuantityRequest,
} from '@core/models/carrito/carritoModels';

@Injectable({ providedIn: 'root' })
export class CarritosService {
    private url = `${environment.apiUrl}/cart`;

    constructor(private http: HttpClient) { }

    agregar(request: AddCartItemRequest): Observable<string> {
        return this.http.post(this.url, request, { responseType: 'text' });
    }

    obtenerCarrito(): Observable<CartResponse> {
        return this.http.get<CartResponse>(this.url);
    }

    actualizar(request: UpdateCartItemQuantityRequest): Observable<string> {
        return this.http.put(this.url, request, { responseType: 'text' });
    }

    eliminar(idProducto: number): Observable<string> {
        return this.http.delete(`${this.url}/${idProducto}`, { responseType: 'text' });
    }
}
