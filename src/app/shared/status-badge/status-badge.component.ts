import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

const STATUS_LABELS: Record<string, string> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  DISPONIVEL: 'Disponível',
  INDISPONIVEL: 'Indisponível',
  PENDENTE: 'Pendente',
  APROVADA: 'Aprovada',
  REPROVADA: 'Reprovada',
  FINALIZADA: 'Finalizada',
  // Ações de Auditoria
  CADASTRO: 'Cadastro',
  EDICAO: 'Edição',
  INATIVACAO: 'Inativação',
  APROVACAO: 'Aprovação',
  REPROVACAO: 'Reprovação',
  LIBERACAO: 'Liberação',
};

const STATUS_CLASS: Record<string, string> = {
  ATIVO: 'status--ativo',
  DISPONIVEL: 'status--disponivel',
  INDISPONIVEL: 'status--indisponivel',
  INATIVO: 'status--inativo',
  PENDENTE: 'status--pendente',
  APROVADA: 'status--aprovada',
  REPROVADA: 'status--reprovada',
  FINALIZADA: 'status--finalizada',
  // Classes para Ações de Auditoria
  CADASTRO: 'status--cadastro',
  EDICAO: 'status--edicao',
  INATIVACAO: 'status--inativacao',
  APROVACAO: 'status--aprovacao',
  REPROVACAO: 'status--reprovacao',
  LIBERACAO: 'status--liberacao',
};

/**
 * Badge visual de status e ações (entidades, estações, solicitações e auditoria):
 * ATIVO / DISPONIVEL / APROVADA / APROVACAO (verde)
 * INDISPONIVEL / PENDENTE / EDICAO (amarelo/laranja/âmbar)
 * INATIVO / REPROVADA / INATIVACAO / REPROVACAO (vermelho)
 * FINALIZADA / LIBERACAO (roxo/azul)
 * CADASTRO (azul/ciano)
 */
@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="status" [class]="variantClass()" [attr.title]="hint() || null">
      {{ label() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();
  readonly hint = input<string | null>(null);

  readonly label = computed(() => STATUS_LABELS[this.status()] ?? this.status());
  readonly variantClass = computed(() => STATUS_CLASS[this.status()] ?? 'status--inativo');
}
