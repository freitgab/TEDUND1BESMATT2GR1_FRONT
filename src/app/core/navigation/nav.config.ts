import { Perfil } from '../models/auth.models';

export interface NavLink {
  path: string;
  label: string;
  description: string;
  icon: string;
}

export interface NavSection {
  role: Perfil;
  title: string;
  links: NavLink[];
}

/** Fonte única do menu lateral e dos atalhos da página inicial. */
export const NAV_SECTIONS: NavSection[] = [
  {
    role: 'ADMINISTRADOR',
    title: 'Administrador',
    links: [
      { path: '/admin/ogm', label: 'Órgãos Gestores', description: 'Cadastro de OGMs e diretores-gerais', icon: '🏛️' },
      { path: '/admin/dmc', label: 'Distritos (DMC)', description: 'Distritos de monitoramento climático', icon: '🗺️' },
      { path: '/admin/redes', label: 'Redes de Monitoramento', description: 'Redes vinculadas aos distritos', icon: '📡' },
      { path: '/admin/usuarios', label: 'Técnicos e Perfis', description: 'Técnicos meteorologistas e acessos', icon: '👥' },
      { path: '/admin/auditoria', label: 'Logs de Auditoria', description: 'Monitoramento de ações no sistema', icon: '🧾' },
      { path: '/admin/relatorios', label: 'Relatórios', description: 'Relatórios gerenciais', icon: '📊' },
    ],
  },
  {
    role: 'COLABORADOR',
    title: 'Colaborador',
    links: [
      { path: '/colaborador/estacoes', label: 'Estações', description: 'Estações, sensores e softwares', icon: '🌡️' },
      { path: '/colaborador/solicitacoes-uso', label: 'Solicitações de Uso', description: 'Aprovar ou reprovar uso de estação', icon: '📅' },
      { path: '/colaborador/solicitacoes-instalacao', label: 'Solicitações de Instalação', description: 'Aprovar ou reprovar sensor/software', icon: '🛠️' },
      { path: '/colaborador/relatorios', label: 'Relatórios', description: 'Relatórios operacionais', icon: '📊' },
    ],
  },
  {
    role: 'USUARIO',
    title: 'Usuário',
    links: [
      { path: '/usuario/solicitar-uso', label: 'Solicitar Uso', description: 'Reserva e liberação de estação', icon: '🔬' },
      { path: '/usuario/solicitar-instalacao', label: 'Solicitar Instalação', description: 'Pedir sensor ou software', icon: '📥' },
      { path: '/usuario/relatorios', label: 'Relatórios', description: 'Minhas solicitações e resultados', icon: '📊' },
    ],
  },
];
