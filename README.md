# TEDUND1BESMATT2GR1_FRONT
Official repositotry for the official interface from ASW's prject, using Angular.

## Sistema de Controle e Monitoramento do Clima — Front-End

Interface Angular (standalone components, signals, Reactive Forms). Os usuários interagem **exclusivamente** por este
Front-End, que consome o Back-End Java/Spring (`TEDUND1BESMATT2GR1_BACK`, padrão na porta `8081`).

---

### Ordem Obrigatória de Inicialização do Ambiente

Para que as tabelas sejam criadas, os dados de teste (seeder) sejam inseridos e o Front-End consiga autenticar sem erros, execute os passos na ordem abaixo:

#### 1. Banco de Dados PostgreSQL
- Certifique-se de que o serviço do PostgreSQL está em execução na sua máquina.
- Crie o banco de dados da aplicação caso ainda não exista (no pgAdmin ou psql):
  ```sql
  CREATE DATABASE clima;
  -- ou CREATE DATABASE clima_db; conforme configurado no seu application.properties
  ```

#### 2. Back-End Spring Boot (`TEDUND1BESMATT2GR1_BACK`)
- Verifique o arquivo `src/main/resources/application.properties`:
  - **Porta da API (`server.port`):** Configurada para `8081` (evitando conflito com a porta `8080` comumente ocupada por processos locais como Apache/XAMPP).
  - **Conexão PostgreSQL (`spring.datasource.*`):** Ajuste a porta (5432 ou 5436), nome do banco e sua senha local.
- **Compilação e execução:**
  ```powershell
  # 1. Limpe compilações anteriores para evitar ClassFormatError em bytecodes corrompidos:
  mvn clean compile

  # 2. Inicie o Back-End (ele aplicará o schema JPA e executará o AuthDataSeeder / ScenarioDataSeeder):
  mvn spring-boot:run
  ```
- Aguarde a mensagem `Started ClimaApplication` no terminal do Spring antes de subir o Front-End.

#### 3. Front-End Angular (`TEDUND1BESMATT2GR1_FRONT`)
- Verifique se o arquivo `proxy.conf.json` aponta para a porta correta do Back-End (`http://localhost:8081`).
- Execute no terminal do Front-End:
  ```powershell
  npm install
  npm start        # Inicia com --proxy-config proxy.conf.json --port 4200
  ```
- Acesse **http://localhost:4200** no navegador (a porta `4200` é obrigatória: o filtro do Back-End valida `Origin: http://localhost:4200`).

---

### Comunicação com o Back-End e Segurança (RNF005)
- `proxy.conf.json` redireciona `/api` → `http://localhost:8081`.
- `core/interceptors/auth.interceptor.ts` injeta em toda chamada `/api`:
  - `X-Requested-By: Clima-Angular-SPA` (comprova origem exclusiva da SPA Angular);
  - `Authorization: Bearer <token>` quando há sessão ativa;
  - em respostas `401/403`, encerra a sessão e redireciona para `/login`.

---

### Perfis (acumuláveis)
`ADMINISTRADOR`, `COLABORADOR`, `USUARIO`. O `roleGuard` (`core/guards/role.guard.ts`) lê `route.data['roles']` e libera
o acesso se o usuário tiver **pelo menos um** dos perfis exigidos. O menu lateral adapta-se exibindo todas as seções liberadas para os perfis acumulados.

### Usuários de teste pré-carregados (Dev Mode, senha `123456`)
| Usuário | E-mail | Perfis |
|---|---|---|
| Admin Multi-Perfil | `admin@clima.gov.br` | ADMINISTRADOR + COLABORADOR + USUARIO |
| Administrador | `gestor@clima.gov.br` | ADMINISTRADOR |
| Colaborador Técnico | `tecnico@clima.gov.br` | COLABORADOR |
| Usuário Pesquisador | `pesquisador@clima.gov.br` | USUARIO |

---

### Funcionalidades Implementadas

#### Commit 1: Fundação, Autenticação e Segurança
- `AuthInterceptor` (injeção de headers de segurança e guarda de origem).
- `AuthService` com reatividade via Signals e persistência no `localStorage`.
- `roleGuard` multi-perfil e `guestGuard`.
- Tela de login com detecção de erros de API e painel Dev Mode para login rápido.
- Layout responsivo com menu lateral dinâmico.

