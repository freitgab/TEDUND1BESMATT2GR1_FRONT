import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Badge visual de status de entidade (soft delete): Ativo / Inativo. */
@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="status" [class.status--ativo]="status() === 'ATIVO'" [class.status--inativo]="status() !== 'ATIVO'"
          [attr.title]="hint() || null">
      {{ status() === 'ATIVO' ? 'Ativo' : 'Inativo' }}
    </span>
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();
  readonly hint = input<string | null>(null);
}
