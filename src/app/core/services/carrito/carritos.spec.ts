import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';

import { CarritosService } from './CarritosService';

describe('CarritosService', () => {
  let service: CarritosService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient()] });
    service = TestBed.inject(CarritosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('returns the backend message from common error response formats', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { detail: 'Solo hay 2 unidades disponibles.' },
    });

    expect(service.obtenerMensajeError(error)).toBe('Solo hay 2 unidades disponibles.');
  });

  it('returns validation messages from the backend', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: { errors: { quantity: ['Solo hay 2 unidades disponibles.'] } },
    });

    expect(service.obtenerMensajeError(error)).toBe('Solo hay 2 unidades disponibles.');
  });
});
