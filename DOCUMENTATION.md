# IT Trust Solutions — Documentação do Projeto

## 1. Visão Geral
Este repositório contém o código-fonte e as rotinas de automação do portal institucional da **IT Trust Solutions**, empresa especializada em consultoria de tecnologia, modernização em nuvem, cibersegurança e inteligência artificial. O site foi projetado com foco em alta conversão B2B, apresentando design moderno, carregamento ultrarrápido sem dependência de frameworks pesados e um assistente guiado de propostas (Wizard) de múltiplas etapas integrado ao Supabase.

---

## 2. Endereços Oficiais e Ambientes

| Serviço / Ambiente | Endereço / Identificador | Observações |
| :--- | :--- | :--- |
| **Repositório GitHub** | [https://github.com/LeandroDuarte28/it-trust-solutions-complete](https://github.com/LeandroDuarte28/it-trust-solutions-complete) | Repositório Público, branches `main` e `master` sincronizadas |
| **Site em Produção** | [https://www.ittrust.com.br](https://www.ittrust.com.br) | Domínio principal configurado na Vercel |
| **Deploy Canônico Vercel** | [https://it-trust-solutions-complete.vercel.app](https://it-trust-solutions-complete.vercel.app) | URL de contingência / preview Vercel |
| **Backend / Supabase REST** | `https://kcyxgolqpxyxalxoxvwp.supabase.co` | Instância PostgreSQL no Supabase Cloud |
| **Painel Supabase** | Login via GitHub (`tecnologia.duarte@gmail.com`) | Dashboard administrativo e SQL Editor |
| **Serviço de E-mail (Resend)** | `https://resend.com` | E-mails transacionais e monitoramento diário |

---

## 3. Arquitetura e Tecnologias
- **Frontend:** HTML5 semântico, CSS3 Moderno (Variáveis customizadas, Glassmorphism, Waves em SVG animado via CSS `@keyframes move-forever`), JavaScript Vanilla puro (zero runtime overhead).
- **Invalidação de Cache:** Parâmetro de versão em script (`app.js?v=20261021_0835`) para forçar atualização imediata nos navegadores dos clientes.
- **Backend & Banco de Dados:** Supabase (PostgreSQL), consumo via PostgREST direto com autenticação simultânea em cabeçalho (`apikey`, `Authorization`) e parâmetro de URL (`?apikey=...`), prevenindo bloqueios por adblockers ou proxies.
- **Automação Diária:**
  - Workflow GitHub Actions (`.github/workflows/daily-report.yml`) disparado diariamente às 08:00 BRT (11:00 UTC).
  - Script Node.js de checagem de saúde e envio com Resend (`send_report_now.js`).
  - Template de e-mail responsivo Mobile-First com cards individuais de propostas e badges de status (`email-preview.html`).

---

## 4. Estrutura do Banco de Dados (Supabase)
Tabela principal: `orcamentos`

- `id`: `uuid` (Primary Key, auto-gerado)
- `created_at`: `timestamptz` (Timestamp de envio)
- `empresa`: `text` (Nome da empresa)
- `cnpj`: `text` (CNPJ formatado)
- `contato`: `text` (Nome do responsável)
- `celular`: `text` (Telefone/WhatsApp de contato)
- `segmento`: `text` (Segmento de atuação da empresa)
- `problema`: `text` (Descrição detalhada do desafio de TI, mín. 100 caracteres)
- `funcionalidades`: `text` (Funcionalidades solicitadas)
- `regras`: `text` (Regras de negócio e requisitos)
- `tipo_solucao`: `text` (Lista de soluções marcadas no Wizard)
- `protocolo`: `text` (Identificador único de protocolo no formato `YYYYMM-XXXX`)
- `status`: `varchar(50)` (Status da proposta: `Pendente` ou `Respondido`)

*Para adicionar a coluna status formalmente no SQL Editor do Supabase:*
```sql
ALTER TABLE orcamentos ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pendente';
```

---

## 5. Equipe e Imagens Reais
Na seção "Nossos Profissionais", os avatares conceituais foram substituídos por fotos corporativas realistas de alta definição:
- **Sofia Mendonça** (Especialista em IA & Analytics): `assets/prof_ia_real.jpg`
- **Carlos Drummond** (Arquiteto Cloud & DevOps): `assets/prof_cloud_real.jpg`
- **Mariana Rios** (Líder em Cibersegurança & Governança): `assets/prof_security_real.jpg`

---

## 6. Histórico de Correções Críticas
1. **Deploy Vercel:** Repositório tornado público para compatibilidade com o plano Hobby da Vercel.
2. **Segurança de API Keys (Resend):** Chaves nunca são commitadas no Git (isoladas no `.env` e GitHub Secrets) para evitar revogação automática por scanners.
3. **E-mail Mobile-First:** Substituição de tabelas largas por cards verticais com badges empilháveis para legibilidade perfeita no celular.
4. **Erro "No API key found in request":** Refatoração da submissão do formulário no `app.js` para chamada REST direta com a `apikey` injetada na query string e headers, eliminação de script CDN legado e invalidação de cache.
