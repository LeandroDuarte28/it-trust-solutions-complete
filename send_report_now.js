const fs = require('fs');
const path = require('path');

// Carregar variáveis do .env local (ignorado pelo Git)
if (fs.existsSync(path.join(__dirname, '.env'))) {
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  for (const line of envContent.split('\n')) {
    const [key, ...vals] = line.trim().split('=');
    if (key && vals.length > 0) {
      process.env[key] = vals.join('=');
    }
  }
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RECIPIENT_EMAIL = 'tecnologia.duarte@gmail.com';
const SUPABASE_URL = 'https://kcyxgolqpxyxalxoxvwp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjeXhnb2xxcHh5eGFseG94dndwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyOTMwMjQsImV4cCI6MjA5Mzg2OTAyNH0.aiSoFiffjrx2WOW-7D6cpPxwmW1iVW-sNLY5wxkkH1E';

async function checkUrl(url, name) {
  const start = Date.now();
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    return { name, url, online: res.ok, status: `${res.status} ${res.statusText}`, latency: `${Date.now() - start}ms` };
  } catch (err) {
    return { name, url, online: false, status: err.message || 'Offline', latency: '-' };
  }
}

async function sendEmail() {
  console.log('Checando status dos serviços para o relatório responsivo...');

  const siteCheck = await checkUrl('https://www.ittrust.com.br', 'Site Institucional');
  const vercelCheck = await checkUrl('https://it-trust-solutions-complete.vercel.app', 'Vercel Deployment');
  
  const sbStart = Date.now();
  let supabaseCheck = { name: 'Supabase (Banco de Dados)', url: 'Postgres Cloud', online: false, status: 'Desconhecido', latency: '-' };
  let rows = [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orcamentos?select=*`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
    });
    rows = await res.json();
    supabaseCheck.online = true;
    supabaseCheck.status = '200 OK';
    supabaseCheck.latency = `${Date.now() - sbStart}ms`;
  } catch (err) {
    supabaseCheck.status = err.message;
  }

  const total = rows.length;
  const pendentes = rows.filter(r => (r.status || 'Pendente') === 'Pendente');
  const respondidos = rows.filter(r => r.status === 'Respondido');

  // Montagem responsiva em cards para cada proposta aberta
  const cardsHtml = pendentes.map(p => `
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
      <div style="margin-bottom: 8px;">
        <span style="font-weight: 700; color: #2563eb; font-size: 13px; background: #eff6ff; padding: 3px 8px; border-radius: 6px; display: inline-block; margin-right: 6px; margin-bottom: 4px;">#${p.protocolo || '-'}</span>
        <span style="background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; display: inline-block; margin-right: 6px; margin-bottom: 4px;">${p.segmento || 'Geral'}</span>
        <span style="background: #fef3c7; color: #b45309; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; display: inline-block; margin-bottom: 4px;">PENDENTE</span>
      </div>
      <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">${p.empresa || 'Empresa não informada'}</div>
      <div style="font-size: 13px; color: #64748b; margin-bottom: 10px;">
        👤 <strong>${p.contato || 'Contato'}</strong> &nbsp;•&nbsp; 📱 <a href="tel:${p.celular || ''}" style="color: #2563eb; text-decoration: none;">${p.celular || '-'}</a>
      </div>
      <div style="background: #f8fafc; border-left: 3px solid #2563eb; padding: 10px 12px; border-radius: 4px; font-size: 13px; color: #334155; line-height: 1.5; word-break: break-word;">
        <div style="font-weight: 600; color: #475569; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Descrição da Necessidade:</div>
        ${p.problema || 'Nenhum detalhe informado'}
      </div>
    </div>
  `).join('');

  const servicesHtml = [siteCheck, vercelCheck, supabaseCheck].map(srv => `
    <div style="padding: 12px 14px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <td style="vertical-align: middle;">
            <div style="color: #0f172a; font-size: 14px; font-weight: 700;">${srv.name}</div>
            <div style="font-size: 12px; color: #64748b; word-break: break-all;">${srv.url}</div>
          </td>
          <td style="vertical-align: middle; text-align: right; white-space: nowrap; padding-left: 10px;">
            <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: ${srv.online ? '#dcfce7' : '#fee2e2'}; color: ${srv.online ? '#15803d' : '#b91c1c'};">
              ${srv.online ? '● ONLINE' : '● OFFLINE'}
            </span>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${srv.latency}</div>
          </td>
        </tr>
      </table>
    </div>
  `).join('');

  const html = `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <title>Status Diário - IT Trust Solutions</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #f1f5f9;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        -webkit-text-size-adjust: 100%;
      }
      .wrapper {
        width: 100%;
        table-layout: fixed;
        background-color: #f1f5f9;
        padding: 16px 8px;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
      }
      @media only screen and (max-width: 480px) {
        .wrapper {
          padding: 8px 4px !important;
        }
        .container {
          border-radius: 8px !important;
        }
        .header-content {
          padding: 20px 16px !important;
        }
        .body-content {
          padding: 16px 12px !important;
        }
        .kpi-col {
          display: block !important;
          width: 100% !important;
          margin-bottom: 8px !important;
          box-sizing: border-box !important;
        }
        .kpi-spacer {
          display: none !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="container">
        
        <!-- Header -->
        <div class="header-content" style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 24px 20px; color: #ffffff;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.02em;">IT Trust Solutions</h1>
          <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 13px;">Relatório Diário • Status de Infraestrutura e Propostas</p>
        </div>

        <div class="body-content" style="padding: 20px 18px;">
          
          <!-- Seção Infraestrutura -->
          <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 10px;">
            Status da Solução e Infraestrutura
          </div>
          <div style="margin-bottom: 22px;">
            ${servicesHtml}
          </div>

          <!-- Seção Indicadores de Propostas -->
          <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 10px;">
            Indicadores de Propostas
          </div>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-bottom: 22px;">
            <tr>
              <td class="kpi-col" style="padding: 12px; background: #eff6ff; border-radius: 8px; text-align: center; border: 1px solid #bfdbfe; width: 32%;">
                <div style="font-size: 24px; font-weight: 800; color: #1d4ed8; line-height: 1.1;">${total}</div>
                <div style="font-size: 11px; color: #1e40af; font-weight: 700; text-transform: uppercase; margin-top: 4px;">Total</div>
              </td>
              <td class="kpi-spacer" style="width: 2%;"></td>
              <td class="kpi-col" style="padding: 12px; background: #fff7ed; border-radius: 8px; text-align: center; border: 1px solid #fed7aa; width: 32%;">
                <div style="font-size: 24px; font-weight: 800; color: #c2410c; line-height: 1.1;">${pendentes.length}</div>
                <div style="font-size: 11px; color: #9a3412; font-weight: 700; text-transform: uppercase; margin-top: 4px;">Em Aberto</div>
              </td>
              <td class="kpi-spacer" style="width: 2%;"></td>
              <td class="kpi-col" style="padding: 12px; background: #f0fdf4; border-radius: 8px; text-align: center; border: 1px solid #bbf7d0; width: 32%;">
                <div style="font-size: 24px; font-weight: 800; color: #15803d; line-height: 1.1;">${respondidos.length}</div>
                <div style="font-size: 11px; color: #166534; font-weight: 700; text-transform: uppercase; margin-top: 4px;">Respondidas</div>
              </td>
            </tr>
          </table>

          <!-- Seção Lista de Orçamentos -->
          <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 10px;">
            Orçamentos em Aberto (${pendentes.length})
          </div>
          <div style="margin-bottom: 16px;">
            ${cardsHtml}
          </div>

          <!-- Rodapé -->
          <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.4;">
            Enviado automaticamente para <strong>${RECIPIENT_EMAIL}</strong> todos os dias às 08:00.<br>
            © ${new Date().getFullYear()} IT Trust Solutions.
          </div>

        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  // Salvar preview local atualizado
  fs.writeFileSync('c:/Projetos/ITTrustSolutions/email-preview.html', html);
  console.log('Arquivo email-preview.html atualizado.');

  console.log(`Disparando novo e-mail responsivo via Resend para ${RECIPIENT_EMAIL}...`);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'IT Trust Monitor <onboarding@resend.dev>',
      to: [RECIPIENT_EMAIL],
      subject: `[IT Trust Solutions] Relatório Diário: ${pendentes.length} Propostas em Aberto (Mobile Ready)`,
      html: html
    })
  });

  const resJson = await response.json();
  console.log('Resposta do Resend:', JSON.stringify(resJson, null, 2));

  if (!response.ok) {
    throw new Error(`Falha no envio: ${JSON.stringify(resJson)}`);
  }

  console.log('Novo e-mail responsivo enviado com sucesso! ID:', resJson.id);
}

sendEmail().catch(err => {
  console.error('Erro ao enviar:', err);
  process.exit(1);
});
