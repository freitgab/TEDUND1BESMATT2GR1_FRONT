import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { apiErrorMessage } from '../../../core/http/api-error';
import {
  SolicitacaoInstalacaoResponse,
  StatusSolicitacaoInstalacao,
  tipoLicencaLabel,
} from '../../../core/models/operacional.models';
import { SolicitacaoInstalacaoService } from '../../../core/services/solicitacao-instalacao.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { normalize } from '../../admin/admin-list-page';

@Component({
  selector: 'app-deliberacao-instalacao-page',
  imports: [ReactiveFormsModule, ModalComponent, StatusBadgeComponent, DataBrPipe],
  templateUrl: './deliberacao-instalacao-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliberacaoInstalacaoPageComponent {
  private readonly solicitacaoInstalacaoService = inject(SolicitacaoInstalacaoService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly tipoLicencaLabel = tipoLicencaLabel;

  readonly items = signal<SolicitacaoInstalacaoResponse[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  readonly busca = signal('');
  readonly statusFiltro = signal<'TODOS' | StatusSolicitacaoInstalacao>('TODOS');

  readonly approvingId = signal<number | null>(null);

  readonly reprovarModalOpen = signal(false);
  readonly targetReprovar = signal<SolicitacaoInstalacaoResponse | null>(null);
  readonly reprovando = signal(false);
  readonly reprovarError = signal<string | null>(null);

  readonly reprovarForm = this.fb.group({
    justificativa: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
  });

  readonly totalPendentes = computed(
    () => this.items().filter((s) => s.status === 'PENDENTE').length,
  );
  readonly totalAprovadas = computed(
    () => this.items().filter((s) => s.status === 'APROVADA').length,
  );

  readonly filtrados = computed(() => {
    const termo = normalize(this.busca());
    const status = this.statusFiltro();

    const order: Record<StatusSolicitacaoInstalacao, number> = {
      PENDENTE: 0,
      APROVADA: 1,
      REPROVADA: 2,
      INATIVO: 3,
    };

    return this.items()
      .filter((s) => status === 'TODOS' || s.status === status)
      .filter((s) => {
        if (!termo) return true;
        const hay = [
          s.estacaoSigla,
          s.estacaoNome,
          s.nomeUsuario,
          s.sensoresSoftwares,
          s.urlDownload,
          s.tipoSoftware,
          s.objetivoUso,
          s.justificativaReprovacao,
        ].join(' ');
        return normalize(hay).includes(termo);
      })
      .sort((a, b) =>
        order[a.status] !== order[b.status]
          ? order[a.status] - order[b.status]
          : b.id - a.id,
      );
  });

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.solicitacaoInstalacaoService.listar(false).subscribe({
      next: (data) => {
        this.items.set(data ?? []);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.loadError.set(
          apiErrorMessage(error, 'Não foi possível carregar as solicitações de instalação.'),
        );
      },
    });
  }

  aprovar(sol: SolicitacaoInstalacaoResponse): void {
    this.approvingId.set(sol.id);
    this.actionError.set(null);

    this.solicitacaoInstalacaoService.aprovar(sol.id).subscribe({
      next: () => {
        this.approvingId.set(null);
        this.toast.success(
          `Solicitação de instalação #${sol.id} (${sol.sensoresSoftwares}) aprovada com sucesso.`,
        );
        this.reload();
      },
      error: (error: unknown) => {
        this.approvingId.set(null);
        const msg = apiErrorMessage(error, 'Não foi possível aprovar a solicitação de instalação.');
        this.actionError.set(`Falha ao aprovar pedido #${sol.id}: ${msg}`);
        this.toast.error(msg);
      },
    });
  }

  abrirReprovacao(sol: SolicitacaoInstalacaoResponse): void {
    this.targetReprovar.set(sol);
    this.reprovarForm.reset({ justificativa: '' });
    this.reprovarError.set(null);
    this.reprovarModalOpen.set(true);
  }

  fecharReprovacao(): void {
    if (!this.reprovando()) {
      this.reprovarModalOpen.set(false);
      this.targetReprovar.set(null);
    }
  }

  confirmarReprovacao(): void {
    if (this.reprovarForm.invalid) {
      this.reprovarForm.markAllAsTouched();
      this.reprovarError.set('Informe a justificativa obrigatória para reprovar o pedido.');
      return;
    }

    const sol = this.targetReprovar();
    if (!sol) return;

    const justificativa = this.reprovarForm.controls.justificativa.value.trim();
    this.reprovando.set(true);
    this.reprovarError.set(null);

    this.solicitacaoInstalacaoService.reprovar(sol.id, { justificativa }).subscribe({
      next: () => {
        this.reprovando.set(false);
        this.reprovarModalOpen.set(false);
        this.targetReprovar.set(null);
        this.toast.success(`Pedido de instalação #${sol.id} reprovado com justificativa registrada.`);
        this.reload();
      },
      error: (error: unknown) => {
        this.reprovando.set(false);
        this.reprovarError.set(apiErrorMessage(error));
      },
    });
  }

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }
}
