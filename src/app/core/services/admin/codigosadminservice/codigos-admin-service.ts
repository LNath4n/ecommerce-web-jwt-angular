import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  UploadProductCodesRequest,
  UploadProductCodesResponse,
} from '@core/models/codigovirtual/codigoVirtualModels';

@Injectable({ providedIn: 'root' })
export class CodigosAdminService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/admin/products`;

  cargarCodigos(
    productoId: number,
    request: UploadProductCodesRequest,
  ): Observable<UploadProductCodesResponse> {
    return this.http.post<UploadProductCodesResponse>(
      `${this.url}/${productoId}/codes`,
      request,
    );
  }
}
