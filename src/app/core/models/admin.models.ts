/** Espelha os DTOs administrativos do Back-End (pacote br.edu.ucsal.clima.dto). */

export type StatusEntidade = 'ATIVO' | 'INATIVO';

export interface Setor {
  id?: number | null;
  nome: string;
  nomeacaoResponsavel: string;
}

// ---------- OGM ----------
export interface OgmResponse {
  id: number;
  sigla: string;
  nome: string;
  emailCentral: string | null;
  telefoneCentral: string | null;
  diretorGeralId: number | null;
  diretorGeralNome: string | null;
  setores: Setor[];
  dataCadastro: string | null;
  status: StatusEntidade;
}

export interface OgmRequest {
  sigla: string;
  nome: string;
  emailCentral: string | null;
  telefoneCentral: string | null;
  /** ID de um Usuario ativo (regra: 1 diretor-geral por OGM). */
  diretorGeralId: number;
  setores: Setor[];
}

// ---------- DMC ----------
export interface DmcResponse {
  id: number;
  nome: string;
  emailCentral: string | null;
  telefoneCentral: string | null;
  orgaoGestorId: number | null;
  orgaoGestorNome: string | null;
  meteorologistaChefeId: number | null;
  meteorologistaChefeNome: string | null;
  dataCadastro: string | null;
  status: StatusEntidade;
}

export interface DmcRequest {
  nome: string;
  emailCentral: string | null;
  telefoneCentral: string | null;
  orgaoGestorId: number;
  /** ID de um Técnico ativo (regra: 1 meteorologista-chefe por DMC). */
  meteorologistaChefeId: number | null;
}

// ---------- Rede ----------
export interface RedeResponse {
  id: number;
  sigla: string;
  descricao: string;
  distritoId: number | null;
  distritoNome: string | null;
  tiposMonitoramento: string[];
  meteorologistaResponsavelId: number | null;
  meteorologistaResponsavelNome: string | null;
  dataCadastro: string | null;
  status: StatusEntidade;
}

export interface RedeRequest {
  sigla: string;
  descricao: string;
  distritoId: number;
  tiposMonitoramento: string[];
  /** ID de um Técnico ativo. */
  meteorologistaResponsavelId: number | null;
}

// ---------- Técnico ----------
export interface TecnicoResponse {
  id: number;
  matricula: string;
  nomeCompleto: string;
  email: string;
  telefone: string | null;
  usuarioId: number | null;
  distritoId: number | null;
  distritoNome: string | null;
  dataCadastro: string | null;
  status: StatusEntidade;
  motivoInativacao: string | null;
}

export interface TecnicoCadastroRequest {
  matricula: string;
  nomeCompleto: string;
  email: string;
  telefone: string | null;
  distritoId: number;
  usuarioId?: number | null;
  /** Opcional: se ausente, o Back-End define a senha padrão do novo usuário. */
  senhaInicial?: string | null;
}

export interface TecnicoEdicaoRequest {
  matricula: string;
  nomeCompleto: string;
  email: string;
  telefone: string | null;
  distritoId: number;
}

export interface JustificativaInativacao {
  justificativa: string;
}

/** Tipos de monitoramento usados pelo seeder do Back-End (valores livres no contrato). */
export const TIPOS_MONITORAMENTO: { value: string; label: string }[] = [
  { value: 'TEMPERATURA', label: 'Temperatura' },
  { value: 'UMIDADE', label: 'Umidade' },
  { value: 'PRECIPITACAO', label: 'Precipitação (chuva)' },
  { value: 'VENTO', label: 'Vento' },
  { value: 'PRESSAO', label: 'Pressão atmosférica' },
  { value: 'RADAR', label: 'Radar meteorológico' },
];

export function tipoMonitoramentoLabel(value: string): string {
  return TIPOS_MONITORAMENTO.find((t) => t.value === value)?.label ?? value;
}
