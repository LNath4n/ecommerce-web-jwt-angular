import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // isLoggedIn()
  if (auth.isLoggedIn()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};