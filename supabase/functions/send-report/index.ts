// ════════════════════════════════════════════════════════════════
// MI TURNO · Edge Function: send-report
// Envía reportes (PDF/Excel) por correo usando Resend
// ════════════════════════════════════════════════════════════════
//
// SEGURIDAD:
// - Solo usuarios autenticados pueden invocarla
// - La API key de Resend está como SECRET en Supabase (nunca expuesta)
// - Rate limiting: máximo 10 envíos por usuario por hora
// - Logs en tabla email_logs para auditoría
// ════════════════════════════════════════════════════════════════

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

interface SendReportRequest {
  to: string; // correo destino
  subject?: string; // asunto (opcional)
  message?: string; // mensaje del cuerpo (opcional)
  format: 'pdf' | 'xlsx'; // tipo de adjunto
  filename: string; // nombre del archivo
  fileBase64: string; // contenido del archivo en base64
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── 1. Validar autenticación ──
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'No autenticado' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return jsonResponse({ error: 'Sesión inválida' }, 401);
    }

    // ── 2. Parsear y validar payload ──
    const body: SendReportRequest = await req.json();

    if (!body.to || !body.fileBase64 || !body.filename || !body.format) {
      return jsonResponse({ error: 'Faltan campos requeridos' }, 400);
    }

    // Validar email destinatario
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.to)) {
      return jsonResponse({ error: 'Correo destino inválido' }, 400);
    }

    // Validar formato
    if (body.format !== 'pdf' && body.format !== 'xlsx') {
      return jsonResponse({ error: 'Formato no permitido' }, 400);
    }

    // Validar tamaño del archivo (máximo 10MB en base64 ≈ 7.5MB real)
    if (body.fileBase64.length > 10 * 1024 * 1024) {
      return jsonResponse({ error: 'Archivo demasiado grande (máx 7MB)' }, 400);
    }

    // ── 3. Rate limiting (máximo 10 envíos por hora por usuario) ──
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo);

    if (count !== null && count >= 10) {
      return jsonResponse(
        {
          error: 'Límite alcanzado: 10 correos por hora. Intenta más tarde.'
        },
        429
      );
    }

    // ── 4. Construir email con Resend ──
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY no configurada');
      return jsonResponse({ error: 'Servicio no configurado' }, 500);
    }

    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Mi Turno <onboarding@resend.dev>';
    const mimeType =
      body.format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    const formatLabel = body.format === 'pdf' ? 'PDF' : 'Excel';
    const subject = body.subject || `📊 Tu reporte de turnos (${formatLabel})`;
    const userName = (user.email || '').split('@')[0];
    const friendlyName = userName.charAt(0).toUpperCase() + userName.slice(1);

    const message =
      body.message ||
      `Hola ${friendlyName},

Adjunto encontrarás tu reporte de turnos en formato ${formatLabel}, generado desde Mi Turno.

Este reporte incluye el detalle de horas trabajadas, recargos aplicados y total devengado según la legislación colombiana vigente (Ley 2101/2021, CST Arts. 168-171).

Saludos,
Mi Turno · Colombia`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f7fb;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#5B86E5 0%,#7DA8FF 100%);padding:32px 24px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">⏱</div>
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">Mi Turno · Colombia</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">Nómina inteligente</p>
    </div>
    <div style="padding:28px 24px;color:#1a1f2e;line-height:1.65;font-size:14.5px;">
      <p style="margin:0 0 14px;">Hola <strong>${friendlyName}</strong>,</p>
      <p style="margin:0 0 14px;">Adjunto encontrarás tu reporte de turnos en formato <strong>${formatLabel}</strong>, generado desde Mi Turno.</p>
      <p style="margin:0 0 14px;color:#5a6372;font-size:13px;">Este reporte incluye el detalle de horas trabajadas, recargos aplicados y total devengado según la legislación colombiana vigente.</p>
      <div style="margin-top:24px;padding:14px 16px;background:#f5f7fb;border-radius:10px;font-size:12px;color:#7a8294;">
        📎 <strong>${body.filename}</strong><br>
        <span style="opacity:0.7;">Ley 2101/2021 · CST Arts. 168-171</span>
      </div>
    </div>
    <div style="padding:18px 24px;background:#fafbfc;border-top:1px solid #eef1f5;text-align:center;color:#9ca3af;font-size:11px;">
      Este correo fue enviado automáticamente desde Mi Turno.
    </div>
  </div>
</body>
</html>`;

    // ── 5. Llamar a Resend ──
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [body.to],
        subject: subject,
        text: message,
        html: htmlBody,
        attachments: [
          {
            filename: body.filename,
            content: body.fileBase64
          }
        ]
      })
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend error:', resendData);

      // Log del fallo
      await supabase.from('email_logs').insert({
        user_id: user.id,
        to_email: body.to,
        format: body.format,
        filename: body.filename,
        status: 'failed',
        error_message: JSON.stringify(resendData).substring(0, 500)
      });

      return jsonResponse(
        {
          error: resendData.message || 'Error al enviar el correo'
        },
        500
      );
    }

    // ── 6. Log de éxito ──
    await supabase.from('email_logs').insert({
      user_id: user.id,
      to_email: body.to,
      format: body.format,
      filename: body.filename,
      status: 'sent',
      resend_id: resendData.id
    });

    return jsonResponse({
      success: true,
      messageId: resendData.id,
      message: `✓ Reporte enviado a ${body.to}`
    });
  } catch (error) {
    console.error('Error en send-report:', error);
    return jsonResponse(
      {
        error: error.message || 'Error interno del servidor'
      },
      500
    );
  }
});

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