#### Commit 2: Gestão Administrativa, Seletores e Regras de Negócio
- **Órgãos Gestores (OGM):** Listagem filtrável, cadastro/edição com seletor de Diretor-Geral (regra de 1 diretor por OGM) e gerenciamento dinâmico de Coordenadorias/Setores via `FormArray`. Inativação lógica com verificação de DMCs filhos.
- **Distritos Climáticos (DMC):** Listagem com OGM pai, cadastro com seletor dinâmico de OGMs ativos, atribuição de Meteorologista-Chefe (regra de 1 chefe por DMC) e inativação lógica com checagem de redes/técnicos subordinados.
- **Redes de Monitoramento:** Associação obrigatória a um DMC ativo, descrição e seleção múltipla de tipos de monitoramento (Temperatura, Umidade, Chuva/Precipitação, Vento, Pressão, Radar).
- **Técnicos Meteorologistas:** Cadastro com vínculo obrigatório a um DMC ativo, criação automática de conta de usuário associada e modal estrito de **justificativa obrigatória de inativação** (mínimo de 10 caracteres) gravada no histórico (RN008).
- **Feedback ao Usuário:** Notificações flutuantes (`ToastService`) para sucessos e tratamento refinado de mensagens de erro emitidas pelo Back-End (GlobalExceptionHandler).

#### Commit 3: Painéis do Colaborador e Usuário (Estações, Reserva de Uso, Aprovação e Liberação)
- **Services Operacionais:** `EstacaoService` (`/api/estacoes`), `SolicitacaoUsoService` (`/api/solicitacoes-uso`) e `SolicitacaoInstalacaoService` (`/api/solicitacoes-instalacao`) consumidos via `HttpClient` e protegidos pelo `AuthInterceptor`.
- **Gestão de Estações Meteorológicas (`/colaborador/estacoes`):** Listagem com badges visuais de status (`DISPONIVEL` verde, `INDISPONIVEL` amarelo/laranja, `INATIVO` cinza), inativação lógica para manutenção/calibração/avaria e formulário reativo de cadastro/edição com **renderização condicional obrigatória** de Sensores Disponíveis (`TEMPERATURA`, `UMIDADE`, `PRESSAO`, `VENTO`, `PLUVIOMETRO`) e Softwares de Coleta/Transmissão (`FormArray` com licença `PROPRIETARIO` ou `SOFTWARE_LIVRE`, URL, objetivo e variáveis monitoradas) quando o tipo selecionado é `AUTOMATICA` ou `RADAR_METEOROLOGICO`.
- **Deliberação de Solicitações de Uso (`/colaborador/solicitacoes-uso`):** Aprovação com exibição clara de mensagens de conflito de horário ou indisponibilidade retornadas pelo Back-End (`PATCH /api/solicitacoes-uso/{id}/aprovar`) e reprovação mediante modal com preenchimento obrigatório da justificativa (`PATCH /api/solicitacoes-uso/{id}/reprovar`).
- **Deliberação de Instalação de Sensor/Software (`/colaborador/solicitacoes-instalacao`):** Avaliação dos pedidos enviados pelos usuários com aprovação direta ou reprovação com justificativa obrigatória em modal.
- **Minhas Solicitações de Uso e Liberação (`/usuario/solicitar-uso`):** Cadastro e edição de solicitações individuais (1 estação por pedido, destacando estações `DISPONIVEL`), inativação enquanto `PENDENTE` e botão de destaque **"Confirmar Liberação da Estação"** (`PATCH /api/solicitacoes-uso/{id}/liberar`) quando `APROVADA`, retornando a estação ao status `DISPONIVEL`.
- **Minhas Solicitações de Instalação (`/usuario/solicitar-instalacao`):** Formulário e listagem de pedidos de instalação de sensores/softwares (`PROPRIETARIO` ou `SOFTWARE_LIVRE`) com edição e inativação enquanto `PENDENTE`.

---

### Scripts do Projeto
- `npm start` — inicia o servidor de desenvolvimento com proxy para a porta 8081
- `npm test` — testes unitários (Vitest)
- `npm run build` — build de produção otimizado

### Roteiro de Commits do Front-End
1. `feat: estrutura base Angular, AuthGuard multi-perfil, HttpInterceptor e tela de Login` ✅
2. `feat: telas de gestão administrativa (OGM, DMC, Redes e Técnicos)` ✅
3. `feat: painéis do Colaborador e Usuário (Estações, Reserva de Uso, Aprovação e Liberação)` ✅
4. `feat: componentes visuais de Relatórios, visualização de Auditoria e ajustes de UI`
