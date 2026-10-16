import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastService } from '../../core/services/toast.service';

const ICONS = { success: '✔', error: '⚠', info: 'ℹ' } as const;

@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast toast--{{ toast.kind }}" [attr.role]="toast.kind === 'error' ? 'alert' : 'status'">
          <span class="toast__icon">{{ icons[toast.kind] }}</span>
          <div class="toast__text">
            <strong>{{ toast.title }}</strong>
            <span>{{ toast.message }}</span>
          </div>
          <button type="button" class="toast__close" (click)="toastService.dismiss(toast.id)" aria-label="Fechar">✕</button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  protected readonly toastService = inject(ToastService);
  protected readonly icons = ICONS;
}
