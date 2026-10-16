import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { apiErrorMessage } from '../../../core/http/api-error';
import {
  formatHoraCurta,
  tipoLicencaLabel,
} from '../../../core/models/operacional.models';
import { RelatorioUsuarioSolicitacoesDTO } from '../../../core/models/relatorio.models';
import { RelatorioService } from '../../../core/services/relatorio.service';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-usuario-relatorios-page',
  imports: [StatusBadgeComponent, DataBrPipe],
  templateUrl: './usuario-relatorios-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuarioRelatoriosPageComponent {
  private readonly relatorioService = inject(RelatorioService);

  readonly formatHoraCurta = formatHoraCurta;
  readonly tipoLicencaLabel = tipoLicencaLabel;

  readonly relatorio = signal<RelatorioUsuarioSolicitacoesDTO | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  constructor() {
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.relatorioService.getUsuarioMinhasSolicitacoes().subscribe({
      next: (dto) => {
        this.relatorio.set(dto);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.loadError.set(
          apiErrorMessage(error, 'Não foi possível carregar seu relatório de solicitações.'),
        );
      },
    });
  }

  imprimir(): void {
    window.print();
  }
}
