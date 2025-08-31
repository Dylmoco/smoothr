import type { ReactElement } from 'react';

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string | null;
  from?: string | null; // fallback to env EMAIL_FROM
};

export async function sendEmail(args: SendArgs): Promise<{ ok: true } | { ok: false; error: string }> {
  const from = args.from || process.env.EMAIL_FROM || 'Smoothr <no-reply@smoothr.io>';
  const useResend = !!process.env.RESEND_API_KEY;
  const usePostmark = !!process.env.POSTMARK_API_TOKEN;

  try {
    if (useResend) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY!);
      const res = await resend.emails.send({ from, to: args.to, subject: args.subject, html: args.html, text: args.text || undefined });
      if (res.error) return { ok: false, error: String(res.error) };
      return { ok: true };
    }
    if (usePostmark) {
      const { ServerClient } = await import('postmark');
      const client = new ServerClient(process.env.POSTMARK_API_TOKEN!);
      const res = await client.sendEmail({ From: from, To: args.to, Subject: args.subject, HtmlBody: args.html, TextBody: args.text || undefined, MessageStream: 'outbound' });
      if (res.ErrorCode && res.ErrorCode !== 0) return { ok: false, error: res.Message || 'postmark_error' };
      return { ok: true };
    }
    // Dev fallback: log only
    // eslint-disable-next-line no-console
    console.info('[email:dev-fallback] to=%s subject=%s', args.to, args.subject);
    // eslint-disable-next-line no-console
    console.info(args.html);
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'email_send_error' };
  }
}
