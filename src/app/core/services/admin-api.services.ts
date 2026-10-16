import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import {
  DmcRequest,
  DmcResponse,
  JustificativaInativacao,
  OgmRequest,
  OgmResponse,
  RedeRequest,
  RedeResponse,
  TecnicoCadastroRequest,
  TecnicoEdicaoRequest,
  TecnicoResponse,
} from '../models/admin.models';
import { CrudApiService } from './crud-api.service';

/** /api/ogm — Órgãos Gestores de Meteorologia. */
@Injectable({ providedIn: 'root' })
export class OgmService extends CrudApiService<OgmResponse, OgmRequest> {
  protected readonly resource = 'ogm';

  inativar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/inativar`, {});
  }
}

/** /api/dmc — Distritos de Monitoramento Climático. */
@Injectable({ providedIn: 'root' })
export class DmcService extends CrudApiService<DmcResponse, DmcRequest> {
  protected readonly resource = 'dmc';

  inativar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/inativar`, {});
  }
}

/** /api/rede — Redes de Monitoramento. */
@Injectable({ providedIn: 'root' })
export class RedeService extends CrudApiService<RedeResponse, RedeRequest> {
  protected readonly resource = 'rede';

  inativar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/inativar`, {});
  }
}

/** /api/tecnico — Técnicos Meteorologistas (inativação exige justificativa). */
@Injectable({ providedIn: 'root' })
export class TecnicoService extends CrudApiService<TecnicoResponse, TecnicoCadastroRequest, TecnicoEdicaoRequest> {
  protected readonly resource = 'tecnico';

  inativar(id: number, body: JustificativaInativacao): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/inativar`, body);
  }
}
