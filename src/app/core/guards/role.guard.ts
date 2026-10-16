import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Exige autenticação e, se a rota declarar `data: { roles: [...] }`, que o usuário
 * possua pelo menos um dos perfis listados (perfis são acumuláveis).
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  const roles = (route.data['roles'] as string[] | undefined) ?? [];
  if (roles.length === 0 || auth.hasAnyRole(roles)) {
    return true;
  }
  return router.createUrlTree(['/acesso-negado']);
};

/** Impede que um usuário já autenticado volte para a tela de login. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? router.createUrlTree(['/']) : true;
};
