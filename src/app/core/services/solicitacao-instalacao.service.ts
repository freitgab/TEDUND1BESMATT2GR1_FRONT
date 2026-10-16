import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE } from '../api.config';
import {
  ReprovacaoRequest,
  SolicitacaoInstalacaoRequest,
  SolicitacaoInstalacaoResponse,
} from '../models/operacional.models';

/**
 * /api/solicitacoes-instalacao — Solicitações de instalação de sensor/software
 * em estações meteorológicas e deliberação pelo Colaborador (aprovar/reprovar).
 */
@Injectable({ providedIn: 'root' })
export class SolicitacaoInstalacaoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE}/solicitacoes-instalacao`;

  listar(me = false): Observable<SolicitacaoInstalacaoResponse[]> {
    const params = new HttpParams().set('me', String(me));
    return this.http.get<SolicitacaoInstalacaoResponse[]>(this.baseUrl, { params });
  }

  buscarPorId(id: number): Observable<SolicitacaoInstalacaoResponse> {
    return this.http.get<SolicitacaoInstalacaoResponse>(`${this.baseUrl}/${id}`);
  }

  criar(body: SolicitacaoInstalacaoRequest): Observable<SolicitacaoInstalacaoResponse> {
    return this.http.post<SolicitacaoInstalacaoResponse>(this.baseUrl, body);
  }

  atualizar(id: number, body: SolicitacaoInstalacaoRequest): Observable<SolicitacaoInstalacaoResponse> {
    return this.http.put<SolicitacaoInstalacaoResponse>(`${this.baseUrl}/${id}`, body);
  }

  inativar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/inativar`, {});
  }

  aprovar(id: number): Observable<SolicitacaoInstalacaoResponse> {
    return this.http.patch<SolicitacaoInstalacaoResponse>(`${this.baseUrl}/${id}/aprovar`, {});
  }

  reprovar(id: number, body: ReprovacaoRequest): Observable<SolicitacaoInstalacaoResponse> {
    return this.http.patch<SolicitacaoInstalacaoResponse>(`${this.baseUrl}/${id}/reprovar`, body);
  }
}
