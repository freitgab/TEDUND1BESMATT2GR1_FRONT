import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { SESSION_STORAGE_KEY } from '../api.config';
import { installMemoryStorage } from '../testing/memory-storage';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: AuthService;
  let router: Router;

  beforeEach(() => {
    installMemoryStorage();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => backend.verify());

  function login(): void {
    auth.login({ email: 'a@a.com', senha: '1' }).subscribe();
    const req = backend.expectOne('/api/auth/login');
    req.flush({ token: 'jwt-token', nome: 'Teste', email: 'a@a.com', perfis: ['ADMINISTRADOR'] });
  }

  it('adiciona X-Requested-By e não envia Authorization sem sessão', () => {
    http.get('/api/ogm').subscribe();
    const req = backend.expectOne('/api/ogm');
    expect(req.request.headers.get('X-Requested-By')).toBe('Clima-Angular-SPA');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush([]);
  });

  it('adiciona Authorization Bearer quando autenticado', () => {
    login();
    http.get('/api/ogm').subscribe();
    const req = backend.expectOne('/api/ogm');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    req.flush([]);
  });

  it('não envia Authorization na chamada de login', () => {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'x', nome: 'n', email: 'e', perfis: [] }));
    http.post('/api/auth/login', {}).subscribe();
    const req = backend.expectOne('/api/auth/login');
    expect(req.request.headers.get('X-Requested-By')).toBe('Clima-Angular-SPA');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('em 401 limpa a sessão e redireciona para /login', () => {
    login();
    http.get('/api/ogm').subscribe({ error: () => undefined });
    backend.expectOne('/api/ogm').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.isAuthenticated()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { motivo: 'sessao-expirada' } });
  });

  it('em 403 limpa a sessão e redireciona para /login', () => {
    login();
    http.get('/api/ogm').subscribe({ error: () => undefined });
    backend.expectOne('/api/ogm').flush({}, { status: 403, statusText: 'Forbidden' });
    expect(auth.isAuthenticated()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { motivo: 'acesso-negado' } });
  });

  it('401 no login não redireciona (a tela exibe credenciais inválidas)', () => {
    http.post('/api/auth/login', {}).subscribe({ error: () => undefined });
    backend.expectOne('/api/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('ignora requisições fora de /api', () => {
    http.get('/assets/x.json').subscribe();
    const req = backend.expectOne('/assets/x.json');
    expect(req.request.headers.has('X-Requested-By')).toBe(false);
    req.flush({});
  });
});
