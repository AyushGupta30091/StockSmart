import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    // Check role restrictions if specified
    const expectedRoles = route.data?.['roles'] as string[];
    if (expectedRoles && expectedRoles.length > 0) {
      if (!authService.hasRole(expectedRoles)) {
        router.navigate(['/dashboard']);
        return false;
      }
    }
    return true;
  }

  router.navigate(['/login']);
  return false;
};
