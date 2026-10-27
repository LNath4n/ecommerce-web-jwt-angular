
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ActualizarCantidad, AgregarCarrito, Carrito } from '@core/models/carrito/carritoModels';

@Injectable({ providedIn: 'root' })
export class CarritosService {
    private url = `${environment.apiUrl}/carrito`;

    constructor(private http: HttpClient) { }

    agregar(dto: AgregarCarrito): Observable<string> {
        return this.http.post(`${this.url}`, dto, { responseType: 'text' });
    }
 
    obtenerCarrito(): Observable<Carrito> {
        return this.http.get<Carrito>(`${this.url}`);
    }

    actualizar(dto: ActualizarCantidad): Observable<string> {
        return this.http.put(this.url, dto, { responseType: 'text' });
    }

    eliminar(idProducto: number): Observable<string> {
        return this.http.delete(`${this.url}/${idProducto}`, { responseType: 'text' });
    }
}
