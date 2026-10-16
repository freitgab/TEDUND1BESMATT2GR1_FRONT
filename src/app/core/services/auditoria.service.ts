import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE } from '../api.config';
import { LogAuditoria } from '../models/relatorio.models';

export interface AuditoriaFiltro {
  acao?: string | null;
  entidadeAfetada?: string | null;
  usuarioEmail?: string | null;
}

/**
 * /api/auditoria — Logs de auditoria do sistema (exclusivo para perfil ADMINISTRADOR).
 * Todas as requisições passam pelo authInterceptor enviando JWT e X-Requested-By.
 */
@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE}/auditoria`;

  listar(filtro?: AuditoriaFiltro): Observable<LogAuditoria[]> {
    let params = new HttpParams();
    if (filtro?.acao) {
      params = params.set('acao', filtro.acao);
    }
    if (filtro?.entidadeAfetada) {
      params = params.set('entidadeAfetada', filtro.entidadeAfetada);
    }
    if (filtro?.usuarioEmail) {
      params = params.set('usuarioEmail', filtro.usuarioEmail);
    }
    return this.http.get<LogAuditoria[]>(this.baseUrl, { params });
  }
}
