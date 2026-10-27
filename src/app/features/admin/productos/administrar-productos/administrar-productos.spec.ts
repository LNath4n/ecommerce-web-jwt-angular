import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideTranslateService } from '@ngx-translate/core';
import { AlertaService } from '@core/services/modals/ModalsService';
import { ProductosService } from '@core/services/producto/ProductosService';
import { ProductoAdminService } from '@core/services/admin/productoadminservice/ProductoAdminService';
import { AdministrarProductos } from './administrar-productos';

describe('AdministrarProductos', () => {
  let component: AdministrarProductos;
  let fixture: ComponentFixture<AdministrarProductos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdministrarProductos],
      providers: [
        {
          provide: ProductosService,
          useValue: {
            buscar: () => of({ content: [], totalPages: 0, totalElements: 0, number: 0, size: 5 }),
            obtenerListaDeCategorias: () => of([]),
          },
        },
        { provide: ProductoAdminService, useValue: {} },
        { provide: AlertaService, useValue: { error: () => undefined, exito: () => undefined, advertencia: () => undefined } },
        provideTranslateService(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdministrarProductos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
