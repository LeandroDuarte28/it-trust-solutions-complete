# IT Trust Solutions — Documentação Geral do Projeto

> [!NOTE]
> Este documento consolida todo o desenvolvimento, configuração de infraestrutura, arquitetura técnica, credenciais públicas, histórico de incidentes e rotinas de operação do portal da **IT Trust Solutions**.

---

## 1. Identificação do Projeto

| Atributo | Descrição |
| :--- | :--- |
| **Empresa** | **IT Trust Solutions** |
| **Segmento** | Consultoria Estratégica de Tecnologia, Desenvolvimento de Software, Cloud & Inteligência Artificial |
| **Objetivo do Site** | Portal institucional corporativo de alta conversão para captação de clientes B2B, apresentação de serviços, equipe técnica especializada e assistente guiado de propostas (Wizard) com persistência em banco e protocolos rastreáveis |
| **Público-Alvo** | Diretores de TI (CTOs/CIOs), gestores de inovação e empresas em busca de transformação digital, automação inteligente e modernização em nuvem |

---

## 2. Ambientes, Repositórios e Serviços (URLs Oficiais)

### 2.1 Repositório de Código-Fonte (GitHub)
- **URL do Repositório:** [https://github.com/LeandroDuarte28/it-trust-solutions-complete](https://github.com/LeandroDuarte28/it-trust-solutions-complete)
- **Visibilidade:** Pública (*Public*)
- **Branches de Produção:**
  - `main` (Branch principal de desenvolvimento e integração contínua)
  - `master` (Branch sincronizada para compatibilidade com pipelines legados)
- **CI/CD Integrado:** GitHub Actions (`.github/workflows/daily-report.yml`) para rotina de health check e relatório matinal às 08:00 BRT.

### 2.2 Hospedagem e CDN (Vercel)
- **Domínio Principal de Produção:** [https://www.ittrust.com.br](https://www.ittrust.com.br)
- **URL Canônica da Vercel:** [https://it-trust-solutions-complete.vercel.app](https://it-trust-solutions-complete.vercel.app)
- **Tipo de Projeto:** Static Web Application (HTML5 / Vanilla CSS / Vanilla JS)
- **Regras de Cache:** `Cache-Control: public, max-age=0, must-revalidate`
- **Estratégia de Invalidação de Cache:** Parâmetro de versão em script (`app.js?v=20261021_0835`)

### 2.3 Banco de Dados e Backend (Supabase)
- **URL da Instância / Endpoint REST:** `https://kcyxgolqpxyxalxoxvwp.supabase.co`
- **Dashboard Administrativo:** Acesso via GitHub vinculado a `tecnologia.duarte@gmail.com`
- **Chave Pública Anon (JWT):**
  ```text
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjeXhnb2xxcHh5eGFseG94dndwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyOTMwMjQsImV4cCI6MjA5Mzg2OTAyNH0.aiSoFiffjrx2WOW-7D6cpPxwmW1iVW-sNLY5wxkkH1E
  ```
- **Tabela Principal:** `orcamentos`
  - `id`: UUID (Primary Key, auto-gerado)
  - `created_at`: TIMESTAMPTZ (Data/hora de envio)
  - `empresa`: TEXT (Nome da empresa proponente)
  - `cnpj`: TEXT (CNPJ formatado)
  - `contato`: TEXT (Nome do responsável)
  - `celular`: TEXT (Telefone/WhatsApp com máscara)
  - `segmento`: TEXT (Ramo de atuação)
  - `problema`: TEXT (Descrição detalhada do desafio de negócio)
  - `funcionalidades`: TEXT (Funcionalidades prioritárias)
  - `regras`: TEXT (Regras de negócio e restrições)
  - `tipo_solucao`: TEXT (Categorias selecionadas: Web, Mobile, Cloud, IA, etc.)
  - `protocolo`: TEXT (Código único de rastreio, formato `YYYYMM-XXXX`)
  - `status`: VARCHAR(50) (*Pendente* / *Respondido* — via migration SQL com default `Pendente`)

### 2.4 Serviço Transacional de E-mail (Resend)
- **Provedor:** Resend ([https://resend.com](https://resend.com))
- **Destinatário dos Relatórios:** `tecnologia.duarte@gmail.com`
- **Remetente Configurado:** `IT Trust Solutions <onboarding@resend.dev>`
- **Armazenamento de Credenciais:**
  - Localmente: `.env` (`RESEND_API_KEY=...`) — *ignorado pelo Git*
  - Produção/GitHub Actions: GitHub Secret `RESEND_API_KEY`

### 2.5 Monitoramento e Métricas de Tráfego (Google Analytics 4)
- **ID de Medição (Measurement ID):** `G-KWF2NR89KL`
- **Tecnologia:** Google Tag (`gtag.js` via Google Tag Manager)
- **Posicionamento:** Injetado diretamente logo após a abertura do `<head>` no `index.html`
- **Finalidade:** Rastreamento em tempo real de visitantes, tráfego corporativo, engajamento com as soluções e conversões do Wizard de orçamentos.

---

## 3. Diagrama de Arquitetura do Sistema

```mermaid
graph TD
    User["Visitante / Cliente Corporativo"] -->|Acessa www.ittrust.com.br| Vercel["Vercel CDN Edge"]
    Vercel -->|Serve HTML5 / CSS3 / JS| Browser["Navegador do Usuário"]
    Browser -->|Dispara Telemetria & Eventos| GA["Google Analytics 4 (G-KWF2NR89KL)"]
    
    subgraph Frontend ["Frontend Estático"]
        Browser -->|Preenche 4 Passos| Wizard["Wizard de Propostas"]
        Wizard -->|Gera Protocolo YYYYMM-XXXX| ProtocolGen["Gerador de Protocolo"]
        Wizard -->|POST REST Direto com apikey| RESTClient["PostgREST Fetch Client"]
    end
    
    subgraph Backend ["Backend & Persistência (Supabase)"]
        RESTClient -->|Headers + Query Param| SupabaseREST["PostgREST API Gateway"]
        SupabaseREST -->|INSERT Row| TableOrcamentos[("Tabela orcamentos")]
    end

    subgraph Observabilidade ["Monitoramento & Alertas Diários"]
        GHAction["GitHub Actions (08:00 BRT)"] -->|Executa send_report_now.js| Runner["Node.js Runner"]
        Runner -->|Checa Status 200 OK| Vercel
        Runner -->|Checa Status 200 OK| TableOrcamentos
        Runner -->|Dispara Resumo HTML Responsivo| ResendAPI["Resend API"]
        ResendAPI -->|Entrega E-mail com KPIs| AdminMail["tecnologia.duarte@gmail.com"]
    end
```

---

## 4. Componentes e Design System

### 4.1 Identidade Visual & UI
- **Tipografia:** Família `Inter` (Google Fonts), com pesos variando de 300 a 800.
- **Paleta de Cores:**
  - Azul Corporativo Profundo: `#0f172a` (Navy) e `#1e293b` (Slate Dark)
  - Azul Elétrico (Destaque & CTA): `#2563eb` e `#3b82f6`
  - Sucesso: `#10b981` (Emerald Green)
  - Fundo Neutro: `#f8fafc` / `#ffffff`
- **Efeito Dinâmico de Ondas (Waves):** Efeito contínuo em SVG com múltiplas camadas animadas via CSS keyframes (`@keyframes move-forever`) na base da Hero Section.
- **Glassmorphism:** Navbar fixa translúcida com `backdrop-filter: blur(12px)` e bordas sutis.

### 4.2 Retratos Oficiais da Equipe Técnica
Substituição dos antigos avatares conceituais por retratos corporativos realistas e humanizados em `assets/`:

| Profissional | Cargo / Especialidade | Arquivo |
| :--- | :--- | :--- |
| **Sofia Mendonça** | Especialista em IA & Analytics | `assets/prof_ia_real.jpg` |
| **Carlos Drummond** | Arquiteto Cloud & DevOps | `assets/prof_cloud_real.jpg` |
| **Mariana Rios** | Líder em Cibersegurança & Governança | `assets/prof_security_real.jpg` |

### 4.3 Wizard de Proposta em 4 Etapas
Localizado no modal interativo com barra de progresso em tempo real:
1. **Etapa 1 — Dados Corporativos:** Empresa, CNPJ (com máscara `00.000.000/0000-00`), Contato Responsável, Celular (com máscara `(00) 00000-0000`) e Segmento de Mercado.
2. **Etapa 2 — Diagnóstico do Desafio:** Descrição textual com contador dinâmico de caracteres (mínimo de 100 caracteres exigidos para garantir qualificação do lead).
3. **Etapa 3 — Escopo Técnico:** Seleção de tipos de soluções (Web, Mobile, Cloud, Inteligência Artificial, etc.), funcionalidades chave e regras de negócio.
4. **Etapa 4 — Revisão e Confirmação:** Espelho resumo dos dados preenchidos, aceite dos termos e botão de submissão com proteção contra duplo envio.
5. **Tela de Sucesso:** Exibição com destaque do número de protocolo formatado para impressão ou arquivamento pelo cliente.

---

## 5. Histórico de Incidentes, Soluções e Boas Práticas

### Incidente 1: Bloqueio de Deploy na Vercel (Hobby Plan)
- **Sintoma:** *Deployment Blocked: The deployment was blocked because the commit author did not have contributing access to the project on Vercel. The Hobby Plan does not support collaboration for private repositories.*
- **Causa Raiz:** O plano gratuito (Hobby) da Vercel suporta perfeitamente repositórios **privados**, porém bloqueia deploys se o autor dos commits (`user.email` do git) não corresponder ao e-mail cadastrado e verificado na conta do GitHub vinculada à Vercel. Nesses casos, a Vercel interpreta erroneamente o commit como vindo de um "colaborador externo", exigindo upgrade para o plano Pro ($20/mês).
- **Solução Definitiva (100% Gratuita e Privada):**
  1. Adicionar o e-mail utilizado nos commits locais (`tecnologia.duarte@gmail.com`) na lista de e-mails verificados da conta do GitHub (**Settings > Emails**) OU alinhar o `user.email` do git local com o e-mail GitHub (`82515067+LeandroDuarte28@users.noreply.github.com`).
  2. Manter o repositório como **Privado** (*Private*) com total sigilo do código-fonte.
  3. O Vercel Hobby reconhece o commit como pertencente ao proprietário da conta e realiza o build/deploy automático sem qualquer custo.

### Incidente 2: Revogação Automática da Chave Resend
- **Sintoma:** E-mails falhavam com status 401 (*API Key revoked*).
- **Causa Raiz:** O Resend possui bots sentinelas no GitHub que escaneiam commits públicos. Quando uma chave contendo `re_...` é detectada em qualquer commit, o Resend a invalida preventivamente em segundos.
- **Solução Definitiva:**
  1. Criação de nova chave no Resend (`re_***` mantida em sigilo).
  2. Isolamento estrito da chave no arquivo `.env`, garantindo sua inclusão no `.gitignore`.
  3. Atualização do script `send_report_now.js` para ler exclusivamente via `process.env.RESEND_API_KEY` ou carregamento do `.env` local.
  4. Remoção de qualquer fallback hardcoded no workflow `.github/workflows/daily-report.yml`.

### Incidente 3: Falta de Responsividade do E-mail em Telas Pequenas
- **Sintoma:** O e-mail de monitoramento quebrava a tabela de propostas em smartphones, truncando dados.
- **Solução Definitiva:**
  - Redesenho completo do template `email-preview.html` para o paradigma **Mobile-First**.
  - As propostas deixaram de ser tabelas rígidas e passaram a ser **Cards Individuais**, com badges coloridos de status (`Pendente` em amarelo/âmbar e `Respondido` em verde).
  - KPIs de saúde dos serviços (Vercel, Supabase, Site) empilhados verticalmente em telas menores que 480px.

### Incidente 4: Erro "No API key found in request" na Confirmação de Orçamento
- **Sintoma:** `{"hint":"No 'apikey' request header or url param was found.","message":"No API key found in request"}` ao submeter proposta pelo site.
- **Causa Raiz:**
  1. A branch `master` no GitHub estava desatualizada em relação à `main`.
  2. O navegador mantinha o `app.js` em cache permanente de disco.
  3. O script da CDN `@supabase/supabase-js@2` fazia chamadas que dependiam exclusivamente de headers que podiam ser filtrados por extensões de privacidade/adblockers do usuário.
  4. A coluna `status` não existia fisicamente na tabela `orcamentos` do Supabase, gerando falha PostgREST `PGRST204`.
- **Solução Definitiva:**
  1. Implementação de chamada REST nativa com autenticação dupla: `?apikey=${SUPABASE_KEY}` na URL e nos headers `apikey` e `Authorization: Bearer`.
  2. Invalidação forçada de cache adicionando `app.js?v=20261021_0835` no `index.html`.
  3. Remoção do campo `status` do payload frontend para sincronizar perfeitamente com as colunas ativas do PostgreSQL (o status agora assume o `DEFAULT 'Pendente'` automaticamente pelo banco).
  4. Sincronização obrigatória de ambas as branches (`git push origin main && git push origin main:master`).

### Incidente 5: Falha no Disparo Automático do Relatório Diário no GitHub Actions
- **Sintoma:** O e-mail automático das 08:00 com o status e propostas em aberto não foi recebido.
- **Causa Raiz:**
  1. Caminho de gravação de arquivo fixado com sintaxe Windows (`c:/Projetos/.../email-preview.html`) em `send_report_now.js`, causando falha fatal `ENOENT` no ambiente Linux do runner do GitHub Actions (`ubuntu-latest`).
  2. A secret `RESEND_API_KEY` não estava provisionada nas configurações de Secrets do repositório no GitHub.
- **Solução Definitiva:**
  1. Substituição de caminhos absolutos locais por caminhos portáveis `path.join(__dirname, 'email-preview.html')` com tratamento seguro de exceções em bloco `try/catch`.
  2. Adição de validação explícita no início da rotina Node.js para checar a presença da `RESEND_API_KEY`.
  3. Provisionamento da secret `RESEND_API_KEY` diretamente nos Secrets de Actions do repositório no GitHub via API criptografada com libsodium.
  4. Atualização da action para Node.js 22 LTS.

---

## 6. Mapeamento de Arquivos do Projeto

```text
ITTrustSolutions/
├── .github/
│   └── workflows/
│       └── daily-report.yml      # Automação do envio diário de status às 08:00 BRT
├── assets/
│   ├── logo.png                  # Identidade visual da IT Trust Solutions
│   ├── prof_ia_real.jpg          # Retrato realista da Especialista em IA
│   ├── prof_cloud_real.jpg       # Retrato realista do Arquiteto Cloud
│   └── prof_security_real.jpg    # Retrato realista da Líder em Segurança
├── supabase/
│   ├── functions/
│   │   └── daily-status-report/
│   │       └── index.ts          # Edge Function Deno para envio de relatório
│   └── migrations/
│       └── 20261020_add_status_and_cron.sql # DDL para coluna status e pg_cron
├── .env                          # Variáveis sensíveis locais (IGNORADO NO GIT)
├── .gitignore                    # Regras de exclusão do Git (.env, node_modules)
├── app.js                        # Lógica interativa do site, máscaras e envio Supabase
├── index.html                    # Estrutura HTML5 semântica principal
├── style.css                     # Design System, Waves SVG, responsividade e temas
├── README.md                     # Documentação oficial do repositório no GitHub
├── DOCUMENTATION.md              # Documentação técnica detalhada
├── email-preview.html            # Template estático do e-mail mobile-first
├── generate_preview.js           # Gerador de pré-visualização do e-mail
├── send_report_now.js            # Script Node.js de teste e execução do relatório
└── wrangler.jsonc                # Configuração para deploys opcionais no Cloudflare
```

---

## 7. Guia Rápido de Operação e Manutenção

### 7.1 Como Testar o Envio do Relatório Manualmente
Para testar o disparo do e-mail de monitoramento direto pelo terminal local:
```bash
node send_report_now.js
```
O script testará a disponibilidade do Site, da Vercel e do Supabase, listará as propostas abertas e disparará o e-mail responsivo para `tecnologia.duarte@gmail.com`.

### 7.2 Como Configurar a Secret no GitHub Actions
Para que o disparo diário automatizado das 08:00 funcione pelo GitHub Actions:
1. Acesse o repositório no GitHub: `Settings` > `Secrets and variables` > `Actions`.
2. Clique em **New repository secret**.
3. **Nome:** `RESEND_API_KEY`
4. **Valor:** Cole a chave da API do Resend gerada no painel (armazenada no seu arquivo `.env` local)
5. Salve a secret.

### 7.3 Como Criar Fisicamente a Coluna `status` no Supabase
Caso deseje atualizar a estrutura relacional do Supabase para que a coluna `status` apareça formalmente no Table Editor:
1. Acesse o painel do Supabase ([https://supabase.com/dashboard](https://supabase.com/dashboard)).
2. Navegue até o **SQL Editor** do projeto `kcyxgolqpxyxalxoxvwp`.
3. Execute o comando SQL:
   ```sql
   ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pendente';
   ```

### 7.4 Como Realizar Deploys com Sincronização Completa
Sempre que fizer alterações no código do site, utilize o comando duplo de push para atualizar simultaneamente as branches `main` e `master`, garantindo que a Vercel sempre compile a última versão:
```bash
git add .
git commit -m "feat/fix: descricao da melhoria"
git push origin main && git push origin main:master
```
