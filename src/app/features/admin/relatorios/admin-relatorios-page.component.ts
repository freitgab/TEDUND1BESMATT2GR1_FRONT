import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { apiErrorMessage } from '../../../core/http/api-error';
import {
  RelatorioEstruturaOrganizacionalDTO,
  RelatorioTecnicosDTO,
} from '../../../core/models/relatorio.models';
import { RelatorioService } from '../../../core/services/relatorio.service';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';

type AbaRelatorio = 'ESTRUTURA' | 'TECNICOS';

@Component({
  selector: 'app-admin-relatorios-page',
  imports: [StatusBadgeComponent, DataBrPipe],
  templateUrl: './admin-relatorios-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminRelatoriosPageComponent {
  private readonly relatorioService = inject(RelatorioService);

  readonly abaAtiva = signal<AbaRelatorio>('ESTRUTURA');
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly relatorioEstrutura = signal<RelatorioEstruturaOrganizacionalDTO | null>(null);
  readonly relatorioTecnicos = signal<RelatorioTecnicosDTO | null>(null);

  constructor() {
    this.carregarEstrutura();
  }

  setAba(aba: AbaRelatorio): void {
    this.abaAtiva.set(aba);
    this.loadError.set(null);
    if (aba === 'ESTRUTURA' && !this.relatorioEstrutura()) {
      this.carregarEstrutura();
    } else if (aba === 'TECNICOS' && !this.relatorioTecnicos()) {
      this.carregarTecnicos();
    }
  }

  carregarEstrutura(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.relatorioService.getEstruturaOrganizacional().subscribe({
      next: (dto) => {
        this.relatorioEstrutura.set(dto);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.loadError.set(
          apiErrorMessage(error, 'Não foi possível carregar o relatório de estrutura organizacional.'),
        );
      },
    });
  }

  carregarTecnicos(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.relatorioService.getQuadroTecnicos().subscribe({
      next: (dto) => {
        this.relatorioTecnicos.set(dto);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.loadError.set(
          apiErrorMessage(error, 'Não foi possível carregar o relatório de técnicos meteorologistas.'),
        );
      },
    });
  }

  imprimir(): void {
    window.print();
  }

  redesDoDistrito(itemRedes: any[], distritoId: number): any[] {
    return itemRedes.filter((r) => r.distritoId === distritoId);
  }
}
