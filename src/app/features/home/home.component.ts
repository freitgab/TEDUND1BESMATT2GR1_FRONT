import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { NAV_SECTIONS } from '../../core/navigation/nav.config';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Olá, {{ auth.session()?.nome }}!</h1>
    <p class="muted">Selecione um módulo abaixo ou use o menu lateral.</p>

    @for (section of sections; track section.role) {
      @if (auth.hasRole(section.role)) {
        <h2 class="section-title">{{ section.title }}</h2>
        <div class="cards">
          @for (link of section.links; track link.path) {
            <a class="card" [routerLink]="link.path">
              <span class="card__icon">{{ link.icon }}</span>
              <strong>{{ link.label }}</strong>
              <small>{{ link.description }}</small>
            </a>
          }
        </div>
      }
    }
  `,
  styles: `
    .muted { color: var(--muted); margin-top: 0; }
    .section-title { margin: 1.5rem 0 0.6rem; font-size: 1rem; color: var(--primary-dark); }
    .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; }
    .card {
      display: flex; flex-direction: column; gap: 0.25rem; padding: 1rem;
      background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
      color: var(--text); text-decoration: none; transition: box-shadow 0.15s, transform 0.15s;
    }
    .card:hover { box-shadow: 0 6px 18px rgba(25, 55, 109, 0.12); transform: translateY(-2px); }
    .card__icon { font-size: 1.6rem; }
    .card small { color: var(--muted); }
  `,
})
export class HomeComponent {
  protected readonly auth = inject(AuthService);
  protected readonly sections = NAV_SECTIONS;
}
