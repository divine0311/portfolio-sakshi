// Supabase Edge Function: notify-contact
// Sends an email via Resend when someone submits the public #connect form.
//
// Why an edge function: the Resend API key must never reach the browser. Any
// VITE_ variable is inlined into the public JS bundle, so calling Resend from
// React would hand the key to every visitor.
//
// Abuse guard: this function is publicly invokable with the anon key, so
// before sending anything it verifies (using the service-role client, which
// bypasses RLS) that the message really was inserted into contact_messages in
// the last few minutes. Attackers can therefore submit their own rows but
// cannot make you send mail to arbitrary addresses.

import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const TO_EMAIL = Deno.env.get('CONTACT_TO_EMAIL') ?? '';
const FROM_EMAIL = Deno.env.get('CONTACT_FROM_EMAIL') ?? 'Portfolio <onboarding@resend.dev>';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {...CORS_HEADERS, 'Content-Type': 'application/json'},
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response('ok', {headers: CORS_HEADERS});
  if (req.method !== 'POST') return json({error: 'Method not allowed'}, 405);

  if (!RESEND_API_KEY) {
    return json({error: 'RESEND_API_KEY secret is not set on this function.'}, 500);
  }
  if (!TO_EMAIL) {
    return json({error: 'CONTACT_TO_EMAIL secret is not set on this function.'}, 500);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({error: 'Invalid JSON body.'}, 400);
  }

  const name = clean(payload.name, MAX_NAME);
  const email = clean(payload.email, MAX_EMAIL).toLowerCase();
  const message = clean(payload.message, MAX_MESSAGE);

  if (!name || !message || !EMAIL_RE.test(email)) {
    return json({error: 'Name, a valid email and a message are required.'}, 400);
  }

  // Abuse guard: the row must exist and be recent.
  if (SERVICE_KEY && SUPABASE_URL) {
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: {persistSession: false, autoRefreshToken: false},
    });
    const {data} = await admin
      .from('contact_messages')
      .select('id')
      .eq('email', email)
      .eq('message', message)
      .gt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order('created_at', {ascending: false})
      .limit(1);
    if (!data || data.length === 0) {
      return json({error: 'No matching stored message found.'}, 403);
    }
  }

  const subject = `New portfolio enquiry from ${name}`;
  const html = `
    <div style="font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;background:#f7f3ea;padding:24px">
      <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #e2dccb">
        <p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#7d7566">Portfolio Contact Form</p>
        <h1 style="margin:0 0 20px;font-size:20px;color:#1c0b0b">${escapeHtml(subject)}</h1>
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#1c0b0b">
          <tr><td style="padding:8px 0;color:#7d7566;width:80px">Name</td><td style="padding:8px 0;font-weight:600">${escapeHtml(name)}</td></tr>
          <tr><td style="padding:8px 0;color:#7d7566">Email</td><td style="padding:8px 0"><a href="mailto:${escapeHtml(email)}" style="color:#1c0b0b">${escapeHtml(email)}</a></td></tr>
        </table>
        <div style="margin-top:18px;padding:16px;background:#f7f3ea;border-radius:12px;white-space:pre-wrap;line-height:1.6;color:#1c0b0b">${escapeHtml(message)}</div>
        <p style="margin:20px 0 0;font-size:12px;color:#7d7566">Reply directly to this email to answer ${escapeHtml(name)}.</p>
      </div>
    </div>`;

  const text =
    `New portfolio enquiry\n\n` +
    `Name: ${name}\nEmail: ${email}\n\n${message}\n\n---\nReply directly to this email to answer ${name}.`;

  const resend = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({from: FROM_EMAIL, to: [TO_EMAIL], reply_to: email, subject, html, text}),
  });

  if (!resend.ok) {
    const detail = await resend.text();
    console.error('resend error', resend.status, detail);
    return json({error: `Resend rejected the request (${resend.status}).`}, 502);
  }

  const sent = (await resend.json()) as {id?: string};
  return json({ok: true, id: sent.id ?? null});
});
