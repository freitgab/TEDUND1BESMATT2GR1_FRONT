import { DmcResponse, OgmResponse, RedeResponse, TecnicoResponse } from './admin.models';
import {
  EstacaoResponse,
  SolicitacaoInstalacaoResponse,
  SolicitacaoUsoResponse,
} from './operacional.models';

/**
 * Modelos para Logs de Auditoria e Emissão de Relatórios (Commit 4).
 */

// ---------- Logs de Auditoria ----------
export type TipoAcaoAuditoria =
  | 'CADASTRO'
  | 'EDICAO'
  | 'INATIVACAO'
  | 'APROVACAO'
  | 'REPROVACAO'
  | 'LIBERACAO';

export interface LogAuditoria {
  id: number;
  dataHora: string;
  usuarioEmail: string;
  acao: string;
  entidadeAfetada: string;
  detalhes: string | null;
}

// ---------- Relatórios do Sistema ----------
export interface RelatorioEmissorDTO {
  id: number;
  nomeCompleto: string;
  email: string;
  dataHoraEmissao: string;
}

export interface RelatorioOgmItemDTO {
  ogm: OgmResponse;
  distritos: DmcResponse[];
  redes: RedeResponse[];
}

export interface RelatorioEstruturaOrganizacionalDTO {
  administradorResponsavel: RelatorioEmissorDTO;
  nomeEmissor: string;
  emailEmissor: string;
  dataHoraEmissao: string;
  ogms: OgmResponse[];
  dmcs: DmcResponse[];
  redes: RedeResponse[];
  estruturaConsolidada: RelatorioOgmItemDTO[];
}

export interface RelatorioTecnicosDTO {
  administradorResponsavel: RelatorioEmissorDTO;
  nomeEmissor: string;
  emailEmissor: string;
  dataHoraEmissao: string;
  tecnicos: TecnicoResponse[];
}

export interface RelatorioColaboradorGeralDTO {
  colaboradorEmissor: RelatorioEmissorDTO;
  nomeEmissor: string;
  emailEmissor: string;
  dataHoraEmissao: string;
  estacoes: EstacaoResponse[];
  solicitacoesUso: SolicitacaoUsoResponse[];
  solicitacoesInstalacao: SolicitacaoInstalacaoResponse[];
}

export interface RelatorioUsuarioSolicitacoesDTO {
  usuario: RelatorioEmissorDTO;
  nomeEmissor: string;
  emailEmissor: string;
  dataHoraEmissao: string;
  solicitacoesUso: SolicitacaoUsoResponse[];
  solicitacoesInstalacao: SolicitacaoInstalacaoResponse[];
}
