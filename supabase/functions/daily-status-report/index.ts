// Supabase Edge Function: daily-status-report
// Executada diariamente às 08:00 para envio do status dos serviços e propostas em aberto.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RECIPIENT_EMAIL = "tecnologia.duarte@gmail.com";
const SITE_URL = Deno.env.get("SITE_URL") || "https://www.ittrust.com.br";
const VERCEL_URL = Deno.env.get("VERCEL_URL") || "https://it-trust-solutions-complete.vercel.app";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "re_ByMzy4Xr_HN6TvaEnjAtidp5zk2Lkswuk";

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Verificação de Saúde dos Serviços
    const checkService = async (url: string, name: string) => {
      const startTime = Date.now();
      try {
        const res = await fetch(url, { method: "GET", signal: AbortSignal.timeout(6000) });
        const latency = Date.now() - startTime;
        return {
          name,
          url,
          online: res.status >= 200 && res.status < 400,
          status: `${res.status} ${res.statusText}`,
          latency: `${latency}ms`,
        };
      } catch (err: any) {
        return {
          name,
          url,
          online: false,
          status: err.message || "Offline",
          latency: "-",
        };
      }
    };

    const siteCheck = await checkService(SITE_URL, "Site Institucional");
    const vercelCheck = await checkService(VERCEL_URL, "Vercel Deployment");

    // Supabase Health Check
    let supabaseCheck = {
      name: "Supabase (Banco de Dados)",
      url: "Postgres Cloud",
      online: false,
      status: "Desconhecido",
      latency: "-",
    };

    const sbStartTime = Date.now();
    const { count: totalPropostas, error: countErr } = await supabase
      .from("orcamentos")
      .select("*", { count: "exact", head: true });

    if (countErr) {
      supabaseCheck.status = `Erro: ${countErr.message}`;
    } else {
      supabaseCheck.online = true;
      supabaseCheck.status = "200 OK";
      supabaseCheck.latency = `${Date.now() - sbStartTime}ms`;
    }

    // 2. Consulta de Propostas (Total, Pendentes e Respondidas)
    const { count: pendentesCount } = await supabase
      .from("orcamentos")
      .select("*", { count: "exact", head: true })
      .eq("status", "Pendente");

    const { count: respondidosCount } = await supabase
      .from("orcamentos")
      .select("*", { count: "exact", head: true })
      .eq("status", "Respondido");

    // 3. Obter a lista com a descrição dos orçamentos em aberto
    const { data: propostasAbertas } = await supabase
      .from("orcamentos")
      .select("protocolo, created_at, empresa, contato, celular, segmento, problema, tipo_solucao")
      .eq("status", "Pendente")
      .order("created_at", { ascending: false });

    // 4. Montar Cards HTML Responsivos
    let listaOrcamentosHtml = "";
    if (propostasAbertas && propostasAbertas.length > 0) {
      listaOrcamentosHtml = propostasAbertas
        .map(
          (p) => `
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          <div style="margin-bottom: 8px;">
            <span style="font-weight: 700; color: #2563eb; font-size: 13px; background: #eff6ff; padding: 3px 8px; border-radius: 6px; display: inline-block; margin-right: 6px; margin-bottom: 4px;">#${p.protocolo || "-"}</span>
            <span style="background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 6px; font-size: 12px; font-weight: 600; display: inline-block; margin-right: 6px; margin-bottom: 4px;">${p.segmento || "Geral"}</span>
            <span style="background: #fef3c7; color: #b45309; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; display: inline-block; margin-bottom: 4px;">PENDENTE</span>
          </div>
          <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">${p.empresa || "Empresa não informada"}</div>
          <div style="font-size: 13px; color: #64748b; margin-bottom: 10px;">
            👤 <strong>${p.contato || "Contato"}</strong> &nbsp;•&nbsp; 📱 <a href="tel:${p.celular || ""}" style="color: #2563eb; text-decoration: none;">${p.celular || "-"}</a>
          </div>
          <div style="background: #f8fafc; border-left: 3px solid #2563eb; padding: 10px 12px; border-radius: 4px; font-size: 13px; color: #334155; line-height: 1.5; word-break: break-word;">
            <div style="font-weight: 600; color: #475569; font-size: 11px; text-transform: uppercase; margin-bottom: 4px;">Descrição da Necessidade:</div>
            ${p.problema || "Nenhum detalhe informado"}
          </div>
        </div>
      `
        )
        .join("");
    } else {
      listaOrcamentosHtml = `
        <div style="padding: 20px; text-align: center; color: #10b981; font-weight: 600; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
          ✓ Nenhum orçamento pendente no momento! Todas as propostas foram respondidas.
        </div>
      `;
    }

    const servicesHtml = [siteCheck, vercelCheck, supabaseCheck]
      .map(
        (srv) => `
      <div style="padding: 12px 14px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr>
            <td style="vertical-align: middle;">
              <div style="color: #0f172a; font-size: 14px; font-weight: 700;">${srv.name}</div>
              <div style="font-size: 12px; color: #64748b; word-break: break-all;">${srv.url}</div>
            </td>
            <td style="vertical-align: middle; text-align: right; white-space: nowrap; padding-left: 10px;">
              <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: 700; background: ${srv.online ? "#dcfce7" : "#fee2e2"}; color: ${srv.online ? "#15803d" : "#b91c1c"};">
                ${srv.online ? "● ONLINE" : "● OFFLINE"}
              </span>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">${srv.latency}</div>
            </td>
          </tr>
        </table>
      </div>
    `
      )
      .join("");

    const emailHtml = `
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
                    <div style="font-size: 24px; font-weight: 800; color: #1d4ed8; line-height: 1.1;">${totalPropostas ?? 0}</div>
                    <div style="font-size: 11px; color: #1e40af; font-weight: 700; text-transform: uppercase; margin-top: 4px;">Total</div>
                  </td>
                  <td class="kpi-spacer" style="width: 2%;"></td>
                  <td class="kpi-col" style="padding: 12px; background: #fff7ed; border-radius: 8px; text-align: center; border: 1px solid #fed7aa; width: 32%;">
                    <div style="font-size: 24px; font-weight: 800; color: #c2410c; line-height: 1.1;">${pendentesCount ?? 0}</div>
                    <div style="font-size: 11px; color: #9a3412; font-weight: 700; text-transform: uppercase; margin-top: 4px;">Em Aberto</div>
                  </td>
                  <td class="kpi-spacer" style="width: 2%;"></td>
                  <td class="kpi-col" style="padding: 12px; background: #f0fdf4; border-radius: 8px; text-align: center; border: 1px solid #bbf7d0; width: 32%;">
                    <div style="font-size: 24px; font-weight: 800; color: #15803d; line-height: 1.1;">${respondidosCount ?? 0}</div>
                    <div style="font-size: 11px; color: #166534; font-weight: 700; text-transform: uppercase; margin-top: 4px;">Respondidas</div>
                  </td>
                </tr>
              </table>

              <!-- Seção Lista de Orçamentos -->
              <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 10px;">
                Orçamentos em Aberto (${pendentesCount ?? 0})
              </div>
              <div style="margin-bottom: 16px;">
                ${listaOrcamentosHtml}
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

    // 5. Envio via Resend API
    if (RESEND_API_KEY) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "IT Trust Monitor <onboarding@resend.dev>",
          to: [RECIPIENT_EMAIL],
          subject: `[IT Trust Solutions] Relatório Diário: ${pendentesCount ?? 0} Propostas em Aberto`,
          html: emailHtml,
        }),
      });

      const emailData = await emailRes.json();
      return new Response(JSON.stringify({ success: true, emailData }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ success: true, message: "Simulado (RESEND_API_KEY não informada)" }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
