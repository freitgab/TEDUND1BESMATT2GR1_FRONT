import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';

/**
 * Tela provisória dos módulos que serão entregues nos próximos commits.
 * Cada rota informa `data: { title, commit }`; ao implementar o módulo basta
 * trocar o `loadComponent` da rota em app.routes.ts.
 */
@Component({
  selector: 'app-module-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="placeholder">
      <span class="placeholder__icon">🚧</span>
      <h1>{{ data()['title'] }}</h1>
      <p>Este módulo será entregue no <strong>Commit {{ data()['commit'] }}</strong> do Front-End.</p>
    </section>
  `,
  styles: `
    .placeholder {
      max-width: 520px; margin: 3rem auto; padding: 2rem; text-align: center;
      background: var(--surface); border: 1px dashed var(--border); border-radius: 14px;
    }
    .placeholder__icon { font-size: 2.5rem; }
    h1 { margin: 0.5rem 0; color: var(--primary-dark); font-size: 1.3rem; }
    p { margin: 0; color: var(--muted); }
  `,
})
export class ModulePlaceholderComponent {
  protected readonly data = toSignal(inject(ActivatedRoute).data, { initialValue: {} as Record<string, unknown> });
}
