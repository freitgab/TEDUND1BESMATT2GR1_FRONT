/** Prefixo de todas as rotas do Back-End (redirecionado para http://localhost:8080 via proxy.conf.json). */
export const API_BASE = '/api';

/** Header que comprova ao Back-End que a chamada partiu exclusivamente do Front-End Angular. */
export const FRONTEND_HEADER_NAME = 'X-Requested-By';
export const FRONTEND_HEADER_VALUE = 'Clima-Angular-SPA';

/** Chave usada para persistir a sessão no localStorage. */
export const SESSION_STORAGE_KEY = 'clima.session';
