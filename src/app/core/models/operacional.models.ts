/**
 * Espelha os DTOs e Enums operacionais do Back-End (Commit 3):
 * Estações Meteorológicas, Sensores, Softwares, Solicitações de Uso e Solicitações de Instalação.
 */

export type StatusEstacao = 'DISPONIVEL' | 'INDISPONIVEL' | 'INATIVO';

export type TipoEstacao =
  | 'AUTOMATICA'
  | 'CONVENCIONAL'
  | 'RADAR_METEOROLOGICO'
  | 'BOIA_OCEANOGRAFICA';

export type TipoSensor =
  | 'TEMPERATURA'
  | 'UMIDADE'
  | 'PRESSAO'
  | 'VENTO'
  | 'PLUVIOMETRO';

export type TipoLicencaSoftware = 'PROPRIETARIO' | 'SOFTWARE_LIVRE';

export type StatusSolicitacaoUso =
  | 'PENDENTE'
  | 'APROVADA'
  | 'REPROVADA'
  | 'FINALIZADA'
  | 'INATIVO';

export type StatusSolicitacaoInstalacao =
  | 'PENDENTE'
  | 'APROVADA'
  | 'REPROVADA'
  | 'INATIVO';

// ---------- Estações Meteorológicas ----------
export interface SoftwareDTO {
  id?: number | null;
  nome: string;
  urlDownload: string;
  tipoSoftware: TipoLicencaSoftware;
  objetivoUso: string;
  variaveisMonitoradas: string[];
}

export interface EstacaoRequest {
  sigla: string;
  nome: string;
  tipoEstacao: TipoEstacao;
  descricaoComplementar: string | null;
  capacidadeMaximaSuportada: number;
  latitude: number;
  longitude: number;
  redeMonitoramentoId: number;
  sensores: TipoSensor[];
  softwares: SoftwareDTO[];
}

export interface EstacaoResponse {
  id: number;
  sigla: string;
  nome: string;
  tipoEstacao: TipoEstacao;
  descricaoComplementar: string | null;
  capacidadeMaximaSuportada: number;
  latitude: number;
  longitude: number;
  redeMonitoramentoId: number | null;
  redeMonitoramentoSigla: string | null;
  sensores: TipoSensor[];
  softwares: SoftwareDTO[];
  dataCadastro: string | null;
  status: StatusEstacao;
}

// ---------- Solicitações de Uso ----------
export interface SolicitacaoUsoRequest {
  estacaoId: number;
  dmcId: number;
  /** Formato ISO LocalDate: yyyy-MM-dd */
  dataUso: string;
  /** Formato ISO LocalTime: HH:mm */
  horaInicio: string;
  /** Formato ISO LocalTime: HH:mm */
  horaFim: string;
}

export interface SolicitacaoUsoResponse {
  id: number;
  estacaoId: number | null;
  estacaoSigla: string | null;
  estacaoNome: string | null;
  usuarioId: number | null;
  nomeUsuario: string | null;
  dmcId: number | null;
  dmcNome: string | null;
  dataUso: string;
  horaInicio: string;
  horaFim: string;
  dataSolicitacao: string | null;
  status: StatusSolicitacaoUso;
  justificativaReprovacao: string | null;
  dataLiberacao: string | null;
}

// ---------- Solicitações de Instalação ----------
export interface SolicitacaoInstalacaoRequest {
  estacaoId: number;
  sensoresSoftwares: string;
  urlDownload: string | null;
  tipoSoftware: TipoLicencaSoftware | null;
  objetivoUso: string;
}

export interface SolicitacaoInstalacaoResponse {
  id: number;
  estacaoId: number | null;
  estacaoSigla: string | null;
  estacaoNome: string | null;
  usuarioId: number | null;
  nomeUsuario: string | null;
  sensoresSoftwares: string;
  urlDownload: string | null;
  tipoSoftware: TipoLicencaSoftware | null;
  objetivoUso: string;
  dataSolicitacao: string | null;
  status: StatusSolicitacaoInstalacao;
  justificativaReprovacao: string | null;
}

export interface ReprovacaoRequest {
  justificativa: string;
}

// ---------- Constantes e Rótulos ----------
export const TIPOS_ESTACAO: { value: TipoEstacao; label: string; exigeSensoresSoftwares: boolean }[] = [
  { value: 'AUTOMATICA', label: 'Automática (EMA)', exigeSensoresSoftwares: true },
  { value: 'CONVENCIONAL', label: 'Convencional (EMC)', exigeSensoresSoftwares: false },
  { value: 'RADAR_METEOROLOGICO', label: 'Radar Meteorológico', exigeSensoresSoftwares: true },
  { value: 'BOIA_OCEANOGRAFICA', label: 'Boia Oceanográfica', exigeSensoresSoftwares: false },
];

export const TIPOS_SENSOR: { value: TipoSensor; label: string }[] = [
  { value: 'TEMPERATURA', label: 'Temperatura (Termômetro)' },
  { value: 'UMIDADE', label: 'Umidade Relativa (Higrômetro)' },
  { value: 'PRESSAO', label: 'Pressão Atmosférica (Barômetro)' },
  { value: 'VENTO', label: 'Velocidade/Direção do Vento (Anemômetro)' },
  { value: 'PLUVIOMETRO', label: 'Precipitação (Pluviômetro)' },
];

export const TIPOS_LICENCA_SOFTWARE: { value: TipoLicencaSoftware; label: string }[] = [
  { value: 'SOFTWARE_LIVRE', label: 'Software Livre / Código Aberto' },
  { value: 'PROPRIETARIO', label: 'Proprietário / Comercial' },
];

export function exigeSensoresESoftwares(tipo: TipoEstacao | string | null | undefined): boolean {
  return tipo === 'AUTOMATICA' || tipo === 'RADAR_METEOROLOGICO';
}

export function tipoEstacaoLabel(tipo: TipoEstacao | string | null | undefined): string {
  return TIPOS_ESTACAO.find((t) => t.value === tipo)?.label ?? (tipo ?? '—');
}

export function tipoSensorLabel(sensor: TipoSensor | string | null | undefined): string {
  return TIPOS_SENSOR.find((s) => s.value === sensor)?.label ?? (sensor ?? '—');
}

export function tipoLicencaLabel(tipo: TipoLicencaSoftware | string | null | undefined): string {
  return TIPOS_LICENCA_SOFTWARE.find((t) => t.value === tipo)?.label ?? (tipo ?? '—');
}

/** Formata `HH:mm:ss` para `HH:mm` para apresentação e inputs time. */
export function formatHoraCurta(hora: string | null | undefined): string {
  if (!hora) return '—';
  return hora.length >= 5 ? hora.slice(0, 5) : hora;
}
