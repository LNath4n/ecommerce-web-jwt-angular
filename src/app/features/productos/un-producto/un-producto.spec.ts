import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { provideTranslateService } from '@ngx-translate/core';
import { vi } from 'vitest';

import { UnProducto } from './un-producto';
import { ProductosService } from '@core/services/producto/ProductosService';
import { AuthService } from '@core/services/auth/auth';
import { CarritosService } from '@core/services/carrito/CarritosService';
import { AlertaService } from '@core/services/modals/ModalsService';

describe('UnProducto', () => {
  let component: UnProducto;
  let fixture: ComponentFixture<UnProducto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnProducto],
      providers: [
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({})) } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        { provide: ProductosService, useValue: { getBySlug: vi.fn() } },
        { provide: AuthService, useValue: { getToken: vi.fn() } },
        { provide: CarritosService, useValue: { agregar: vi.fn() } },
        { provide: AlertaService, useValue: { advertencia: vi.fn(), exito: vi.fn(), error: vi.fn() } },
        provideTranslateService(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UnProducto);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
