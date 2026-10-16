import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { apiErrorMessage } from '../../../core/http/api-error';
import {
  SolicitacaoUsoResponse,
  StatusSolicitacaoUso,
  formatHoraCurta,
} from '../../../core/models/operacional.models';
import { SolicitacaoUsoService } from '../../../core/services/solicitacao-uso.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { normalize } from '../../admin/admin-list-page';

@Component({
  selector: 'app-deliberacao-uso-page',
  imports: [ReactiveFormsModule, ModalComponent, StatusBadgeComponent, DataBrPipe],
  templateUrl: './deliberacao-uso-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeliberacaoUsoPageComponent {
  private readonly solicitacaoUsoService = inject(SolicitacaoUsoService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly formatHoraCurta = formatHoraCurta;

  readonly items = signal<SolicitacaoUsoResponse[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  /** Alerta de conflito ou indisponibilidade retornado pelo Back-End na aprovação. */
  readonly actionError = signal<string | null>(null);

  readonly busca = signal('');
  readonly statusFiltro = signal<'TODOS' | StatusSolicitacaoUso>('TODOS');

  readonly approvingId = signal<number | null>(null);

  readonly reprovarModalOpen = signal(false);
  readonly targetReprovar = signal<SolicitacaoUsoResponse | null>(null);
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

    const order: Record<StatusSolicitacaoUso, number> = {
      PENDENTE: 0,
      APROVADA: 1,
      FINALIZADA: 2,
      REPROVADA: 3,
      INATIVO: 4,
    };

    return this.items()
      .filter((s) => status === 'TODOS' || s.status === status)
      .filter((s) => {
        if (!termo) return true;
        const hay = [
          s.estacaoSigla,
          s.estacaoNome,
          s.nomeUsuario,
          s.dmcNome,
          s.dataUso,
          s.status,
          s.justificativaReprovacao,
        ].join(' ');
        return normalize(hay).includes(termo);
      })
      .sort((a, b) =>
        order[a.status] !== order[b.status]
          ? order[a.status] - order[b.status]
          : b.dataUso.localeCompare(a.dataUso),
      );
  });

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.solicitacaoUsoService.listar(false).subscribe({
      next: (data) => {
        this.items.set(data ?? []);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.loadError.set(
          apiErrorMessage(error, 'Não foi possível carregar as solicitações de uso.'),
        );
      },
    });
  }

  aprovar(sol: SolicitacaoUsoResponse): void {
    this.approvingId.set(sol.id);
    this.actionError.set(null);

    this.solicitacaoUsoService.aprovar(sol.id).subscribe({
      next: () => {
        this.approvingId.set(null);
        this.toast.success(
          `Solicitação #${sol.id} (${sol.estacaoSigla}) aprovada! Estação reservada para uso.`,
        );
        this.reload();
      },
      error: (error: unknown) => {
        this.approvingId.set(null);
        const msg = apiErrorMessage(
          error,
          'Não foi possível aprovar a solicitação (verifique conflito de horário ou disponibilidade da estação).',
        );
        this.actionError.set(
          `Falha ao aprovar solicitação #${sol.id} (${sol.estacaoSigla ?? 'Estação'}): ${msg}`,
        );
        this.toast.error(msg);
      },
    });
  }

  abrirReprovacao(sol: SolicitacaoUsoResponse): void {
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
      this.reprovarError.set('Informe a justificativa obrigatória para reprovar a solicitação.');
      return;
    }

    const sol = this.targetReprovar();
    if (!sol) return;

    const justificativa = this.reprovarForm.controls.justificativa.value.trim();
    this.reprovando.set(true);
    this.reprovarError.set(null);

    this.solicitacaoUsoService.reprovar(sol.id, { justificativa }).subscribe({
      next: () => {
        this.reprovando.set(false);
        this.reprovarModalOpen.set(false);
        this.targetReprovar.set(null);
        this.toast.success(`Solicitação #${sol.id} reprovada com justificativa registrada.`);
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
