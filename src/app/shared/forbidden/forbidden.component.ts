import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="forbidden">
      <span class="forbidden__icon">⛔</span>
      <h1>Acesso negado</h1>
      <p>Seu perfil não possui permissão para acessar esta área.</p>
      <a class="btn btn--primary" routerLink="/">Voltar ao início</a>
    </section>
  `,
  styles: `
    .forbidden {
      max-width: 480px; margin: 3rem auto; padding: 2rem; text-align: center;
      background: var(--surface); border: 1px solid var(--border); border-radius: 14px;
    }
    .forbidden__icon { font-size: 2.5rem; }
    h1 { margin: 0.5rem 0; color: var(--danger); font-size: 1.3rem; }
    p { color: var(--muted); }
  `,
})
export class ForbiddenComponent {}
