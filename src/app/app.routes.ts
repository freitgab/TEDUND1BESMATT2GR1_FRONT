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
          { path: 'ogm', loadComponent: placeholder, data: { title: 'Órgãos Gestores (OGM)', commit: 2 } },
          { path: 'dmc', loadComponent: placeholder, data: { title: 'Distritos de Monitoramento (DMC)', commit: 2 } },
          { path: 'redes', loadComponent: placeholder, data: { title: 'Redes de Monitoramento', commit: 2 } },
          { path: 'usuarios', loadComponent: placeholder, data: { title: 'Técnicos e Perfis', commit: 2 } },
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
          { path: 'estacoes', loadComponent: placeholder, data: { title: 'Estações, Sensores e Softwares', commit: 3 } },
          { path: 'solicitacoes-uso', loadComponent: placeholder, data: { title: 'Solicitações de Uso', commit: 3 } },
          { path: 'solicitacoes-instalacao', loadComponent: placeholder, data: { title: 'Solicitações de Instalação', commit: 3 } },
          { path: 'relatorios', loadComponent: placeholder, data: { title: 'Relatórios do Colaborador', commit: 4 } },
          { path: '', pathMatch: 'full', redirectTo: 'estacoes' },
        ],
      },
      {
        path: 'usuario',
        canActivate: [roleGuard],
        data: { roles: ['USUARIO'] },
        children: [
          { path: 'solicitar-uso', loadComponent: placeholder, data: { title: 'Solicitar Uso de Estação', commit: 3 } },
          { path: 'solicitar-instalacao', loadComponent: placeholder, data: { title: 'Solicitar Sensor/Software', commit: 3 } },
          { path: 'relatorios', loadComponent: placeholder, data: { title: 'Relatórios do Usuário', commit: 4 } },
          { path: '', pathMatch: 'full', redirectTo: 'solicitar-uso' },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
