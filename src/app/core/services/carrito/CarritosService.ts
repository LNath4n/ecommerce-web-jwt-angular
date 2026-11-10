
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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

    obtenerMensajeError(error: unknown): string | null {
        if (!(error instanceof HttpErrorResponse)) return null;
        return this.extraerMensaje(error.error);
    }

    private extraerMensaje(cuerpo: unknown): string | null {
        if (typeof cuerpo === 'string') {
            const texto = cuerpo.trim();
            if (!texto) return null;

            if (texto.startsWith('{') || texto.startsWith('[')) {
                try {
                    return this.extraerMensaje(JSON.parse(texto)) ?? texto;
                } catch {
                    return texto;
                }
            }

            return texto;
        }

        if (Array.isArray(cuerpo)) {
            const mensajes = cuerpo
                .map(item => this.extraerMensaje(item))
                .filter((mensaje): mensaje is string => mensaje !== null);
            return mensajes.length ? mensajes.join('; ') : null;
        }

        if (typeof cuerpo !== 'object' || cuerpo === null) return null;

        const respuesta = cuerpo as Record<string, unknown>;
        for (const campo of ['mensaje', 'message', 'detail', 'error', 'title']) {
            const mensaje = this.extraerMensaje(respuesta[campo]);
            if (mensaje) return mensaje;
        }

        const errores = respuesta['errors'];
        if (typeof errores === 'object' && errores !== null && !Array.isArray(errores)) {
            const mensajes = Object.values(errores)
                .map(item => this.extraerMensaje(item))
                .filter((mensaje): mensaje is string => mensaje !== null);
            return mensajes.length ? mensajes.join('; ') : null;
        }

        return this.extraerMensaje(errores);
    }
}
