import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { environment } from '@environments/environment';
import { ClientePublico } from '@core/models/cliente/clienteModels';

import { ClientesService } from './ClientesService';

describe('ClientesService', () => {
  let service: ClientesService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ClientesService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('uploads a profile photo as multipart data', () => {
    const file = new File(['photo'], 'profile.png', { type: 'image/png' });
    const profile: ClientePublico = {
      email: 'cliente@example.com',
      nombre: 'Cliente',
      telefono: '123456789',
      fotoUrl: 'https://example.com/profile.png'
    };

    service.subirFoto(file).subscribe(response => {
      expect(response).toEqual(profile);
    });

    const request = httpTestingController.expectOne(
      `${environment.apiUrl}/cliente/foto`
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body instanceof FormData).toBe(true);
    expect((request.request.body as FormData).get('file')).toBe(file);
    request.flush(profile);
  });

  it('removes the profile photo', () => {
    const profile: ClientePublico = {
      email: 'cliente@example.com',
      nombre: 'Cliente',
      telefono: '123456789'
    };

    service.quitarFoto().subscribe(response => {
      expect(response).toEqual(profile);
    });

    const request = httpTestingController.expectOne(
      `${environment.apiUrl}/cliente/foto`
    );
    expect(request.request.method).toBe('DELETE');
    request.flush(profile);
  });
});
