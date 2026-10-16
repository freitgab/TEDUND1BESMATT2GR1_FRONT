import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';

import { apiErrorMessage } from '../../../core/http/api-error';
import { RedeResponse } from '../../../core/models/admin.models';
import {
  EstacaoRequest,
  EstacaoResponse,
  SoftwareDTO,
  StatusEstacao,
  TIPOS_ESTACAO,
  TIPOS_LICENCA_SOFTWARE,
  TIPOS_SENSOR,
  TipoEstacao,
  TipoLicencaSoftware,
  TipoSensor,
  exigeSensoresESoftwares,
  tipoEstacaoLabel,
  tipoLicencaLabel,
  tipoSensorLabel,
} from '../../../core/models/operacional.models';
import { RedeService } from '../../../core/services/admin-api.services';
import { EstacaoService } from '../../../core/services/estacao.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { DataBrPipe } from '../../../shared/pipes/data-br.pipe';
import { StatusBadgeComponent } from '../../../shared/status-badge/status-badge.component';
import { emptyToNull, normalize } from '../../admin/admin-list-page';

type SoftwareFormGroup = FormGroup<{
  id: FormControl<number | null>;
  nome: FormControl<string>;
  urlDownload: FormControl<string>;
  tipoSoftware: FormControl<TipoLicencaSoftware>;
  objetivoUso: FormControl<string>;
  variaveisTexto: FormControl<string>;
}>;

