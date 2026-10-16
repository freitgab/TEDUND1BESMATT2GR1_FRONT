import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, forkJoin, map, of, tap } from 'rxjs';

import { apiErrorMessage } from '../../../core/http/api-error';
import { DmcRequest, DmcResponse, OgmResponse, TecnicoResponse } from '../../../core/models/admin.models';
import { DmcService, OgmService, TecnicoService } from '../../../core/services/admin-api.services';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { AdminListPage, emptyToNull } from '../admin-list-page';

interface ChefeOption {
  id: number;
  nome: string;
  matricula: string;
  ocupadoPor: string | null;
}

@Component({
  selector: 'app-dmc-page',
  imports: [ReactiveFormsModule, ModalComponent, ConfirmDialogComponent, StatusBadgeComponent, DataBrPipe],
  templateUrl: './dmc-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DmcPageComponent extends AdminListPage<DmcResponse> {
  private readonly dmcService = inject(DmcService);
  private readonly ogmService = inject(OgmService);
  private readonly tecnicoService = inject(TecnicoService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly ogms = signal<OgmResponse[]>([]);
  readonly tecnicos = signal<TecnicoResponse[]>([]);
  readonly ogmFiltro = signal<number | 'TODOS'>('TODOS');

  readonly formOpen = signal(false);
  readonly editing = signal<DmcResponse | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly toInactivate = signal<DmcResponse | null>(null);
  readonly inactivating = signal(false);

  readonly form = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(160)]],
    emailCentral: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    telefoneCentral: ['', [Validators.required, Validators.maxLength(30)]],
    orgaoGestorId: this.fb.control<number | null>(null, Validators.required),
    meteorologistaChefeId: this.fb.control<number | null>(null),
  });

  /** Apenas OGMs ativos podem ser selecionados para novo DMC ou edição */
  readonly ogmsAtivos = computed(() => this.ogms().filter((o) => o.status === 'ATIVO'));

  /** Candidatos a meteorologista-chefe (técnicos ativos), indicando se já chefiam outro DMC (RN003) */
  readonly chefeOptions = computed<ChefeOption[]>(() => {
    const editingId = this.editing()?.id ?? null;
    const ocupados = new Map<number, string>();

    for (const dmc of this.items()) {
      if (dmc.meteorologistaChefeId == null) continue;
      if (dmc.id !== editingId) {
        ocupados.set(dmc.meteorologistaChefeId, dmc.nome);
      }
    }

    return this.tecnicos()
      .filter((t) => t.status === 'ATIVO')
      .map((t) => ({
        id: t.id,
        nome: t.nomeCompleto,
        matricula: t.matricula,
        ocupadoPor: ocupados.get(t.id) ?? null,
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  });

  constructor() {
    super();
    this.reload();
  }

  protected load() {
    return forkJoin({
      dmcs: this.dmcService.listar(),
      ogms: this.ogmService.listar().pipe(catchError(() => of<OgmResponse[]>([]))),
      tecnicos: this.tecnicoService.listar().pipe(catchError(() => of<TecnicoResponse[]>([]))),
    }).pipe(
      tap(({ ogms, tecnicos }) => {
        this.ogms.set(ogms);
        this.tecnicos.set(tecnicos);
      }),
      map(({ dmcs }) => dmcs),
    );
  }

  protected override extraFilter(item: DmcResponse): boolean {
    const filtro = this.ogmFiltro();
    return filtro === 'TODOS' || item.orgaoGestorId === filtro;
  }

  protected searchText(d: DmcResponse): string {
    return [d.nome, d.orgaoGestorNome, d.meteorologistaChefeNome, d.emailCentral].join(' ');
  }

  protected sortKey(d: DmcResponse): string {
    return d.nome;
  }

  novo(): void {
    this.editing.set(null);
    this.form.reset();
    this.formError.set(null);
    this.formOpen.set(true);
  }

  editar(dmc: DmcResponse): void {
    this.editing.set(dmc);
    this.form.reset({
      nome: dmc.nome,
      emailCentral: dmc.emailCentral ?? '',
      telefoneCentral: dmc.telefoneCentral ?? '',
      orgaoGestorId: dmc.orgaoGestorId,
      meteorologistaChefeId: dmc.meteorologistaChefeId,
    });
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

    const v = this.form.getRawValue();
    const body: DmcRequest = {
      nome: v.nome.trim(),
      emailCentral: emptyToNull(v.emailCentral),
      telefoneCentral: emptyToNull(v.telefoneCentral),
      orgaoGestorId: v.orgaoGestorId!,
      meteorologistaChefeId: v.meteorologistaChefeId ?? null,
    };

    const editing = this.editing();
    const request$ = editing ? this.dmcService.atualizar(editing.id, body) : this.dmcService.cadastrar(body);

    this.saving.set(true);
    this.formError.set(null);
    request$.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.toast.success(`Distrito ${saved.nome} ${editing ? 'atualizado' : 'cadastrado'} com sucesso.`);
        this.reload();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(apiErrorMessage(error));
      },
    });
  }

  inativar(): void {
    const dmc = this.toInactivate();
    if (!dmc) return;
    this.inactivating.set(true);
    this.dmcService.inativar(dmc.id).subscribe({
      next: () => {
        this.inactivating.set(false);
        this.toInactivate.set(null);
        this.toast.success(`Distrito ${dmc.nome} inativado com sucesso.`);
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
