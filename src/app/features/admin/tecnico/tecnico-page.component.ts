import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, forkJoin, map, of, tap } from 'rxjs';

import { apiErrorMessage } from '../../../core/http/api-error';
import { DmcResponse, TecnicoCadastroRequest, TecnicoEdicaoRequest, TecnicoResponse } from '../../../core/models/admin.models';
import { DmcService, TecnicoService } from '../../../core/services/admin-api.services';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { AdminListPage, emptyToNull } from '../admin-list-page';

@Component({
  selector: 'app-tecnico-page',
  imports: [ReactiveFormsModule, ModalComponent, StatusBadgeComponent, DataBrPipe],
  templateUrl: './tecnico-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TecnicoPageComponent extends AdminListPage<TecnicoResponse> {
  private readonly tecnicoService = inject(TecnicoService);
  private readonly dmcService = inject(DmcService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly dmcs = signal<DmcResponse[]>([]);
  readonly dmcFiltro = signal<number | 'TODOS'>('TODOS');

  readonly formOpen = signal(false);
  readonly editing = signal<TecnicoResponse | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  // Modal obrigatório de justificativa de inativação (RN008)
  readonly inactivateModalOpen = signal(false);
  readonly tecnicoToInactivate = signal<TecnicoResponse | null>(null);
  readonly inactivating = signal(false);
  readonly inactivateError = signal<string | null>(null);

  readonly form = this.fb.group({
    matricula: ['', [Validators.required, Validators.maxLength(40)]],
    nomeCompleto: ['', [Validators.required, Validators.maxLength(160)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    telefone: ['', [Validators.maxLength(30)]],
    distritoId: this.fb.control<number | null>(null, Validators.required),
    senhaInicial: [''],
  });

  readonly inactivateForm = this.fb.group({
    justificativa: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
  });

  readonly dmcsAtivos = computed(() => this.dmcs().filter((d) => d.status === 'ATIVO'));

  constructor() {
    super();
    this.reload();
  }

  protected load() {
    return forkJoin({
      tecnicos: this.tecnicoService.listar(),
      dmcs: this.dmcService.listar().pipe(catchError(() => of<DmcResponse[]>([]))),
    }).pipe(
      tap(({ dmcs }) => this.dmcs.set(dmcs)),
      map(({ tecnicos }) => tecnicos),
    );
  }

  protected override extraFilter(item: TecnicoResponse): boolean {
    const filtro = this.dmcFiltro();
    return filtro === 'TODOS' || item.distritoId === filtro;
  }

  protected searchText(t: TecnicoResponse): string {
    return [t.matricula, t.nomeCompleto, t.email, t.telefone, t.distritoNome, t.motivoInativacao].join(' ');
  }

  protected sortKey(t: TecnicoResponse): string {
    return t.nomeCompleto;
  }

  novo(): void {
    this.editing.set(null);
    this.form.reset({ senhaInicial: '123456' });
    this.formError.set(null);
    this.formOpen.set(true);
  }

  editar(tec: TecnicoResponse): void {
    this.editing.set(tec);
    this.form.reset({
      matricula: tec.matricula,
      nomeCompleto: tec.nomeCompleto,
      email: tec.email,
      telefone: tec.telefone ?? '',
      distritoId: tec.distritoId,
      senhaInicial: '',
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
    const editing = this.editing();

    this.saving.set(true);
    this.formError.set(null);

    if (editing) {
      const body: TecnicoEdicaoRequest = {
        matricula: v.matricula.trim(),
        nomeCompleto: v.nomeCompleto.trim(),
        email: v.email.trim(),
        telefone: emptyToNull(v.telefone),
        distritoId: v.distritoId!,
      };
      this.tecnicoService.atualizar(editing.id, body).subscribe({
        next: (saved) => {
          this.saving.set(false);
          this.formOpen.set(false);
          this.toast.success(`Técnico ${saved.nomeCompleto} atualizado com sucesso.`);
          this.reload();
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.formError.set(apiErrorMessage(error));
        },
      });
    } else {
      const body: TecnicoCadastroRequest = {
        matricula: v.matricula.trim(),
        nomeCompleto: v.nomeCompleto.trim(),
        email: v.email.trim(),
        telefone: emptyToNull(v.telefone),
        distritoId: v.distritoId!,
        senhaInicial: emptyToNull(v.senhaInicial),
      };
      this.tecnicoService.cadastrar(body).subscribe({
        next: (saved) => {
          this.saving.set(false);
          this.formOpen.set(false);
          this.toast.success(`Técnico ${saved.nomeCompleto} cadastrado com sucesso.`);
          this.reload();
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.formError.set(apiErrorMessage(error));
        },
      });
    }
  }

  abrirInativacao(tec: TecnicoResponse): void {
    this.tecnicoToInactivate.set(tec);
    this.inactivateForm.reset();
    this.inactivateError.set(null);
    this.inactivateModalOpen.set(true);
  }

  fecharInativacao(): void {
    if (!this.inactivating()) {
      this.inactivateModalOpen.set(false);
      this.tecnicoToInactivate.set(null);
    }
  }

  confirmarInativacao(): void {
    if (this.inactivateForm.invalid) {
      this.inactivateForm.markAllAsTouched();
      this.inactivateError.set('A justificativa é obrigatória e deve ter pelo menos 10 caracteres.');
      return;
    }

    const tec = this.tecnicoToInactivate();
    if (!tec) return;

    this.inactivating.set(true);
    this.inactivateError.set(null);

    const justificativa = this.inactivateForm.controls.justificativa.value.trim();

    this.tecnicoService.inativar(tec.id, { justificativa }).subscribe({
      next: () => {
        this.inactivating.set(false);
        this.inactivateModalOpen.set(false);
        this.tecnicoToInactivate.set(null);
        this.toast.success(`Técnico ${tec.nomeCompleto} inativado com justificativa registrada no histórico.`);
        this.reload();
      },
      error: (error: unknown) => {
        this.inactivating.set(false);
        this.inactivateError.set(apiErrorMessage(error));
      },
    });
  }
}
