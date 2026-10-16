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
};

/**
 * Badge visual de status de entidades administrativas, estações meteorológicas e solicitações:
 * ATIVO / DISPONIVEL (verde), INDISPONIVEL (amarelo/laranja), INATIVO (vermelho/cinza),
 * PENDENTE (âmbar), APROVADA (verde), REPROVADA (vermelho), FINALIZADA (azul/roxo).
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
