import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  ClienteEditarRequest,
  ClientePublico,
  CreacionClienteRespuestaDto,
  LoginClienteDto,
  LoginResponse
} from '@core/models/cliente/clienteModels';


@Injectable({ providedIn: 'root' })
export class ClientesService {
  private url = `${environment.apiUrl}/auth`;
  private clientesUrl = `${environment.apiUrl}/cliente`;

  constructor(private http: HttpClient) {}

  login(dto: LoginClienteDto): Observable<LoginResponse> {
  return this.http.post<LoginResponse>(`${this.url}/login`, dto);
  }

  create(dto: LoginClienteDto): Observable<CreacionClienteRespuestaDto> {
    return this.http.post<CreacionClienteRespuestaDto>(this.url, dto);
  }

  obtenerPerfil(): Observable<ClientePublico> {
    return this.http.get<ClientePublico>(this.clientesUrl);
  }

  editarPerfil(request: ClienteEditarRequest): Observable<ClientePublico> {
    return this.http.put<ClientePublico>(this.clientesUrl, request);
  }

  desactivarCuenta(): Observable<string> {
    return this.http.delete(this.clientesUrl, { responseType: 'text' });
  }

  subirFoto(file: File): Observable<ClientePublico> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ClientePublico>(`${this.clientesUrl}/foto`, formData);
  }

  quitarFoto(): Observable<ClientePublico> {
    return this.http.delete<ClientePublico>(`${this.clientesUrl}/foto`);
  }
}