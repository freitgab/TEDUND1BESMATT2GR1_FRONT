import { HttpErrorResponse } from '@angular/common/http';

/** Corpo de erro padronizado pelo GlobalExceptionHandler do Back-End. */
interface ApiErrorBody {
  status?: number;
  erro?: string;
  mensagem?: string;
  campos?: Record<string, string>;
}

/**
 * Converte qualquer falha HTTP em uma mensagem legível, priorizando a mensagem
 * de regra de negócio enviada pelo Back-End (ex.: "Nao e possivel inativar OGM
 * com Distritos de Monitoramento Climatico ativos vinculados").
 */
export function apiErrorMessage(error: unknown, fallback = 'Não foi possível concluir a operação.'): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }
  if (error.status === 0) {
    return 'Sem conexão com o back-end. Verifique se o Spring Boot está em execução na porta configurada em proxy.conf.json.';
  }

  const body = error.error as ApiErrorBody | string | null;
  if (body && typeof body === 'object') {
    const campos = body.campos && typeof body.campos === 'object' ? Object.entries(body.campos) : [];
    const detalhes = campos.map(([campo, msg]) => `${campo}: ${msg}`);
    const partes = [body.mensagem, ...detalhes].filter((p): p is string => !!p && p.trim().length > 0);
    if (partes.length > 0) {
      return partes.join(' • ');
    }
  }

  switch (error.status) {
    case 401:
      return 'Sessão expirada. Faça login novamente.';
    case 403:
      return 'Você não tem permissão para executar esta ação.';
    case 404:
      return 'Registro ou endpoint não encontrado no back-end.';
    case 409:
      return 'A operação viola uma regra de negócio ou de integridade.';
  }
  if (error.status >= 500) {
    return 'O back-end está indisponível ou retornou um erro interno.';
  }
  return fallback;
}
