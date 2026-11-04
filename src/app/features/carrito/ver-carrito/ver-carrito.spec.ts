import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { VerCarrito } from './ver-carrito';
import { CarritosService } from '@core/services/carrito/CarritosService';
import { AlertaService } from '@core/services/modals/ModalsService';

describe('VerCarrito', () => {
  let component: VerCarrito;
  let fixture: ComponentFixture<VerCarrito>;
  const carritoServiceMock = {
    obtenerCarrito: vi.fn().mockReturnValue(of({
      id: 1,
      productos: [],
      fechaCreacion: '',
      subtotal: 0,
    })),
    actualizar: vi.fn(),
    eliminar: vi.fn(),
  };
  const alertaMock = { error: vi.fn(), exito: vi.fn() };
  const routerMock = { navigate: vi.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerCarrito],
      providers: [
        { provide: CarritosService, useValue: carritoServiceMock },
        { provide: AlertaService, useValue: alertaMock },
        { provide: Router, useValue: routerMock },
        provideTranslateService(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VerCarrito);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
