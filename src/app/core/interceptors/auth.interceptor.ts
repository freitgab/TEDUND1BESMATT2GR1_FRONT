import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { API_BASE, FRONTEND_HEADER_NAME, FRONTEND_HEADER_VALUE } from '../api.config';
import { AuthService } from '../services/auth.service';

/**
 * Interceptor de segurança. Para toda chamada ao Back-End (/api/**):
 *  - injeta `X-Requested-By: Clima-Angular-SPA` (comprova que a origem é este Front-End);
 *  - injeta `Authorization: Bearer <token>` quando há sessão (exceto no próprio login);
 *  - em 401/403, encerra a sessão e redireciona para /login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API_BASE)) {
    return next(req);
  }

  const auth = inject(AuthService);
  const router = inject(Router);
  const isLogin = req.url.startsWith(`${API_BASE}/auth/login`);

  let headers = req.headers.set(FRONTEND_HEADER_NAME, FRONTEND_HEADER_VALUE);
  const token = auth.token();
  if (token && !isLogin) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  return next(req.clone({ headers })).pipe(
    catchError((error: unknown) => {
      // No login, 401/403 são tratados pela própria tela (credenciais inválidas / acesso negado).
      if (!isLogin && error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
        auth.clearSession();
        void router.navigate(['/login'], {
          queryParams: { motivo: error.status === 401 ? 'sessao-expirada' : 'acesso-negado' },
        });
      }
      return throwError(() => error);
    }),
  );
};
