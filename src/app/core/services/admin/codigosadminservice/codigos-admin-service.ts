import { HttpClient } from '@angular/common/http';
import { Service, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  CargarCodigosRequest,
  CodigosCargadosResponse,
} from '@core/models/codigovirtual/codigoVirtualModels';

@Service()
export class CodigosAdminService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/admin/productos`;

  cargarCodigos(
    productoId: number,
    request: CargarCodigosRequest,
  ): Observable<CodigosCargadosResponse> {
    return this.http.post<CodigosCargadosResponse>(
      `${this.url}/${productoId}/codigos`,
      request,
    );
  }
}
