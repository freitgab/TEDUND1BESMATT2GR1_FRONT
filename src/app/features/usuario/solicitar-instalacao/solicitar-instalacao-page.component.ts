import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';

import { apiErrorMessage } from '../../../core/http/api-error';
import {
  EstacaoResponse,
  SolicitacaoInstalacaoRequest,
  SolicitacaoInstalacaoResponse,
  StatusSolicitacaoInstalacao,
  TIPOS_LICENCA_SOFTWARE,
  TipoLicencaSoftware,
  tipoEstacaoLabel,
  tipoLicencaLabel,
} from '../../../core/models/operacional.models';
import { EstacaoService } from '../../../core/services/estacao.service';
import { SolicitacaoInstalacaoService } from '../../../core/services/solicitacao-instalacao.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { emptyToNull, normalize } from '../../admin/admin-list-page';

@Component({
  selector: 'app-solicitar-instalacao-page',
  imports: [ReactiveFormsModule, ConfirmDialogComponent, StatusBadgeComponent, DataBrPipe],
  templateUrl: './solicitar-instalacao-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SolicitarInstalacaoPageComponent {
  private readonly solicitacaoInstalacaoService = inject(SolicitacaoInstalacaoService);
  private readonly estacaoService = inject(EstacaoService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly tiposLicenca = TIPOS_LICENCA_SOFTWARE;
  readonly tipoLicencaLabel = tipoLicencaLabel;
  readonly tipoEstacaoLabel = tipoEstacaoLabel;

  readonly items = signal<SolicitacaoInstalacaoResponse[]>([]);
  readonly estacoes = signal<EstacaoResponse[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly busca = signal('');
  readonly statusFiltro = signal<'TODOS' | StatusSolicitacaoInstalacao>('TODOS');

  readonly editing = signal<SolicitacaoInstalacaoResponse | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  readonly toInactivate = signal<SolicitacaoInstalacaoResponse | null>(null);
  readonly inactivating = signal(false);

  readonly estacoesSelecionaveis = computed(() =>
    this.estacoes()
      .filter((e) => e.status !== 'INATIVO')
      .sort((a, b) => a.sigla.localeCompare(b.sigla)),
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

  readonly form = this.fb.group({
    estacaoId: this.fb.control<number | null>(null, Validators.required),
    sensoresSoftwares: ['', [Validators.required, Validators.maxLength(300)]],
    urlDownload: ['', [Validators.maxLength(300)]],
    tipoSoftware: this.fb.control<TipoLicencaSoftware>('SOFTWARE_LIVRE', Validators.required),
    objetivoUso: ['', [Validators.required, Validators.maxLength(500)]],
  });

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.loadError.set(null);

    forkJoin({
      solicitacoes: this.solicitacaoInstalacaoService.listar(true),
      estacoes: this.estacaoService.listar().pipe(catchError(() => of<EstacaoResponse[]>([]))),
    }).subscribe({
      next: ({ solicitacoes, estacoes }) => {
        this.items.set(solicitacoes ?? []);
        this.estacoes.set(estacoes ?? []);
        this.loading.set(false);

        if (!this.editing() && this.form.controls.estacaoId.value == null) {
          const firstAtiva = estacoes.find((e) => e.status !== 'INATIVO') ?? estacoes[0];
          if (firstAtiva) {
            this.form.controls.estacaoId.setValue(firstAtiva.id);
          }
        }
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.loadError.set(
          apiErrorMessage(error, 'Não foi possível carregar suas solicitações de instalação.'),
        );
      },
    });
  }

  iniciarNovo(): void {
    this.editing.set(null);
    const firstAtiva = this.estacoesSelecionaveis()[0] ?? null;
    this.form.reset({
      estacaoId: firstAtiva?.id ?? null,
      sensoresSoftwares: '',
      urlDownload: '',
      tipoSoftware: 'SOFTWARE_LIVRE',
      objetivoUso: '',
    });
    this.formError.set(null);
  }

  editar(sol: SolicitacaoInstalacaoResponse): void {
    this.editing.set(sol);
    this.form.reset({
      estacaoId: sol.estacaoId,
      sensoresSoftwares: sol.sensoresSoftwares,
      urlDownload: sol.urlDownload ?? '',
      tipoSoftware: sol.tipoSoftware ?? 'SOFTWARE_LIVRE',
      objetivoUso: sol.objetivoUso,
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
      this.formError.set('Preencha todos os campos obrigatórios da solicitação de instalação.');
      return;
    }

    const v = this.form.getRawValue();
    const body: SolicitacaoInstalacaoRequest = {
      estacaoId: Number(v.estacaoId),
      sensoresSoftwares: v.sensoresSoftwares.trim(),
      urlDownload: emptyToNull(v.urlDownload),
      tipoSoftware: v.tipoSoftware ?? null,
      objetivoUso: v.objetivoUso.trim(),
    };

    const editing = this.editing();
    const request$ = editing
      ? this.solicitacaoInstalacaoService.atualizar(editing.id, body)
      : this.solicitacaoInstalacaoService.criar(body);

    this.saving.set(true);
    this.formError.set(null);

    request$.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.toast.success(
          editing
            ? `Solicitação de instalação #${saved.id} atualizada com sucesso.`
            : `Solicitação de instalação #${saved.id} enviada para avaliação do Colaborador!`,
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

  inativar(): void {
    const sol = this.toInactivate();
    if (!sol) return;
    this.inactivating.set(true);
    this.solicitacaoInstalacaoService.inativar(sol.id).subscribe({
      next: () => {
        this.inactivating.set(false);
        this.toInactivate.set(null);
        if (this.editing()?.id === sol.id) {
          this.iniciarNovo();
        }
        this.toast.success(`Solicitação de instalação #${sol.id} inativada com sucesso.`);
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
}
