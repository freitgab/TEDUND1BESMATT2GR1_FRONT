import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, forkJoin, map, of, tap } from 'rxjs';

import { apiErrorMessage } from '../../../core/http/api-error';
import { OgmRequest, OgmResponse, Setor, TecnicoResponse } from '../../../core/models/admin.models';
import { OgmService, TecnicoService } from '../../../core/services/admin-api.services';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { AdminListPage, emptyToNull } from '../admin-list-page';

type SetorForm = FormGroup<{
  id: FormControl<number | null>;
  nome: FormControl<string>;
  nomeacaoResponsavel: FormControl<string>;
}>;

interface DiretorOption {
  id: number;
  nome: string;
  origem: string;
  /** Sigla do OGM que já é dirigido por este usuário (regra: 1 diretor por OGM). */
  ocupadoPor: string | null;
}

@Component({
  selector: 'app-ogm-page',
  imports: [ReactiveFormsModule, ModalComponent, ConfirmDialogComponent, StatusBadgeComponent, DataBrPipe],
  templateUrl: './ogm-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OgmPageComponent extends AdminListPage<OgmResponse> {
  private readonly ogmService = inject(OgmService);
  private readonly tecnicoService = inject(TecnicoService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly tecnicos = signal<TecnicoResponse[]>([]);
  readonly formOpen = signal(false);
  readonly editing = signal<OgmResponse | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly toInactivate = signal<OgmResponse | null>(null);
  readonly inactivating = signal(false);

  readonly form = this.fb.group({
    sigla: ['', [Validators.required, Validators.maxLength(30)]],
    nome: ['', [Validators.required, Validators.maxLength(160)]],
    emailCentral: ['', [Validators.required, Validators.email, Validators.maxLength(160)]],
    telefoneCentral: ['', [Validators.required, Validators.maxLength(30)]],
    diretorGeralId: this.fb.control<number | null>(null, Validators.required),
    setores: this.fb.array<SetorForm>([]),
  });

  get setores() {
    return this.form.controls.setores;
  }

  /**
   * O diretor-geral é um Usuario do sistema. Como o Back-End não expõe listagem
   * de usuários, os candidatos são os diretores atuais e os técnicos ativos
   * (cada técnico possui um usuário vinculado).
   */
  readonly diretorOptions = computed<DiretorOption[]>(() => {
    const editingId = this.editing()?.id ?? null;
    const ocupados = new Map<number, string>();
    const options = new Map<number, Omit<DiretorOption, 'ocupadoPor'>>();

    for (const ogm of this.items()) {
      if (ogm.diretorGeralId == null) continue;
      if (ogm.id !== editingId) ocupados.set(ogm.diretorGeralId, ogm.sigla);
      options.set(ogm.diretorGeralId, {
        id: ogm.diretorGeralId,
        nome: ogm.diretorGeralNome ?? `Usuário #${ogm.diretorGeralId}`,
        origem: 'Diretor(a) cadastrado(a)',
      });
    }
    for (const tecnico of this.tecnicos()) {
      if (tecnico.usuarioId == null || tecnico.status !== 'ATIVO' || options.has(tecnico.usuarioId)) continue;
      options.set(tecnico.usuarioId, {
        id: tecnico.usuarioId,
        nome: tecnico.nomeCompleto,
        origem: `Técnico · mat. ${tecnico.matricula}`,
      });
    }
    return [...options.values()]
      .map((o) => ({ ...o, ocupadoPor: ocupados.get(o.id) ?? null }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  });

  constructor() {
    super();
    this.reload();
  }

  protected load() {
    return forkJoin({
      ogms: this.ogmService.listar(),
      tecnicos: this.tecnicoService.listar().pipe(catchError(() => of<TecnicoResponse[]>([]))),
    }).pipe(
      tap(({ tecnicos }) => this.tecnicos.set(tecnicos)),
      map(({ ogms }) => ogms),
    );
  }

  protected searchText(o: OgmResponse): string {
    return [o.sigla, o.nome, o.diretorGeralNome, o.emailCentral, ...o.setores.map((s) => s.nome)].join(' ');
  }

  protected sortKey(o: OgmResponse): string {
    return o.sigla;
  }

  // ---------- Formulário ----------
  novo(): void {
    this.editing.set(null);
    this.form.reset();
    this.setores.clear();
    this.formError.set(null);
    this.formOpen.set(true);
  }

  editar(ogm: OgmResponse): void {
    this.editing.set(ogm);
    this.form.reset({
      sigla: ogm.sigla,
      nome: ogm.nome,
      emailCentral: ogm.emailCentral ?? '',
      telefoneCentral: ogm.telefoneCentral ?? '',
      diretorGeralId: ogm.diretorGeralId,
    });
    this.setores.clear();
    ogm.setores.forEach((s) => this.setores.push(this.setorGroup(s)));
    this.formError.set(null);
    this.formOpen.set(true);
  }

  adicionarSetor(): void {
    this.setores.push(this.setorGroup());
  }

  removerSetor(index: number): void {
    this.setores.removeAt(index);
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
    const body: OgmRequest = {
      sigla: v.sigla.trim(),
      nome: v.nome.trim(),
      emailCentral: emptyToNull(v.emailCentral),
      telefoneCentral: emptyToNull(v.telefoneCentral),
      diretorGeralId: v.diretorGeralId!,
      setores: v.setores.map((s) => ({ id: s.id, nome: s.nome.trim(), nomeacaoResponsavel: s.nomeacaoResponsavel.trim() })),
    };
    const editing = this.editing();
    const request$ = editing ? this.ogmService.atualizar(editing.id, body) : this.ogmService.cadastrar(body);

    this.saving.set(true);
    this.formError.set(null);
    request$.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.toast.success(`OGM ${saved.sigla} ${editing ? 'atualizado' : 'cadastrado'} com sucesso.`);
        this.reload();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(apiErrorMessage(error));
      },
    });
  }

  // ---------- Inativação (soft delete) ----------
  inativar(): void {
    const ogm = this.toInactivate();
    if (!ogm) return;
    this.inactivating.set(true);
    this.ogmService.inativar(ogm.id).subscribe({
      next: () => {
        this.inactivating.set(false);
        this.toInactivate.set(null);
        this.toast.success(`OGM ${ogm.sigla} inativado. O histórico foi preservado.`);
        this.reload();
      },
      error: (error: unknown) => {
        this.inactivating.set(false);
        this.toInactivate.set(null);
        this.toast.error(apiErrorMessage(error));
      },
    });
  }

  private setorGroup(setor?: Setor): SetorForm {
    return this.fb.group({
      id: this.fb.control<number | null>(setor?.id ?? null),
      nome: [setor?.nome ?? '', [Validators.required, Validators.maxLength(160)]],
      nomeacaoResponsavel: [setor?.nomeacaoResponsavel ?? '', [Validators.required, Validators.maxLength(160)]],
    });
  }
}
