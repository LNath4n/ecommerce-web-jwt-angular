import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  AuthResponse,
  CustomerLoginRequest,
  PublicCustomerResponse,
  UpdateCustomerRequest,
} from '@core/models/cliente/clienteModels';


@Injectable({ providedIn: 'root' })
export class ClientesService {
  private url = `${environment.apiUrl}/auth`;
  private clientesUrl = `${environment.apiUrl}/customer`;

  constructor(private http: HttpClient) {}

  login(dto: CustomerLoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.url}/login`, dto);
  }

  create(dto: CustomerLoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.url, dto);
  }

  obtenerPerfil(): Observable<PublicCustomerResponse> {
    return this.http.get<PublicCustomerResponse>(this.clientesUrl);
  }

  editarPerfil(request: UpdateCustomerRequest): Observable<PublicCustomerResponse> {
    return this.http.put<PublicCustomerResponse>(this.clientesUrl, request);
  }

  desactivarCuenta(): Observable<string> {
    return this.http.delete(this.clientesUrl, { responseType: 'text' });
  }

  subirFoto(file: File): Observable<PublicCustomerResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<PublicCustomerResponse>(`${this.clientesUrl}/photo`, formData);
  }

  quitarFoto(): Observable<PublicCustomerResponse> {
    return this.http.delete<PublicCustomerResponse>(`${this.clientesUrl}/photo`);
  }
}