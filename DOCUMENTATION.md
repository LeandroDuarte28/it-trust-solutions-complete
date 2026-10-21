# IT Trust Solutions - Documentação do Projeto

## Visão Geral
Este projeto consiste no desenvolvimento de um site institucional completo para a empresa de consultoria de tecnologia **IT Trust Solutions**. O site apresenta um design moderno, focado em conversão e usabilidade, integrando um assistente de solicitação de proposta (Wizard) de múltiplas etapas conectado a um backend Supabase.

## Arquitetura e Tecnologias
- **Frontend:** HTML5 semântico, CSS3 (Vanilla com variáveis CSS e keyframes) e JavaScript (Vanilla).
- **Hospedagem e Backend / Banco de Dados:** Hospedado com integração no **Supabase** (PostgreSQL) para armazenamento das solicitações de proposta via Wizard e formulários de contato.
  - **Endpoint / URL do Banco:** `https://kcyxgolqpxyxalxoxvwp.supabase.co`
  - **Conta de Acesso (Dashboard Supabase):** Login via GitHub utilizando o e-mail `tecnologia.duarte@gmail.com`.
- **Design:** Responsivo (Mobile-First), paleta de cores centrada em tons de azul e efeitos dinâmicos de interface.
- **Ícones e Tipografia:** FontAwesome e Google Fonts (Inter).

## Funcionalidades Implementadas

### 1. Navegação e Hero Section
- Navbar fixa com efeito "glassmorphism" (desfoque e transparência), menus de ancoragem para rolagem suave.
- Menu responsivo estilo "hamburger" para dispositivos móveis.
- Seção Hero (Header) projetada para alto impacto visual, contendo:
  - Título principal com palavras em destaque (azul elétrico).
  - Subtítulo focado em valor (consultoria especializada).
  - Botões de Call to Action (CTA) diretos.
  - Indicadores estáticos/animados (Projetos entregues, Satisfação, Experiência).
  - **Novo:** Efeito dinâmico de ondas (Waves) em SVG implementado com animação infinita via CSS (`@keyframes`) na base da seção hero, inspirado no padrão de design Stitch.

### 2. Quem Somos (Empresa)
- Apresentação da missão, visão e valores através de cards interativos.
- Linha do tempo visual (Timeline) contando a trajetória desde 2015 até o momento atual com foco em RPA e IA.
- Seção de Liderança (Equipe) com cards exibindo foto e cargo dos diretores.

### 3. Nossas Soluções
- Grid responsivo de cards destacando os principais serviços.
- **Novo:** Adicionado o serviço de **"Soluções Personalizadas"** com foco no desenvolvimento sob medida para áreas específicas, complementando os serviços existentes (Sistemas Web, App Mobile, RPA e Cloud).
- Efeitos hover aprimorados que preenchem o fundo do cartão de baixo para cima ao interagir com o mouse.

### 4. Fale Conosco
- Informações de contato (Email, Telefone, Endereço).
- Links para redes sociais.
- Embed do Google Maps contendo o endereço da sede.
- Formulário de contato direto para envio de dúvidas rápidas.

### 5. Wizard de Proposta (Multi-step)
- Modal sobreposto à tela principal contendo 4 etapas claras:
  1. **Dados da Empresa:** Identificação, CNPJ e contato responsável.
  2. **Segmento e Necessidade:** Escolha do ramo de atuação e descrição textual mínima do problema.
  3. **Detalhes do Sistema:** Funcionalidades esperadas e regras de negócio.
  4. **Confirmação:** Tipo de plataforma desejada (Web, Mobile, RPA), necessidade de dashboards, aceite das informações e envio.
- Barra de progresso interativa calculada em tempo real.
- Integração funcional com o **Supabase** para salvar o payload completo.
- Geração automática de **Número de Protocolo** em tela de sucesso exclusiva, fornecendo ao usuário um recibo formal do seu pedido de proposta.

## Atualizações Recentes (Refatorações)
1. **Ondas Dinâmicas:** Implementação de SVGs escaláveis na classe `.waves-container` dentro do `.hero`. Animado usando a diretiva `animation: move-forever` em múltiplos elementos `<use>` para criar o efeito contínuo de ondas.
2. **Serviço Personalizado:** Inserção do card "Soluções Personalizadas" de forma harmônica na grade CSS da seção "Soluções".
3. **Correção de Erro e Nomenclatura:** Correção de um erro de persistência removendo o campo `dashboard` e `data_solicitacao`, adequação do campo `tipo_solucao` para string e atualização da nomenclatura de "Orçamento" para "Proposta" em todo o sistema.
5. **Fotos Humanizadas da Equipe:** Substituição dos avatares conceituais/futuristas por retratos corporativos realistas e modernos da equipe técnica (IA, Cloud e Segurança).
6. **Controle de Status nas Propostas:** Inclusão do campo `status` na tabela `orcamentos` (`Pendente` e `Respondido`), sendo gravado automaticamente como `'Pendente'` na submissão pelo site.
7. **Relatório Diário Automatizado (08:00 BRT):** Implementação da Edge Function `daily-status-report` (e cron via `pg_cron` / GitHub Actions) enviando para `tecnologia.duarte@gmail.com` a saúde dos serviços (Vercel, Supabase, Site) e o relatório analítico dos orçamentos pendentes.

## Configuração e Acesso ao Supabase
- **Hospedagem / Backend:** O site utiliza os serviços do **Supabase** como infraestrutura de banco de dados e backend.
- **URL da Instância / Banco:** `https://kcyxgolqpxyxalxoxvwp.supabase.co`
- **Conta de Acesso ao Dashboard:** Login realizado via GitHub com a conta associada ao e-mail `tecnologia.duarte@gmail.com`.
- **Tabela Principal:** `orcamentos` (armazena os dados do Wizard com campos: `empresa`, `cnpj`, `contato`, `celular`, `segmento`, `problema`, `funcionalidades`, `regras`, `tipo_solucao`, `protocolo`, `status` [Pendente|Respondido]).
- **Rotinas Diárias:**
  - Migração SQL: `supabase/migrations/20261020_add_status_and_cron.sql`
  - Edge Function: `supabase/functions/daily-status-report/index.ts`
  - GitHub Actions: `.github/workflows/daily-report.yml`

---
*Documentação atualizada em: Outubro de 2026*
