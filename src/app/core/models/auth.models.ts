/** Perfis do sistema (enum NomePerfil do Back-End). Um usuário pode acumular mais de um. */
export type Perfil = 'ADMINISTRADOR' | 'COLABORADOR' | 'USUARIO';

export const PERFIL_LABELS: Record<Perfil, string> = {
  ADMINISTRADOR: 'Administrador',
  COLABORADOR: 'Colaborador',
  USUARIO: 'Usuário',
};

/** Corpo de POST /api/auth/login. */
export interface LoginRequest {
  email: string;
  senha: string;
}

/** Resposta de POST /api/auth/login (LoginResponse do Back-End). */
export interface LoginResponse {
  token: string;
  nome: string;
  email: string;
  perfis: string[];
}

/** Sessão persistida no localStorage. `id` é opcional: o back-end atual não o retorna no login. */
export interface Session {
  token: string;
  id?: number | null;
  nome: string;
  email: string;
  perfis: string[];
}
