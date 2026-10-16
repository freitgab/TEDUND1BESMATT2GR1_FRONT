# TEDUND1BESMATT2GR1_FRONT
Official repositotry for the official interface from ASW's prject, using Angular.

## Sistema de Controle e Monitoramento do Clima — Front-End

Interface Angular (standalone components, signals, Reactive Forms). Os usuários interagem **exclusivamente** por este
Front-End, que consome o Back-End Java/Spring (`TEDUND1BESMATT2GR1_BACK`, porta `8080`).

### Pré-requisitos
- Node.js 20.19+ / 22.12+ / 24+ (testado com Node 25) e npm
- Back-End em execução em `http://localhost:8080` (com PostgreSQL local ativo)

### Executar
```bash
npm install
npm start        # ng serve --proxy-config proxy.conf.json --port 4200
```
Acesse **http://localhost:4200** (a porta é fixa: o Back-End só aceita `Origin: http://localhost:4200`).

### Comunicação com o Back-End
- `proxy.conf.json` redireciona `/api` → `http://localhost:8080`.
- `core/interceptors/auth.interceptor.ts` injeta em toda chamada `/api`:
  - `X-Requested-By: Clima-Angular-SPA` (exigido pelo filtro de origem do Back-End);
  - `Authorization: Bearer <token>` quando há sessão;
  - em `401/403` encerra a sessão e redireciona para `/login`.

### Perfis (acumuláveis)
`ADMINISTRADOR`, `COLABORADOR`, `USUARIO`. O `roleGuard` (`core/guards/role.guard.ts`) lê `route.data['roles']` e libera
o acesso se o usuário tiver **pelo menos um** dos perfis exigidos. O menu lateral exibe as seções de todos os perfis do usuário.

### Usuários de teste (Dev Mode, senha `123456`)
| Usuário | E-mail | Perfis |
|---|---|---|
| Admin Multi-Perfil | `admin@clima.gov.br` | ADMINISTRADOR + COLABORADOR + USUARIO |
| Administrador | `gestor@clima.gov.br` | ADMINISTRADOR |
| Colaborador Técnico | `tecnico@clima.gov.br` | COLABORADOR |
| Usuário Pesquisador | `pesquisador@clima.gov.br` | USUARIO |

### Scripts
- `npm test` — testes unitários (Vitest)
- `npm run build` — build de produção

### Roteiro de commits do Front-End
1. Estrutura base, interceptor, guards multi-perfil, login e layout ✅
2. Gestão administrativa (OGM, DMC, Redes, Técnicos)
3. Painéis do Colaborador e Usuário (Estações, Reservas, Aprovação, Liberação)
4. Relatórios, Auditoria e ajustes de UI
