import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE } from '../api.config';

/**
 * Base dos serviços CRUD administrativos. As chamadas usam caminhos `/api/...`,
 * portanto passam pelo authInterceptor (JWT + X-Requested-By) automaticamente.
 */
export abstract class CrudApiService<TResponse, TCreate, TUpdate = TCreate> {
  protected readonly http = inject(HttpClient);

  /** Segmento do recurso no Back-End, ex.: `ogm` → `/api/ogm`. */
  protected abstract readonly resource: string;

  protected get baseUrl(): string {
    return `${API_BASE}/${this.resource}`;
  }

  listar(): Observable<TResponse[]> {
    return this.http.get<TResponse[]>(this.baseUrl);
  }

  buscarPorId(id: number): Observable<TResponse> {
    return this.http.get<TResponse>(`${this.baseUrl}/${id}`);
  }

  cadastrar(body: TCreate): Observable<TResponse> {
    return this.http.post<TResponse>(this.baseUrl, body);
  }

  atualizar(id: number, body: TUpdate): Observable<TResponse> {
    return this.http.put<TResponse>(`${this.baseUrl}/${id}`, body);
  }
}
