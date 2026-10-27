import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { Verperfil } from './verperfil';
import { AuthService } from '@core/services/auth/auth';
import { ClientesService } from '@core/services/cliente/ClientesService';
import { AlertaService } from '@core/services/modals/ModalsService';

describe('Verperfil', () => {
  let component: Verperfil;
  let fixture: ComponentFixture<Verperfil>;
  const clientesServiceMock = {
    obtenerPerfil: vi.fn().mockReturnValue(of({ email: 'test@example.com', nombre: '', telefono: '' })),
  };
  const alertaMock = {
    error: vi.fn(),
    exito: vi.fn(),
    advertencia: vi.fn(),
    solicitarConfirmacion: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Verperfil],
      providers: [
        { provide: ClientesService, useValue: clientesServiceMock },
        { provide: AuthService, useValue: { clearToken: vi.fn() } },
        { provide: AlertaService, useValue: alertaMock },
        { provide: Router, useValue: { navigate: vi.fn() } },
        provideTranslateService(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Verperfil);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
