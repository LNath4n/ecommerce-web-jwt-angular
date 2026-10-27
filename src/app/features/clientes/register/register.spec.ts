import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { provideTranslateService } from '@ngx-translate/core';
import { Register } from './register';
import { ClientesService } from '@core/services/cliente/ClientesService';
import { AlertaService } from '@core/services/modals/ModalsService';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  // De cada inject vamos a checar sus funciones y vamos a crear un mock para cada una de ellas
  const clientesServiceMock = {
    create: vi.fn(),
  };
  const alertaMock = {
    exito: vi.fn(),
    error: vi.fn(),
  };
  const routerMock = {
    navigate: vi.fn(),
  };

  beforeEach(async () => {
    //En pocas palabras: antes de cada it, limpia los mocks, 
    // configura Angular con servicios simulados, crea el componente y espera a que quede listo. 
    // Así cada prueba empieza con una instancia nueva y un entorno preparado.


    vi.clearAllMocks(); // limpia llamadas entre tests

    await TestBed.configureTestingModule({
      imports: [Register],
      // "@InjectMocks": Angular inyectará los mocks en lugar de los servicios reales
      providers: [
        { provide: ClientesService, useValue: clientesServiceMock },
        { provide: AlertaService, useValue: alertaMock },
        { provide: Router, useValue: routerMock },
        provideTranslateService(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);

    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('irLogin debe navegar a /login', () => {
    component.irLogin();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('regresar debe navegar a /', () => {
    component.regresar();

    expect(routerMock.navigate).toHaveBeenCalledWith(['/']);
  });



  it('registro debe mostrar alerta de éxito cuando se crea la cuenta', () => {
    // Arrange: el mock devuelve un Observable que emite OK
    clientesServiceMock.create.mockReturnValue(of({})); //El simil de ThenReturn
    component.email = 'test@correo.com';
    component.password = '123456';

    // Act
    component.registro();

    // Assert
    expect(clientesServiceMock.create).toHaveBeenCalledWith({
      email: 'test@correo.com',
      password: '123456',
    });
    expect(alertaMock.exito).toHaveBeenCalledWith(
      'REGISTER_PAGE.SUCCESS_MESSAGE',
      'REGISTER_PAGE.SUCCESS_TITLE'
    );
  });

  it('registro debe mostrar alerta de error cuando falla la creación', () => {
    // Arrange: el mock devuelve un Observable que falla
    clientesServiceMock.create.mockReturnValue(throwError(() => new Error('fallo')));
    component.email = 'test@correo.com';
    component.password = '123456';

    // Act
    component.registro();

    // Assert
    expect(alertaMock.error).toHaveBeenCalledWith('REGISTER_PAGE.ERROR');
    expect(alertaMock.exito).not.toHaveBeenCalled();
  });
});