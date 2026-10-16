import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { PERFIL_LABELS, Perfil } from '../../core/models/auth.models';
import { NAV_SECTIONS } from '../../core/navigation/nav.config';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly sidebarOpen = signal(false);
  protected readonly sections = NAV_SECTIONS;
  protected readonly nome = computed(() => this.auth.session()?.nome ?? '');

  constructor() {
    // Fecha o menu off-canvas (mobile) ao navegar.
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.sidebarOpen.set(false));
  }

  protected perfilLabel(perfil: string): string {
    return PERFIL_LABELS[perfil as Perfil] ?? perfil;
  }

  protected perfilClass(perfil: string): string {
    return `badge badge--${perfil.toLowerCase()}`;
  }

  protected toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  protected logout(): void {
    this.auth.logout();
  }
}
