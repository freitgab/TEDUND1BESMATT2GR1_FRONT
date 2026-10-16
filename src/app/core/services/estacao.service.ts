import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { EstacaoRequest, EstacaoResponse } from '../models/operacional.models';
import { CrudApiService } from './crud-api.service';

/**
 * /api/estacoes — Gestão de Estações Meteorológicas, Sensores e Softwares.
 * Todas as requisições passam pelo authInterceptor (JWT + X-Requested-By: Clima-Angular-SPA).
 */
@Injectable({ providedIn: 'root' })
export class EstacaoService extends CrudApiService<EstacaoResponse, EstacaoRequest> {
  protected readonly resource = 'estacoes';

  inativar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/inativar`, {});
  }
}
