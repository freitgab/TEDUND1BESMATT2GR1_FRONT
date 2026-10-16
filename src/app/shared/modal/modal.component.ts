import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';

/**
 * Diálogo modal genérico (conteúdo projetado). O rodapé é projetado via atributo
 * `modal-footer`. Fecha com ESC ou clique no fundo, exceto quando `busy` = true.
 */
@Component({
  selector: 'app-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (open()) {
      <div class="modal-backdrop" (click)="requestClose()"></div>
      <div class="modal" [class.modal--wide]="size() === 'wide'" role="dialog" aria-modal="true" [attr.aria-label]="title()">
        <header class="modal__header">
          <h2>{{ title() }}</h2>
          <button type="button" class="modal__close" (click)="requestClose()" [disabled]="busy()" aria-label="Fechar">✕</button>
        </header>
        <div class="modal__body">
          <ng-content />
        </div>
        <footer class="modal__footer">
          <ng-content select="[modal-footer]" />
        </footer>
      </div>
    }
  `,
})
export class ModalComponent {
  readonly open = input(false);
  readonly title = input('');
  readonly size = input<'normal' | 'wide'>('normal');
  readonly busy = input(false);
  readonly closed = output<void>();

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.open()) this.requestClose();
  }

  protected requestClose(): void {
    if (!this.busy()) this.closed.emit();
  }
}
