import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TodosLosProductos } from './todos-los-productos';
import { ProductosService } from '@core/services/producto/ProductosService';
import { CarritosService } from '@core/services/carrito/CarritosService';
import { AuthService } from '@core/services/auth/auth';
import { AlertaService } from '@core/services/modals/ModalsService';

describe('TodosLosProductos', () => {
  let component: TodosLosProductos;

  const productosMock = { buscar: vi.fn() };
  const carritoMock = { agregar: vi.fn() };
  const authMock = { isLoggedIn: vi.fn(), nombre: vi.fn(), getToken: vi.fn() };
  const alertaMock = { exito: vi.fn(), error: vi.fn(), advertencia: vi.fn() };
  const routerMock = { navigate: vi.fn() };
  const translateMock = { instant: vi.fn((key: string) => key) };
  const paginaVacia = {
    content: [],
    totalPages: 0,
    totalElements: 0,
    number: 0,
    size: 24,
  };

  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    productosMock.buscar.mockReturnValue(of(paginaVacia));
    TestBed.configureTestingModule({
      providers: [
        { provide: ProductosService, useValue: productosMock },
        { provide: CarritosService, useValue: carritoMock },
        { provide: AuthService, useValue: authMock },
        { provide: AlertaService, useValue: alertaMock },
        { provide: Router, useValue: routerMock },
        { provide: TranslateService, useValue: translateMock },
      ],
    });
    component = TestBed.runInInjectionContext(() => new TodosLosProductos());
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('cancels a pending search when clearing the search field', () => {
    vi.useFakeTimers();
    component.ngOnInit();
    component.textoBusqueda = 'old term';
    component.programarBusqueda('old term');

    component.textoBusqueda = '';
    component.limpiarBusqueda();
    vi.advanceTimersByTime(350);

    expect(productosMock.buscar).toHaveBeenCalledTimes(1);
    expect(productosMock.buscar).toHaveBeenCalledWith({ q: '' }, 0, 24);
    expect(component.productos()).toEqual([]);
  });

  it('exposes product loading errors and retries the failed page', () => {
    productosMock.buscar.mockReturnValueOnce(throwError(() => new Error('network error')));

    component.cargarMas();

    expect(component.cargando()).toBe(false);
    expect(component.errorCarga()).toBe(true);

    productosMock.buscar.mockReturnValueOnce(of(paginaVacia));
    component.reintentarCarga();

    expect(component.errorCarga()).toBe(false);
    expect(component.cargando()).toBe(false);
  });

  it('uses the localized login-required cart message', () => {
    authMock.getToken.mockReturnValue(null);

    component.agregarAlCarrito(42);

    expect(translateMock.instant).toHaveBeenCalledWith('PRODUCT_DETAIL.LOGIN_REQUIRED');
    expect(alertaMock.advertencia).toHaveBeenCalledWith('PRODUCT_DETAIL.LOGIN_REQUIRED');
    expect(carritoMock.agregar).not.toHaveBeenCalled();
  });
});