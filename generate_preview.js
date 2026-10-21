const fs = require('fs');

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

async function run() {
  console.log('Verificando status dos serviços...');
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

  const rowsHtml = pendentes.map(p => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 12px; font-weight: bold; color: #2563eb;">${p.protocolo || '-'}</td>
      <td style="padding: 12px;"><strong>${p.empresa || '-'}</strong><br><small style="color: #64748b;">${p.contato || ''} (${p.celular || ''})</small></td>
      <td style="padding: 12px;"><span style="background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;">${p.segmento || '-'}</span></td>
      <td style="padding: 12px; font-size: 13px; color: #334155; line-height: 1.4;">${p.problema ? (p.problema.length > 150 ? p.problema.substring(0, 150) + '...' : p.problema) : 'Sem descrição'}</td>
    </tr>
  `).join('');

  const servicesHtml = [siteCheck, vercelCheck, supabaseCheck].map(srv => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 8px;">
      <div>
        <strong style="color: #0f172a; font-size: 14px;">${srv.name}</strong>
        <div style="font-size: 12px; color: #64748b;">${srv.url}</div>
      </div>
      <div style="text-align: right;">
        <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: ${srv.online ? '#dcfce7' : '#fee2e2'}; color: ${srv.online ? '#15803d' : '#b91c1c'};">
          ${srv.online ? '● ONLINE' : '● OFFLINE'}
        </span>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${srv.latency}</div>
      </div>
    </div>
  `).join('');

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Preview: Status Diário IT Trust</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b;">
    <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 28px; color: white;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700;">IT Trust Solutions - Relatório Diário</h1>
        <p style="margin: 6px 0 0 0; opacity: 0.85; font-size: 14px;">Monitoramento das 08:00 • Status de Infraestrutura e Propostas</p>
      </div>

      <div style="padding: 24px;">
        <!-- Serviços -->
        <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-top: 0; margin-bottom: 12px;">Status da Solução e Infraestrutura</h2>
        <div style="margin-bottom: 24px;">
          ${servicesHtml}
        </div>

        <!-- Indicadores -->
        <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 12px;">Indicadores de Propostas</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          <tr>
            <td style="width: 32%; padding: 16px; background: #eff6ff; border-radius: 8px; text-align: center; border: 1px solid #bfdbfe;">
              <div style="font-size: 28px; font-weight: 800; color: #1d4ed8;">${total}</div>
              <div style="font-size: 12px; color: #1e40af; font-weight: 600; text-transform: uppercase;">Total de Propostas</div>
            </td>
            <td style="width: 2%;"></td>
            <td style="width: 32%; padding: 16px; background: #fff7ed; border-radius: 8px; text-align: center; border: 1px solid #fed7aa;">
              <div style="font-size: 28px; font-weight: 800; color: #c2410c;">${pendentes.length}</div>
              <div style="font-size: 12px; color: #9a3412; font-weight: 600; text-transform: uppercase;">Em Aberto (Pendentes)</div>
            </td>
            <td style="width: 2%;"></td>
            <td style="width: 32%; padding: 16px; background: #f0fdf4; border-radius: 8px; text-align: center; border: 1px solid #bbf7d0;">
              <div style="font-size: 28px; font-weight: 800; color: #15803d;">${respondidos.length}</div>
              <div style="font-size: 12px; color: #166534; font-weight: 600; text-transform: uppercase;">Respondidas</div>
            </td>
          </tr>
        </table>

        <!-- Detalhes dos Orçamentos Abertos -->
        <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 12px;">Relatório de Orçamentos em Aberto (${pendentes.length})</h2>
        <div style="overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
            <thead style="background: #f1f5f9; color: #475569;">
              <tr>
                <th style="padding: 10px 12px;">Protocolo</th>
                <th style="padding: 10px 12px;">Empresa / Contato</th>
                <th style="padding: 10px 12px;">Segmento</th>
                <th style="padding: 10px 12px;">Descrição do Problema</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <!-- Footer -->
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
          Enviado automaticamente para <strong>tecnologia.duarte@gmail.com</strong> todos os dias às 08:00 (Horário de Brasília).<br>
          © ${new Date().getFullYear()} IT Trust Solutions.
        </div>

      </div>
    </div>
  </body>
  </html>
  `;

  fs.writeFileSync('c:/Projetos/ITTrustSolutions/email-preview.html', html);
  console.log('Preview gerado com sucesso em c:/Projetos/ITTrustSolutions/email-preview.html');
}

run();
