import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { apiErrorMessage } from '../../../core/http/api-error';
import {
  formatHoraCurta,
  tipoEstacaoLabel,
  tipoLicencaLabel,
} from '../../../core/models/operacional.models';
import { RelatorioColaboradorGeralDTO } from '../../../core/models/relatorio.models';
import { RelatorioService } from '../../../core/services/relatorio.service';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';

@Component({
  selector: 'app-colaborador-relatorios-page',
  imports: [StatusBadgeComponent, DataBrPipe],
  templateUrl: './colaborador-relatorios-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColaboradorRelatoriosPageComponent {
  private readonly relatorioService = inject(RelatorioService);

  readonly formatHoraCurta = formatHoraCurta;
  readonly tipoEstacaoLabel = tipoEstacaoLabel;
  readonly tipoLicencaLabel = tipoLicencaLabel;

  readonly relatorio = signal<RelatorioColaboradorGeralDTO | null>(null);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  constructor() {
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.relatorioService.getColaboradorGeral().subscribe({
      next: (dto) => {
        this.relatorio.set(dto);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.loadError.set(
          apiErrorMessage(error, 'Não foi possível gerar o relatório consolidado do colaborador.'),
        );
      },
    });
  }

  imprimir(): void {
    window.print();
  }
}
