import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  message: string;
}

const DURATION_MS: Record<ToastKind, number> = { success: 4000, info: 5000, error: 9000 };

/** Notificações globais exibidas pelo ToastContainerComponent (montado no layout principal). */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(message: string, title = 'Sucesso'): void {
    this.show('success', title, message);
  }

  error(message: string, title = 'Não foi possível concluir'): void {
    this.show('error', title, message);
  }

  info(message: string, title = 'Informação'): void {
    this.show('info', title, message);
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private show(kind: ToastKind, title: string, message: string): void {
    const id = this.nextId++;
    this._toasts.update((list) => [...list.slice(-4), { id, kind, title, message }]);
    setTimeout(() => this.dismiss(id), DURATION_MS[kind]);
  }
}
