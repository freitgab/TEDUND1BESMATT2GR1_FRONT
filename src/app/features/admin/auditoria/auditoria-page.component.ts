import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { apiErrorMessage } from '../../../core/http/api-error';
import { LogAuditoria } from '../../../core/models/relatorio.models';
import { AuditoriaService } from '../../../core/services/auditoria.service';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { normalize } from '../admin-list-page';

@Component({
  selector: 'app-auditoria-page',
  imports: [StatusBadgeComponent, DataBrPipe],
  templateUrl: './auditoria-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditoriaPageComponent {
  private readonly auditoriaService = inject(AuditoriaService);

  readonly items = signal<LogAuditoria[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly busca = signal('');
  readonly acaoFiltro = signal<string>('TODAS');
  readonly entidadeFiltro = signal<string>('TODAS');

  readonly acoesDisponiveis = [
    'CADASTRO',
    'EDICAO',
    'INATIVACAO',
    'APROVACAO',
    'REPROVACAO',
    'LIBERACAO',
  ];

  readonly entidadesDisponiveis = [
    'OGM',
    'DMC',
    'REDE',
    'TECNICO',
    'ESTACAO',
    'SOLICITACAO_USO',
    'SOLICITACAO_INSTALACAO',
  ];

  readonly filtrados = computed(() => {
    const termo = normalize(this.busca());
    const acao = this.acaoFiltro();
    const entidade = this.entidadeFiltro();

    return this.items()
      .filter((log) => acao === 'TODAS' || log.acao === acao)
      .filter((log) => entidade === 'TODAS' || log.entidadeAfetada === entidade)
      .filter((log) => {
        if (!termo) return true;
        const hay = [
          log.usuarioEmail,
          log.acao,
          log.entidadeAfetada,
          log.detalhes,
          log.dataHora,
        ].join(' ');
        return normalize(hay).includes(termo);
      })
      .sort((a, b) => b.dataHora.localeCompare(a.dataHora));
  });

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.auditoriaService.listar().subscribe({
      next: (logs) => {
        this.items.set(logs ?? []);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.loadError.set(apiErrorMessage(error, 'Não foi possível carregar os logs de auditoria.'));
      },
    });
  }

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }
}
