import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { SESSION_STORAGE_KEY } from '../api.config';
import { installMemoryStorage } from '../testing/memory-storage';
import { AuthService } from '../services/auth.service';
import { guestGuard, roleGuard } from './role.guard';

function route(roles?: string[]): ActivatedRouteSnapshot {
  return { data: roles ? { roles } : {} } as unknown as ActivatedRouteSnapshot;
}
const state = { url: '/admin/ogm' } as RouterStateSnapshot;

function sessionWith(perfis: string[]): void {
  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ token: 'jwt', nome: 'N', email: 'n@n.com', perfis }),
  );
}

function runGuard(guard: typeof roleGuard, r: ActivatedRouteSnapshot) {
  return TestBed.runInInjectionContext(() => guard(r, state));
}

describe('guards', () => {
  beforeEach(() => {
    installMemoryStorage();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('roleGuard redireciona para /login quando não autenticado', () => {
    const result = runGuard(roleGuard, route(['ADMINISTRADOR'])) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toContain('/login');
  });

  it('roleGuard libera quando o usuário tem ao menos um dos perfis exigidos (multi-perfil)', () => {
    sessionWith(['COLABORADOR', 'USUARIO']);
    expect(runGuard(roleGuard, route(['ADMINISTRADOR', 'USUARIO']))).toBe(true);
  });

  it('roleGuard envia para /acesso-negado quando falta perfil', () => {
    sessionWith(['USUARIO']);
    const result = runGuard(roleGuard, route(['ADMINISTRADOR'])) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/acesso-negado');
  });

  it('roleGuard exige apenas autenticação quando a rota não declara perfis', () => {
    sessionWith(['USUARIO']);
    expect(runGuard(roleGuard, route())).toBe(true);
  });

  it('guestGuard bloqueia /login para usuário já autenticado', () => {
    sessionWith(['USUARIO']);
    const result = runGuard(guestGuard, route()) as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/');
  });

  it('hasRole/hasAnyRole refletem os perfis acumulados', () => {
    sessionWith(['ADMINISTRADOR', 'COLABORADOR']);
    const auth = TestBed.inject(AuthService);
    expect(auth.hasRole('ADMINISTRADOR')).toBe(true);
    expect(auth.hasRole('USUARIO')).toBe(false);
    expect(auth.hasAnyRole(['USUARIO', 'COLABORADOR'])).toBe(true);
    expect(auth.hasAnyRole(['USUARIO'])).toBe(false);
  });

  it('descarta sessão com JWT expirado ao restaurar', () => {
    const expired = `x.${btoa(JSON.stringify({ exp: 1 }))}.y`;
    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ token: expired, nome: 'N', email: 'n@n.com', perfis: ['USUARIO'] }),
    );
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(false);
  });
});
