// ════════════════════════════════════════════════════════════════
// MI TURNO · Edge Function: send-pin
// Envía el PIN de acceso por email usando Resend (gratis hasta 3000/mes)
// ════════════════════════════════════════════════════════════════
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

interface SendPinRequest {
  to: string;
  pin: string;
  userName?: string;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'No autenticado' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();
    if (authError || !user) return jsonResponse({ error: 'Sesión inválida' }, 401);

    // Verificar si es admin
    const { data: adminCheck } = await supabase
      .from('pin_lookup')
      .select('pin')
      .eq('user_id', user.id)
      .maybeSingle();
    const isAdmin = adminCheck?.pin === '9999' || user.email === 'admin@miturno.com';

    const body: SendPinRequest = await req.json();

    if (!body.to || !body.pin) return jsonResponse({ error: 'Faltan campos requeridos' }, 400);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.to)) return jsonResponse({ error: 'Correo inválido' }, 400);
    if (!/^\d{4}$/.test(body.pin)) return jsonResponse({ error: 'PIN debe ser 4 dígitos' }, 400);

    // Solo admins pueden enviar PINs a otros usuarios
    if (!isAdmin && body.to !== user.email) {
      return jsonResponse({ error: 'Sin permisos para enviar a ese correo' }, 403);
    }

    // Rate limit: 10 correos por hora por usuario
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo);
    if (count !== null && count >= 10) {
      return jsonResponse(
        { error: 'Límite de correos alcanzado (10/hora). Intenta más tarde.' },
        429
      );
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) return jsonResponse({ error: 'Servicio de correo no configurado' }, 500);

    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Mi Turno <onboarding@resend.dev>';
    const rawName = body.userName || body.to.split('@')[0];
    const friendlyName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    const pinDigits = body.pin
      .split('')
      .map(
        d =>
          `<span style="display:inline-block;width:48px;height:60px;line-height:60px;text-align:center;background:#EEF3FF;border:2px solid #5B86E5;border-radius:10px;font-size:32px;font-weight:900;color:#3A5FCC;margin:0 4px;font-family:ui-monospace,monospace;">${d}</span>`
      )
      .join('');

    const htmlBody = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f0f5ff;margin:0;padding:24px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 8px 40px rgba(82,127,204,0.15);">
    <div style="background:linear-gradient(135deg,#5B86E5 0%,#7DA8FF 100%);padding:36px 24px;text-align:center;">
      <div style="font-size:40px;margin-bottom:10px;">🔑</div>
      <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Mi Turno</h1>
      <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:13px;">Tu PIN de acceso rápido</p>
    </div>
    <div style="padding:36px 28px;text-align:center;">
      <p style="color:#1a1f2e;font-size:16px;margin:0 0 28px;font-weight:500;">Hola <strong>${friendlyName}</strong>, tu PIN de acceso es:</p>
      <div style="margin:0 0 28px;">${pinDigits}</div>
      <div style="background:#f5f7fb;border-radius:12px;padding:16px 20px;text-align:left;font-size:13px;color:#4b5563;line-height:1.65;">
        <p style="margin:0 0 8px;">✅ Usa este PIN junto con tu contraseña para ingresar.</p>
        <p style="margin:0;">⚙️ Puedes cambiarlo en <strong>Ajustes → Gestionar cuenta</strong>.</p>
      </div>
    </div>
    <div style="padding:16px 24px;background:#fafbfc;border-top:1px solid #eef1f5;text-align:center;color:#9ca3af;font-size:11px;">
      Enviado automáticamente desde Mi Turno Colombia. Si no lo solicitaste, ignora este correo.
    </div>
  </div>
</body></html>`;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [body.to],
        subject: `🔑 Tu PIN de acceso — Mi Turno`,
        html: htmlBody,
        text: `Hola ${friendlyName},\n\nTu PIN de acceso a Mi Turno es: ${body.pin}\n\nÚsalo con tu contraseña para ingresar rápidamente.\nPuedes cambiarlo en Ajustes → Gestionar cuenta.\n\nMi Turno Colombia`
      })
    });

    const resendData = await resendRes.json();

    await supabase.from('email_logs').insert({
      user_id: user.id,
      to_email: body.to,
      format: 'pin',
      filename: 'pin-notification',
      status: resendRes.ok ? 'sent' : 'failed',
      error_message: resendRes.ok ? null : JSON.stringify(resendData).substring(0, 500),
      resend_id: resendRes.ok ? resendData.id : null
    });

    if (!resendRes.ok) {
      return jsonResponse({ error: resendData.message || 'Error al enviar el correo' }, 500);
    }

    return jsonResponse({ success: true, message: `✓ PIN enviado a ${body.to}` });
  } catch (err) {
    console.error('send-pin error:', err);
    return jsonResponse({ error: (err as Error).message || 'Error interno' }, 500);
  }
});

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
