import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ModalComponent } from '../modal/modal.component';

/** Confirmação de ação destrutiva/irreversível (ex.: inativação). */
@Component({
  selector: 'app-confirm-dialog',
  imports: [ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [open]="open()" [title]="title()" [busy]="busy()" (closed)="cancelled.emit()">
      <p class="confirm__message">{{ message() }}</p>
      @if (note()) {
        <p class="confirm__note">{{ note() }}</p>
      }
      <ng-container modal-footer>
        <button type="button" class="btn btn--secondary" (click)="cancelled.emit()" [disabled]="busy()">Cancelar</button>
        <button type="button" class="btn btn--danger" (click)="confirmed.emit()" [disabled]="busy()">
          {{ busy() ? 'Processando...' : confirmLabel() }}
        </button>
      </ng-container>
    </app-modal>
  `,
})
export class ConfirmDialogComponent {
  readonly open = input(false);
  readonly title = input('Confirmar ação');
  readonly message = input('');
  readonly note = input<string | null>(null);
  readonly confirmLabel = input('Confirmar');
  readonly busy = input(false);
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();
}
