import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '@environments/environment';
import { CodigosAdminService } from './codigos-admin-service';

describe('CodigosAdminService', () => {
  let service: CodigosAdminService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CodigosAdminService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('carga códigos para el producto indicado', () => {
    const productoId = 12;
    const request = { codigos: ['STEAM-AAAA-0001', 'STEAM-AAAA-0002'] };
    const response = { guardados: 2 };

    service.cargarCodigos(productoId, request).subscribe(resultado => {
      expect(resultado).toEqual(response);
    });

    const httpRequest = httpTestingController.expectOne(
      `${environment.apiUrl}/admin/productos/${productoId}/codigos`,
    );
    expect(httpRequest.request.method).toBe('POST');
    expect(httpRequest.request.body).toEqual(request);
    httpRequest.flush(response);
  });
});
