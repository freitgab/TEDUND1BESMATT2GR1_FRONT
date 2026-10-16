import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE } from '../api.config';
import {
  RelatorioColaboradorGeralDTO,
  RelatorioEstruturaOrganizacionalDTO,
  RelatorioTecnicosDTO,
  RelatorioUsuarioSolicitacoesDTO,
} from '../models/relatorio.models';

/**
 * /api/relatorios — Emissão de relatórios oficiais para Administrador, Colaborador e Usuário.
 * Todas as requisições passam pelo authInterceptor enviando JWT e X-Requested-By: Clima-Angular-SPA.
 */
@Injectable({ providedIn: 'root' })
export class RelatorioService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE}/relatorios`;

  /** Item 7.1: Estrutura Organizacional Completa (OGM, DMC e Redes). */
  getEstruturaOrganizacional(): Observable<RelatorioEstruturaOrganizacionalDTO> {
    return this.http.get<RelatorioEstruturaOrganizacionalDTO>(
      `${this.baseUrl}/admin/estrutura-organizacional`,
    );
  }

  /** Item 7.2: Quadro Geral de Técnicos Meteorologistas por DMC. */
  getQuadroTecnicos(): Observable<RelatorioTecnicosDTO> {
    return this.http.get<RelatorioTecnicosDTO>(`${this.baseUrl}/admin/tecnicos`);
  }

  /** Relatório consolidado do Colaborador: estações, sensores, softwares e deliberações. */
  getColaboradorGeral(): Observable<RelatorioColaboradorGeralDTO> {
    return this.http.get<RelatorioColaboradorGeralDTO>(`${this.baseUrl}/colaborador/geral`);
  }

  /** Relatório de solicitações de uso e instalação do Usuário autenticado. */
  getUsuarioMinhasSolicitacoes(): Observable<RelatorioUsuarioSolicitacoesDTO> {
    return this.http.get<RelatorioUsuarioSolicitacoesDTO>(
      `${this.baseUrl}/usuario/minhas-solicitacoes`,
    );
  }
}
