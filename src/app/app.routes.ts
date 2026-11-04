import { Routes } from '@angular/router';
import { authGuard } from '@core/guard/auth.guard';
import { adminGuard } from '@core/guard/admin.guard';
import { cambiosSinGuardarGuard } from '@core/guard/cambios-sin-guardar-guard';
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/clientes/login/login')
      .then(m => m.Login)
  },
  {
    path: 'registro',
    loadComponent: () => import('./features/clientes/register/register')
      .then(m => m.Register)
  },
  {
    path: '',
    loadComponent: () => import('./features/layout/app-nav/app-nav.component')
      .then(m => m.AppNavComponent),
    children: [
      {
        path: '',
        redirectTo: 'productos',
        pathMatch: 'full'
      },
      {
        path: 'productos',
        loadComponent: () => import('./features/productos/todos-los-productos/todos-los-productos')
          .then(m => m.TodosLosProductos)
      },
      {
        path: 'productos/destacados',
        loadComponent: () => import('./features/productos/productos-destacados/productos-destacados')
          .then(m => m.ProductosDestacados)
      },
      {
        path: 'productos/:slug',
        loadComponent: () => import('./features/productos/un-producto/un-producto')
          .then(m => m.UnProducto)
      },
      {
        path: 'carrito',
        canActivate: [authGuard],
        loadComponent: () => import('./features/carrito/ver-carrito/ver-carrito')
          .then(m => m.VerCarrito)
      },
      {
        path: 'perfil',
        canActivate: [authGuard],
        loadComponent: () => import('./features/clientes/verperfil/verperfil')
          .then(m => m.Verperfil)
      },
      {
        path: 'admin/productos',
        canActivate: [adminGuard],
        canDeactivate: [cambiosSinGuardarGuard],
        loadComponent: () => import('./features/admin/productos/administrar-productos/administrar-productos')
          .then(m => m.AdministrarProductos)
      },
      {
        path: 'admin/codigos',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/productos/administrar-codigos/administrar-codigos')
          .then(m => m.AdministrarCodigos)
      },
    ]
  },
  {
    path: '**',
    redirectTo: 'productos'
  }
];