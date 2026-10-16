import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, forkJoin, map, of, tap } from 'rxjs';

import { apiErrorMessage } from '../../../core/http/api-error';
import { DmcResponse, RedeRequest, RedeResponse, TIPOS_MONITORAMENTO, TecnicoResponse } from '../../../core/models/admin.models';
import { DmcService, RedeService, TecnicoService } from '../../../core/services/admin-api.services';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { AdminListPage } from '../admin-list-page';

@Component({
  selector: 'app-rede-page',
  imports: [ReactiveFormsModule, ModalComponent, ConfirmDialogComponent, StatusBadgeComponent, DataBrPipe],
  templateUrl: './rede-page.component.html',
  styleUrl: './rede-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RedePageComponent extends AdminListPage<RedeResponse> {
  private readonly redeService = inject(RedeService);
  private readonly dmcService = inject(DmcService);
  private readonly tecnicoService = inject(TecnicoService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly dmcs = signal<DmcResponse[]>([]);
  readonly tecnicos = signal<TecnicoResponse[]>([]);
  readonly dmcFiltro = signal<number | 'TODOS'>('TODOS');

  readonly tiposDisponiveis = TIPOS_MONITORAMENTO;
  readonly tiposSelecionados = signal<string[]>([]);

  readonly formOpen = signal(false);
  readonly editing = signal<RedeResponse | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly toInactivate = signal<RedeResponse | null>(null);
  readonly inactivating = signal(false);

  readonly form = this.fb.group({
    sigla: ['', [Validators.required, Validators.maxLength(40)]],
    descricao: ['', [Validators.required, Validators.maxLength(500)]],
    distritoId: this.fb.control<number | null>(null, Validators.required),
    meteorologistaResponsavelId: this.fb.control<number | null>(null),
  });

  readonly dmcsAtivos = computed(() => this.dmcs().filter((d) => d.status === 'ATIVO'));
  readonly tecnicosAtivos = computed(() => this.tecnicos().filter((t) => t.status === 'ATIVO'));

  constructor() {
    super();
    this.reload();
  }

  protected load() {
    return forkJoin({
      redes: this.redeService.listar(),
      dmcs: this.dmcService.listar().pipe(catchError(() => of<DmcResponse[]>([]))),
      tecnicos: this.tecnicoService.listar().pipe(catchError(() => of<TecnicoResponse[]>([]))),
    }).pipe(
      tap(({ dmcs, tecnicos }) => {
        this.dmcs.set(dmcs);
        this.tecnicos.set(tecnicos);
      }),
      map(({ redes }) => redes),
    );
  }

  protected override extraFilter(item: RedeResponse): boolean {
    const filtro = this.dmcFiltro();
    return filtro === 'TODOS' || item.distritoId === filtro;
  }

  protected searchText(r: RedeResponse): string {
    return [r.sigla, r.descricao, r.distritoNome, r.meteorologistaResponsavelNome, ...r.tiposMonitoramento].join(' ');
  }

  protected sortKey(r: RedeResponse): string {
    return r.sigla;
  }

  toggleTipo(tipo: string): void {
    const current = this.tiposSelecionados();
    if (current.includes(tipo)) {
      this.tiposSelecionados.set(current.filter((t) => t !== tipo));
    } else {
      this.tiposSelecionados.set([...current, tipo]);
    }
  }

  novo(): void {
    this.editing.set(null);
    this.form.reset();
    this.tiposSelecionados.set(['TEMPERATURA', 'UMIDADE', 'PRECIPITACAO']);
    this.formError.set(null);
    this.formOpen.set(true);
  }

  editar(rede: RedeResponse): void {
    this.editing.set(rede);
    this.form.reset({
      sigla: rede.sigla,
      descricao: rede.descricao,
      distritoId: rede.distritoId,
      meteorologistaResponsavelId: rede.meteorologistaResponsavelId,
    });
    this.tiposSelecionados.set([...rede.tiposMonitoramento]);
    this.formError.set(null);
    this.formOpen.set(true);
  }

  fecharFormulario(): void {
    if (!this.saving()) this.formOpen.set(false);
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formError.set('Revise os campos destacados antes de salvar.');
      return;
    }

    const tipos = this.tiposSelecionados();
    if (tipos.length === 0) {
      this.formError.set('Selecione pelo menos um tipo de monitoramento climático oferecido pela rede.');
      return;
    }

    const v = this.form.getRawValue();
    const body: RedeRequest = {
      sigla: v.sigla.trim(),
      descricao: v.descricao.trim(),
      distritoId: v.distritoId!,
      tiposMonitoramento: tipos,
      meteorologistaResponsavelId: v.meteorologistaResponsavelId ?? null,
    };

    const editing = this.editing();
    const request$ = editing ? this.redeService.atualizar(editing.id, body) : this.redeService.cadastrar(body);

    this.saving.set(true);
    this.formError.set(null);
    request$.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.toast.success(`Rede ${saved.sigla} ${editing ? 'atualizada' : 'cadastrada'} com sucesso.`);
        this.reload();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(apiErrorMessage(error));
      },
    });
  }

  inativar(): void {
    const rede = this.toInactivate();
    if (!rede) return;
    this.inactivating.set(true);
    this.redeService.inativar(rede.id).subscribe({
      next: () => {
        this.inactivating.set(false);
        this.toInactivate.set(null);
        this.toast.success(`Rede ${rede.sigla} inativada com sucesso.`);
        this.reload();
      },
      error: (error: unknown) => {
        this.inactivating.set(false);
        this.toInactivate.set(null);
        this.toast.error(apiErrorMessage(error));
      },
    });
  }
}
