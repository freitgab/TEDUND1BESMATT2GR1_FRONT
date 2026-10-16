import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { API_BASE, SESSION_STORAGE_KEY } from '../api.config';
import { LoginRequest, LoginResponse, Session } from '../models/auth.models';

/**
 * Autenticação e sessão. A sessão (token, nome, email, perfis) fica em um signal
 * espelhado no localStorage, então `hasRole`/`hasAnyRole` são reativos em templates.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly _session = signal<Session | null>(this.restoreSession());

  readonly session = this._session.asReadonly();
  readonly token = computed(() => this._session()?.token ?? null);
  readonly perfis = computed(() => this._session()?.perfis ?? []);
  readonly isAuthenticated = computed(() => this._session() !== null);

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_BASE}/auth/login`, credentials)
      .pipe(tap((response) => this.saveSession(response)));
  }

  /** Encerra a sessão local e volta para o login. */
  logout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  /** Remove a sessão sem navegar (usado pelo interceptor em 401/403). */
  clearSession(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    this._session.set(null);
  }

  hasRole(role: string): boolean {
    return this.perfis().includes(role);
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }

  private saveSession(response: LoginResponse): void {
    const session: Session = {
      token: response.token,
      id: null,
      nome: response.nome,
      email: response.email,
      perfis: response.perfis ?? [],
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    this._session.set(session);
  }

  private restoreSession(): Session | null {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw) as Session;
      if (!session?.token || !Array.isArray(session.perfis) || this.isTokenExpired(session.token)) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }
      return session;
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }

  /** Lê o claim `exp` do JWT (sem validar assinatura; o back-end é quem valida). */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = token.split('.')[1];
      const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { exp?: number };
      return typeof json.exp === 'number' && json.exp * 1000 <= Date.now();
    } catch {
      return false;
    }
  }
}
