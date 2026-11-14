import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { vi } from 'vitest';

import { Login } from './login';
import { ClientesService } from '@core/services/cliente/ClientesService';
import { AuthService } from '@core/services/auth/auth';
import { AlertaService } from '@core/services/modals/ModalsService';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  const clientesServiceMock = { login: vi.fn() };
  const authServiceMock = { setToken: vi.fn() };
  const alertaMock = { exito: vi.fn(), error: vi.fn() };
  const routerMock = { navigate: vi.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: ClientesService, useValue: clientesServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: AlertaService, useValue: alertaMock },
        { provide: Router, useValue: routerMock },
        provideTranslateService(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
