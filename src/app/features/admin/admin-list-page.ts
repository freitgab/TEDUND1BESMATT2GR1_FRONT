import { computed, inject, signal } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Observable } from 'rxjs';

import { apiErrorMessage } from '../../core/http/api-error';
import { StatusEntidade } from '../../core/models/admin.models';
import { ToastService } from '../../core/services/toast.service';

export type StatusFiltro = 'TODOS' | StatusEntidade;

/** Normaliza texto para busca (minúsculas, sem acentos). */
export function normalize(value: string | null | undefined): string {
  return (value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/** Converte string vazia em null (campos opcionais do contrato). */
export function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Estado comum das telas de listagem administrativas: carregamento, erro,
 * busca textual, filtro de status e ordenação (ativos primeiro).
 */
export abstract class AdminListPage<T extends { id: number; status: StatusEntidade }> {
  protected readonly toast = inject(ToastService);

  readonly items = signal<T[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly busca = signal('');
  readonly statusFiltro = signal<StatusFiltro>('TODOS');

  readonly filtrados = computed(() => {
    const termo = normalize(this.busca());
    const status = this.statusFiltro();
    return this.items()
      .filter((item) => status === 'TODOS' || item.status === status)
      .filter((item) => this.extraFilter(item))
      .filter((item) => !termo || normalize(this.searchText(item)).includes(termo))
      .sort((a, b) => (a.status === b.status ? this.sortKey(a).localeCompare(this.sortKey(b)) : a.status === 'ATIVO' ? -1 : 1));
  });

  readonly totalAtivos = computed(() => this.items().filter((i) => i.status === 'ATIVO').length);

  /** Carrega a lista principal (e, opcionalmente, dados auxiliares via `tap`). */
  protected abstract load(): Observable<T[]>;
  /** Texto concatenado usado pela busca. */
  protected abstract searchText(item: T): string;
  /** Chave de ordenação alfabética. */
  protected abstract sortKey(item: T): string;
  /** Filtro adicional da página (ex.: por OGM/DMC). */
  protected extraFilter(_item: T): boolean {
    return true;
  }

  reload(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.load().subscribe({
      next: (items) => {
        this.items.set(items ?? []);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.loadError.set(apiErrorMessage(error, 'Não foi possível carregar os registros.'));
      },
    });
  }

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  /** Campo inválido e já tocado pelo usuário (controla a exibição de mensagens). */
  protected invalid(control: AbstractControl | null | undefined): boolean {
    return !!control && control.invalid && (control.touched || control.dirty);
  }
}