@Component({
  selector: 'app-estacoes-page',
  imports: [
    ReactiveFormsModule,
    ModalComponent,
    ConfirmDialogComponent,
    StatusBadgeComponent,
    DataBrPipe,
  ],
  templateUrl: './estacoes-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EstacoesPageComponent {
  private readonly estacaoService = inject(EstacaoService);
  private readonly redeService = inject(RedeService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly tiposEstacao = TIPOS_ESTACAO;
  readonly tiposSensor = TIPOS_SENSOR;
  readonly tiposLicenca = TIPOS_LICENCA_SOFTWARE;
  readonly tipoEstacaoLabel = tipoEstacaoLabel;
  readonly tipoSensorLabel = tipoSensorLabel;
  readonly tipoLicencaLabel = tipoLicencaLabel;

  readonly items = signal<EstacaoResponse[]>([]);
  readonly redes = signal<RedeResponse[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly busca = signal('');
  readonly statusFiltro = signal<'TODOS' | StatusEstacao>('TODOS');
  readonly tipoFiltro = signal<'TODOS' | TipoEstacao>('TODOS');
  readonly redeFiltro = signal<'TODOS' | number>('TODOS');

  readonly formOpen = signal(false);
  readonly editing = signal<EstacaoResponse | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  readonly tipoSelecionado = signal<TipoEstacao>('AUTOMATICA');
  readonly sensoresSelecionados = signal<TipoSensor[]>([]);

  readonly toInactivate = signal<EstacaoResponse | null>(null);
  readonly inactivating = signal(false);

  readonly redesAtivas = computed(() => this.redes().filter((r) => r.status === 'ATIVO'));
  readonly exigeSecaoTecnica = computed(() => exigeSensoresESoftwares(this.tipoSelecionado()));

  readonly totalDisponiveis = computed(
    () => this.items().filter((e) => e.status === 'DISPONIVEL').length,
  );
  readonly totalIndisponiveis = computed(
    () => this.items().filter((e) => e.status === 'INDISPONIVEL').length,
  );

  readonly filtrados = computed(() => {
    const termo = normalize(this.busca());
    const status = this.statusFiltro();
    const tipo = this.tipoFiltro();
    const redeId = this.redeFiltro();

    const statusOrder: Record<StatusEstacao, number> = {
      DISPONIVEL: 0,
      INDISPONIVEL: 1,
      INATIVO: 2,
    };

    return this.items()
      .filter((e) => status === 'TODOS' || e.status === status)
      .filter((e) => tipo === 'TODOS' || e.tipoEstacao === tipo)
      .filter((e) => redeId === 'TODOS' || e.redeMonitoramentoId === redeId)
      .filter((e) => {
        if (!termo) return true;
        const hay = [
          e.sigla,
          e.nome,
          e.tipoEstacao,
          tipoEstacaoLabel(e.tipoEstacao),
          e.redeMonitoramentoSigla,
          e.descricaoComplementar,
          ...(e.sensores ?? []),
          ...(e.softwares ?? []).map((s) => `${s.nome} ${s.objetivoUso}`),
        ].join(' ');
        return normalize(hay).includes(termo);
      })
      .sort((a, b) =>
        statusOrder[a.status] !== statusOrder[b.status]
          ? statusOrder[a.status] - statusOrder[b.status]
          : a.sigla.localeCompare(b.sigla),
      );
  });

  readonly form = this.fb.group({
    sigla: ['', [Validators.required, Validators.maxLength(30)]],
    nome: ['', [Validators.required, Validators.maxLength(160)]],
    tipoEstacao: this.fb.control<TipoEstacao>('AUTOMATICA', Validators.required),
    redeMonitoramentoId: this.fb.control<number | null>(null, Validators.required),
    capacidadeMaximaSuportada: [1, [Validators.required, Validators.min(1), Validators.max(500)]],
    latitude: [-12.9714, [Validators.required, Validators.min(-90), Validators.max(90)]],
    longitude: [-38.5014, [Validators.required, Validators.min(-180), Validators.max(180)]],
    descricaoComplementar: ['', [Validators.maxLength(500)]],
    softwares: this.fb.array<SoftwareFormGroup>([]),
  });

  get softwares() {
    return this.form.controls.softwares;
  }

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.loadError.set(null);
    forkJoin({
      estacoes: this.estacaoService.listar(),
      redes: this.redeService.listar().pipe(catchError(() => of<RedeResponse[]>([]))),
    }).subscribe({
      next: ({ estacoes, redes }) => {
        this.items.set(estacoes ?? []);
        this.redes.set(redes ?? []);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.loadError.set(apiErrorMessage(error, 'Não foi possível carregar as estações meteorológicas.'));
      },
    });
  }

  onTipoEstacaoChange(novoTipo: TipoEstacao): void {
    this.tipoSelecionado.set(novoTipo);
    this.form.controls.tipoEstacao.setValue(novoTipo);
    if (exigeSensoresESoftwares(novoTipo) && this.softwares.length === 0) {
      this.adicionarSoftware();
    }
  }

  toggleSensor(sensor: TipoSensor): void {
    const atual = this.sensoresSelecionados();
    if (atual.includes(sensor)) {
      this.sensoresSelecionados.set(atual.filter((s) => s !== sensor));
    } else {
      this.sensoresSelecionados.set([...atual, sensor]);
    }
  }

  adicionarSoftware(dto?: SoftwareDTO): void {
    this.softwares.push(this.criarSoftwareGroup(dto));
  }

  removerSoftware(index: number): void {
    this.softwares.removeAt(index);
  }

  novo(): void {
    this.editing.set(null);
    const defaultRedeId = this.redesAtivas()[0]?.id ?? null;
    this.form.reset({
      sigla: '',
      nome: '',
      tipoEstacao: 'AUTOMATICA',
      redeMonitoramentoId: defaultRedeId,
      capacidadeMaximaSuportada: 4,
      latitude: -12.9714,
      longitude: -38.5014,
      descricaoComplementar: '',
    });
    this.tipoSelecionado.set('AUTOMATICA');
    this.sensoresSelecionados.set(['TEMPERATURA', 'UMIDADE', 'PLUVIOMETRO']);
    this.softwares.clear();
    this.adicionarSoftware({
      nome: '',
      urlDownload: '',
      tipoSoftware: 'SOFTWARE_LIVRE',
      objetivoUso: '',
      variaveisMonitoradas: ['TEMPERATURA', 'UMIDADE'],
    });
    this.formError.set(null);
    this.formOpen.set(true);
  }

  editar(estacao: EstacaoResponse): void {
    this.editing.set(estacao);
    this.form.reset({
      sigla: estacao.sigla,
      nome: estacao.nome,
      tipoEstacao: estacao.tipoEstacao,
      redeMonitoramentoId: estacao.redeMonitoramentoId,
      capacidadeMaximaSuportada: estacao.capacidadeMaximaSuportada,
      latitude: estacao.latitude,
      longitude: estacao.longitude,
      descricaoComplementar: estacao.descricaoComplementar ?? '',
    });
    this.tipoSelecionado.set(estacao.tipoEstacao);
    this.sensoresSelecionados.set([...(estacao.sensores ?? [])]);
    this.softwares.clear();
    if (estacao.softwares && estacao.softwares.length > 0) {
      estacao.softwares.forEach((sw) => this.adicionarSoftware(sw));
    } else if (exigeSensoresESoftwares(estacao.tipoEstacao)) {
      this.adicionarSoftware();
    }
    this.formError.set(null);
    this.formOpen.set(true);
  }

  fecharFormulario(): void {
    if (!this.saving()) {
      this.formOpen.set(false);
    }
  }

  salvar(): void {
    const exigeTecnica = this.exigeSecaoTecnica();

    if (
      this.form.controls.sigla.invalid ||
      this.form.controls.nome.invalid ||
      this.form.controls.tipoEstacao.invalid ||
      this.form.controls.redeMonitoramentoId.invalid ||
      this.form.controls.capacidadeMaximaSuportada.invalid ||
      this.form.controls.latitude.invalid ||
      this.form.controls.longitude.invalid
    ) {
      this.form.markAllAsTouched();
      this.formError.set('Revise os campos obrigatórios destacados antes de salvar.');
      return;
    }

    let sensores: TipoSensor[] = [];
    let softwaresPayload: SoftwareDTO[] = [];

    if (exigeTecnica) {
      sensores = this.sensoresSelecionados();
      if (sensores.length === 0) {
        this.formError.set(
          'Estações Automáticas e Radares Meteorológicos exigem pelo menos um sensor disponível.',
        );
        return;
      }

      if (this.softwares.length === 0) {
        this.formError.set(
          'Estações Automáticas e Radares Meteorológicos exigem pelo menos um software de coleta/transmissão.',
        );
        return;
      }

      if (this.softwares.invalid) {
        this.softwares.markAllAsTouched();
        this.formError.set(
          'Preencha todos os campos obrigatórios dos softwares de coleta/transmissão.',
        );
        return;
      }

      softwaresPayload = this.softwares.getRawValue().map((sw) => {
        const variaveis = sw.variaveisTexto
          .split(/[,;]+/)
          .map((v) => v.trim())
          .filter((v) => v.length > 0);
        return {
          id: sw.id,
          nome: sw.nome.trim(),
          urlDownload: sw.urlDownload.trim(),
          tipoSoftware: sw.tipoSoftware,
          objetivoUso: sw.objetivoUso.trim(),
          variaveisMonitoradas: variaveis,
        };
      });

      const algumSemVariavel = softwaresPayload.some((sw) => sw.variaveisMonitoradas.length === 0);
      if (algumSemVariavel) {
        this.formError.set(
          'Informe ao menos uma variável monitorada (ex.: TEMPERATURA, UMIDADE) em cada software.',
        );
        return;
      }
    }

    const v = this.form.getRawValue();
    const body: EstacaoRequest = {
      sigla: v.sigla.trim().toUpperCase(),
      nome: v.nome.trim(),
      tipoEstacao: v.tipoEstacao,
      descricaoComplementar: emptyToNull(v.descricaoComplementar),
      capacidadeMaximaSuportada: Number(v.capacidadeMaximaSuportada),
      latitude: Number(v.latitude),
      longitude: Number(v.longitude),
      redeMonitoramentoId: Number(v.redeMonitoramentoId),
      sensores,
      softwares: softwaresPayload,
    };

    const editing = this.editing();
    const request$ = editing
      ? this.estacaoService.atualizar(editing.id, body)
      : this.estacaoService.cadastrar(body);

    this.saving.set(true);
    this.formError.set(null);

    request$.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.toast.success(
          `Estação ${saved.sigla} ${editing ? 'atualizada' : 'cadastrada'} com sucesso.`,
        );
        this.reload();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(apiErrorMessage(error));
      },
    });
  }

  inativar(): void {
    const estacao = this.toInactivate();
    if (!estacao) return;
    this.inactivating.set(true);
    this.estacaoService.inativar(estacao.id).subscribe({
      next: () => {
        this.inactivating.set(false);
        this.toInactivate.set(null);
        this.toast.success(
          `Estação ${estacao.sigla} inativada para manutenção/calibração. O histórico foi preservado.`,
        );
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

  private criarSoftwareGroup(dto?: SoftwareDTO): SoftwareFormGroup {
    return this.fb.group({
      id: this.fb.control<number | null>(dto?.id ?? null),
      nome: [dto?.nome ?? '', [Validators.required, Validators.maxLength(160)]],
      urlDownload: [dto?.urlDownload ?? '', [Validators.required, Validators.maxLength(300)]],
      tipoSoftware: this.fb.control<TipoLicencaSoftware>(
        dto?.tipoSoftware ?? 'SOFTWARE_LIVRE',
        Validators.required,
      ),
      objetivoUso: [dto?.objetivoUso ?? '', [Validators.required, Validators.maxLength(300)]],
      variaveisTexto: [
        dto?.variaveisMonitoradas?.length ? dto.variaveisMonitoradas.join(', ') : 'TEMPERATURA, UMIDADE',
        [Validators.required],
      ],
    });
  }
}
