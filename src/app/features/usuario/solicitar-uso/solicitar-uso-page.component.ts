import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';

import { apiErrorMessage } from '../../../core/http/api-error';
import { DmcResponse } from '../../../core/models/admin.models';
import {
  EstacaoResponse,
  SolicitacaoUsoRequest,
  SolicitacaoUsoResponse,
  StatusSolicitacaoUso,
  formatHoraCurta,
  tipoEstacaoLabel,
} from '../../../core/models/operacional.models';
import { DmcService } from '../../../core/services/admin-api.services';
import { EstacaoService } from '../../../core/services/estacao.service';
import { SolicitacaoUsoService } from '../../../core/services/solicitacao-uso.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { normalize } from '../../admin/admin-list-page';

@Component({
  selector: 'app-solicitar-uso-page',
  imports: [ReactiveFormsModule, ConfirmDialogComponent, StatusBadgeComponent, DataBrPipe],
  templateUrl: './solicitar-uso-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitarUsoPageComponent {
  private readonly solicitacaoUsoService = inject(SolicitacaoUsoService);
  private readonly estacaoService = inject(EstacaoService);
  private readonly dmcService = inject(DmcService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly formatHoraCurta = formatHoraCurta;
  readonly tipoEstacaoLabel = tipoEstacaoLabel;

  readonly items = signal<SolicitacaoUsoResponse[]>([]);
  readonly estacoes = signal<EstacaoResponse[]>([]);
  readonly dmcs = signal<DmcResponse[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly busca = signal('');
  readonly statusFiltro = signal<'TODOS' | StatusSolicitacaoUso>('TODOS');

  readonly editing = signal<SolicitacaoUsoResponse | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  readonly releasingId = signal<number | null>(null);
  readonly toInactivate = signal<SolicitacaoUsoResponse | null>(null);
  readonly inactivating = signal(false);

  /** Estações ativas ordenadas destacando as DISPONIVEL primeiro. */
  readonly estacoesSelecionaveis = computed(() =>
    this.estacoes()
      .filter((e) => e.status !== 'INATIVO')
      .sort((a, b) =>
        a.status === b.status
          ? a.sigla.localeCompare(b.sigla)
          : a.status === 'DISPONIVEL'
            ? -1
            : 1,
      ),
  );

  readonly dmcsAtivos = computed(() => this.dmcs().filter((d) => d.status === 'ATIVO'));

  readonly totalAprovadasEmUso = computed(
    () => this.items().filter((s) => s.status === 'APROVADA').length,
  );

  readonly filtrados = computed(() => {
    const termo = normalize(this.busca());
    const status = this.statusFiltro();

    const order: Record<StatusSolicitacaoUso, number> = {
      APROVADA: 0,
      PENDENTE: 1,
      REPROVADA: 2,
      FINALIZADA: 3,
      INATIVO: 4,
    };

    return this.items()
      .filter((s) => status === 'TODOS' || s.status === status)
      .filter((s) => {
        if (!termo) return true;
        const hay = [
          s.estacaoSigla,
          s.estacaoNome,
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
          : b.id - a.id,
      );
  });

  readonly form = this.fb.group({
    estacaoId: this.fb.control<number | null>(null, Validators.required),
    dmcId: this.fb.control<number | null>(null, Validators.required),
    dataUso: [this.defaultDateIso(), Validators.required],
    horaInicio: ['08:00', Validators.required],
    horaFim: ['12:00', Validators.required],
  });

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.loadError.set(null);

    forkJoin({
      solicitacoes: this.solicitacaoUsoService.listar(true),
      estacoes: this.estacaoService.listar().pipe(catchError(() => of<EstacaoResponse[]>([]))),
      dmcs: this.dmcService.listar().pipe(catchError(() => of<DmcResponse[]>([]))),
    }).subscribe({
      next: ({ solicitacoes, estacoes, dmcs }) => {
        this.items.set(solicitacoes ?? []);
        this.estacoes.set(estacoes ?? []);
        this.dmcs.set(dmcs ?? []);
        this.loading.set(false);

        if (!this.editing()) {
          const firstDisp = estacoes.find((e) => e.status === 'DISPONIVEL') ?? estacoes[0];
          const firstDmc = dmcs.find((d) => d.status === 'ATIVO') ?? dmcs[0];
          if (this.form.controls.estacaoId.value == null && firstDisp) {
            this.form.controls.estacaoId.setValue(firstDisp.id);
          }
          if (this.form.controls.dmcId.value == null && firstDmc) {
            this.form.controls.dmcId.setValue(firstDmc.id);
          }
        }
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.loadError.set(
          apiErrorMessage(error, 'Não foi possível carregar suas solicitações de uso.'),
        );
      },
    });
  }

  iniciarNovo(): void {
    this.editing.set(null);
    const firstDisp =
      this.estacoes().find((e) => e.status === 'DISPONIVEL') ?? this.estacoes()[0] ?? null;
    const firstDmc = this.dmcsAtivos()[0] ?? null;
    this.form.reset({
      estacaoId: firstDisp?.id ?? null,
      dmcId: firstDmc?.id ?? null,
      dataUso: this.defaultDateIso(),
      horaInicio: '08:00',
      horaFim: '12:00',
    });
    this.formError.set(null);
  }

  editar(sol: SolicitacaoUsoResponse): void {
    this.editing.set(sol);
    this.form.reset({
      estacaoId: sol.estacaoId,
      dmcId: sol.dmcId,
      dataUso: sol.dataUso,
      horaInicio: formatHoraCurta(sol.horaInicio),
      horaFim: formatHoraCurta(sol.horaFim),
    });
    this.formError.set(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicao(): void {
    this.iniciarNovo();
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError.set('Preencha todos os campos obrigatórios da solicitação.');
      return;
    }

    const v = this.form.getRawValue();
    if (v.horaFim <= v.horaInicio) {
      this.formError.set('O horário final deve ser posterior ao horário inicial.');
      return;
    }

    const body: SolicitacaoUsoRequest = {
      estacaoId: Number(v.estacaoId),
      dmcId: Number(v.dmcId),
      dataUso: v.dataUso,
      horaInicio: v.horaInicio.length === 5 ? v.horaInicio : v.horaInicio.slice(0, 5),
      horaFim: v.horaFim.length === 5 ? v.horaFim : v.horaFim.slice(0, 5),
    };

    const editing = this.editing();
    const request$ = editing
      ? this.solicitacaoUsoService.atualizar(editing.id, body)
      : this.solicitacaoUsoService.criar(body);

    this.saving.set(true);
    this.formError.set(null);

    request$.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.toast.success(
          editing
            ? `Solicitação #${saved.id} atualizada com sucesso.`
            : `Solicitação #${saved.id} (${saved.estacaoSigla}) enviada para análise do Colaborador!`,
        );
        this.iniciarNovo();
        this.reload();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(apiErrorMessage(error));
      },
    });
  }

  confirmarLiberacao(sol: SolicitacaoUsoResponse): void {
    this.releasingId.set(sol.id);
    this.solicitacaoUsoService.liberar(sol.id).subscribe({
      next: () => {
        this.releasingId.set(null);
        this.toast.success(
          `Liberação da estação ${sol.estacaoSigla} confirmada! A estação voltou ao status DISPONÍVEL.`,
        );
        this.reload();
      },
      error: (error: unknown) => {
        this.releasingId.set(null);
        this.toast.error(apiErrorMessage(error, 'Não foi possível confirmar a liberação da estação.'));
      },
    });
  }

  inativar(): void {
    const sol = this.toInactivate();
    if (!sol) return;
    this.inactivating.set(true);
    this.solicitacaoUsoService.inativar(sol.id).subscribe({
      next: () => {
        this.inactivating.set(false);
        this.toInactivate.set(null);
        if (this.editing()?.id === sol.id) {
          this.iniciarNovo();
        }
        this.toast.success(`Solicitação #${sol.id} inativada com sucesso.`);
        this.reload();
      },
      error: (error: unknown) => {
        this.inactivating.set(false);
        this.toInactivate.set(null);
        this.toast.error(apiErrorMessage(error));
      },
    });
  }

  inputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  invalid(control: AbstractControl | null | undefined): boolean {
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  private defaultDateIso(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
