import { Routes } from '@angular/router';

import { guestGuard, roleGuard } from './core/guards/role.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

const placeholder = () =>
  import('./shared/module-placeholder/module-placeholder.component').then((m) => m.ModulePlaceholderComponent);

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    // Shell protegido: exige apenas autenticação; cada seção abaixo exige seus perfis.
    path: '',
    component: MainLayoutComponent,
    canActivate: [roleGuard],
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent) },
      {
        path: 'acesso-negado',
        loadComponent: () => import('./shared/forbidden/forbidden.component').then((m) => m.ForbiddenComponent),
      },

      {
        path: 'admin',
        canActivate: [roleGuard],
        data: { roles: ['ADMINISTRADOR'] },
        children: [
          { path: 'ogm', loadComponent: () => import('./features/admin/ogm/ogm-page.component').then((m) => m.OgmPageComponent) },
          { path: 'dmc', loadComponent: () => import('./features/admin/dmc/dmc-page.component').then((m) => m.DmcPageComponent) },
          { path: 'redes', loadComponent: () => import('./features/admin/rede/rede-page.component').then((m) => m.RedePageComponent) },
          { path: 'usuarios', loadComponent: () => import('./features/admin/tecnico/tecnico-page.component').then((m) => m.TecnicoPageComponent) },
          { path: 'auditoria', loadComponent: placeholder, data: { title: 'Logs de Auditoria', commit: 4 } },
          { path: 'relatorios', loadComponent: placeholder, data: { title: 'Relatórios do Administrador', commit: 4 } },
          { path: '', pathMatch: 'full', redirectTo: 'ogm' },
        ],
      },
      {
        path: 'colaborador',
        canActivate: [roleGuard],
        data: { roles: ['COLABORADOR'] },
        children: [
          {
            path: 'estacoes',
            loadComponent: () =>
              import('./features/colaborador/estacoes/estacoes-page.component').then(
                (m) => m.EstacoesPageComponent,
              ),
          },
          {
            path: 'solicitacoes-uso',
            loadComponent: () =>
              import('./features/colaborador/solicitacoes-uso/deliberacao-uso-page.component').then(
                (m) => m.DeliberacaoUsoPageComponent,
              ),
          },
          {
            path: 'solicitacoes-instalacao',
            loadComponent: () =>
              import(
                './features/colaborador/solicitacoes-instalacao/deliberacao-instalacao-page.component'
              ).then((m) => m.DeliberacaoInstalacaoPageComponent),
          },
          { path: 'relatorios', loadComponent: placeholder, data: { title: 'Relatórios do Colaborador', commit: 4 } },
          { path: '', pathMatch: 'full', redirectTo: 'estacoes' },
        ],
      },
      {
        path: 'usuario',
        canActivate: [roleGuard],
        data: { roles: ['USUARIO'] },
        children: [
          {
            path: 'solicitar-uso',
            loadComponent: () =>
              import('./features/usuario/solicitar-uso/solicitar-uso-page.component').then(
                (m) => m.SolicitarUsoPageComponent,
              ),
          },
          {
            path: 'solicitar-instalacao',
            loadComponent: () =>
              import(
                './features/usuario/solicitar-instalacao/solicitar-instalacao-page.component'
              ).then((m) => m.SolicitarInstalacaoPageComponent),
          },
          { path: 'relatorios', loadComponent: placeholder, data: { title: 'Relatórios do Usuário', commit: 4 } },
          { path: '', pathMatch: 'full', redirectTo: 'solicitar-uso' },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
