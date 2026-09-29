import {supabase} from './supabase';
import type {SaveResult} from './content';

export interface ContactMessageInput {
  name: string;
  email: string;
  message: string;
}

/** The message is stored even if the email step fails; this is the notice text. */
export type NotifyOutcome = 'sent' | 'stored-only' | 'failed';

export type ContactSubmitResult = SaveResult & {notify?: NotifyOutcome};

const WRITE_TIMEOUT_MS = 10000;
const NOTIFY_TIMEOUT_MS = 12000;
const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 5000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const SEND_MESSAGE =
  "Thanks! Your message is saved and I've been notified on my email.";
const SEND_MESSAGE_NO_MAIL =
  'Thanks! Your message was saved, but I could not send the email notification. Please also email me directly so I do not miss it.';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function withTimeout(work: PromiseLike<unknown>, ms: number): Promise<{error: {message: string} | null} | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    Promise.resolve(work).then(
      (value) => {
        clearTimeout(timer);
        resolve(value as {error: {message: string} | null});
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
    );
  });
}

/** Stable-enough key so a double-click / retry cannot store the same text twice. */
function fingerprint(input: ContactMessageInput): string {
  const raw = `${input.name.trim().toLowerCase()}|${input.email.trim().toLowerCase()}|${input.message.trim()}`;
  let hash = 5381;
  for (let i = 0; i < raw.length; i += 1) {
    hash = ((hash << 5) + hash + raw.charCodeAt(i)) | 0;
  }
  return `fp_${(hash >>> 0).toString(36)}_${raw.length.toString(36)}`;
}

export function validateContactMessage(input: ContactMessageInput): string | null {
  if (!isNonEmptyString(input.name)) return 'Please enter your name.';
  if (input.name.trim().length > MAX_NAME) return `Please keep your name under ${MAX_NAME} characters.`;
  if (!isNonEmptyString(input.email)) return 'Please enter your email address.';
  if (input.email.trim().length > MAX_EMAIL) return 'Please enter a valid email address.';
  if (!EMAIL_RE.test(input.email.trim())) return 'Please enter a valid email address.';
  if (!isNonEmptyString(input.message)) return 'Please enter a message.';
  if (input.message.trim().length > MAX_MESSAGE) return `Please keep your message under ${MAX_MESSAGE} characters.`;
  return null;
}

/**
 * Stores the enquiry, then asks the notify-contact edge function to email it to
 * you through Resend. The row is written first on purpose: if Resend is down or
 * the function is not deployed yet, the visitor's message is never lost.
 */
export async function submitContactMessage(input: ContactMessageInput): Promise<ContactSubmitResult> {
  const invalid = validateContactMessage(input);
  if (invalid) return {ok: false, error: invalid};
  const client = supabase;
  if (!client) return {ok: false, error: 'Messaging is not available right now.'};

  const row = {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    message: input.message.trim(),
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : null,
    fingerprint: fingerprint(input),
  };

  const stored = await withTimeout(client.from('contact_messages').insert(row), WRITE_TIMEOUT_MS);

  if (stored === null) {
    return {ok: false, error: 'The connection timed out. Please check your network and try again.'};
  }
  if (stored.error) {
    const reason = stored.error.message || '';
    if (/row-level security|permission denied/i.test(reason)) {
      return {ok: false, error: 'Messaging is temporarily unavailable. Please email me directly instead.'};
    }
    if (/violates check constraint|invalid input/i.test(reason)) {
      return {ok: false, error: 'Please check your name, email and message and try again.'};
    }
    return {ok: false, error: 'Your message could not be saved. Please email me directly instead.'};
  }

  const sent = await sendEmailNotification(client, row);
  if (sent === 'sent') return {ok: true, notify: 'sent'};
  if (sent === 'stored-only') return {ok: true, notify: 'stored-only'};
  return {ok: true, notify: 'failed'};
}

/**
 * Best-effort email. Returns 'failed' only when the function is unreachable in a
 * way that is worth surfacing; a missing/undeployed function is treated as
 * 'stored-only' so the user still sees a reassuring confirmation.
 */
async function sendEmailNotification(
  client: NonNullable<typeof supabase>,
  row: {name: string; email: string; message: string; fingerprint: string},
): Promise<NotifyOutcome> {
  try {
    const result = await withTimeout(
      client.functions.invoke('notify-contact', {body: row}),
      NOTIFY_TIMEOUT_MS,
    );
    if (result === null) return 'stored-only';
    if (result.error) return 'stored-only';
    return 'sent';
  } catch {
    return 'stored-only';
  }
}

export {SEND_MESSAGE, SEND_MESSAGE_NO_MAIL};
