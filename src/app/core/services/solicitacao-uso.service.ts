import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE } from '../api.config';
import {
  ReprovacaoRequest,
  SolicitacaoUsoRequest,
  SolicitacaoUsoResponse,
} from '../models/operacional.models';

/**
 * /api/solicitacoes-uso — Solicitações de uso de estação meteorológica,
 * deliberação pelo Colaborador (aprovar/reprovar) e confirmação de liberação pelo Usuário.
 */
@Injectable({ providedIn: 'root' })
export class SolicitacaoUsoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE}/solicitacoes-uso`;

  listar(me = false): Observable<SolicitacaoUsoResponse[]> {
    const params = new HttpParams().set('me', String(me));
    return this.http.get<SolicitacaoUsoResponse[]>(this.baseUrl, { params });
  }

  buscarPorId(id: number): Observable<SolicitacaoUsoResponse> {
    return this.http.get<SolicitacaoUsoResponse>(`${this.baseUrl}/${id}`);
  }

  criar(body: SolicitacaoUsoRequest): Observable<SolicitacaoUsoResponse> {
    return this.http.post<SolicitacaoUsoResponse>(this.baseUrl, body);
  }

  atualizar(id: number, body: SolicitacaoUsoRequest): Observable<SolicitacaoUsoResponse> {
    return this.http.put<SolicitacaoUsoResponse>(`${this.baseUrl}/${id}`, body);
  }

  inativar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/inativar`, {});
  }

  /** Confirmação da liberação de uso pelo Usuário (retorna estação para DISPONIVEL). */
  liberar(id: number): Observable<SolicitacaoUsoResponse> {
    return this.http.patch<SolicitacaoUsoResponse>(`${this.baseUrl}/${id}/liberar`, {});
  }

  /** Aprovação pelo Colaborador/Administrador (valida conflito de horário e disponibilidade). */
  aprovar(id: number): Observable<SolicitacaoUsoResponse> {
    return this.http.patch<SolicitacaoUsoResponse>(`${this.baseUrl}/${id}/aprovar`, {});
  }

  /** Reprovação pelo Colaborador/Administrador (exige justificativa obrigatória). */
  reprovar(id: number, body: ReprovacaoRequest): Observable<SolicitacaoUsoResponse> {
    return this.http.patch<SolicitacaoUsoResponse>(`${this.baseUrl}/${id}/reprovar`, body);
  }
}
