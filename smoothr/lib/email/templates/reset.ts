export function renderResetEmail(opts: {
  storeName: string;
  logoUrl?: string | null;
  actionLink: string;
}) {
  const title = `Reset your password for ${opts.storeName}`;
  const html = `<!doctype html>
<html><body style="font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;margin:0;padding:24px;background:#f6f7f9;color:#111;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06);overflow:hidden;">
    <tr><td style="padding:24px 24px 0;">
      ${opts.logoUrl ? `<div style="margin-bottom:12px;"><img src="${opts.logoUrl}" alt="${opts.storeName}" style="height:32px;"/></div>` : ''}
      <h1 style="font-size:20px;margin:0 0 12px;">${title}</h1>
      <p style="font-size:14px;line-height:1.5;margin:0 0 20px;">Click the button below to choose a new password.</p>
      <p style="margin:0 0 28px;"><a href="${opts.actionLink}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;">Reset password</a></p>
      <p style="font-size:12px;color:#555;margin:0 0 8px;">If you didn’t request this, you can ignore this email.</p>
    </td></tr>
  </table>
  <p style="text-align:center;font-size:12px;color:#888;margin-top:12px;">© ${new Date().getFullYear()} ${opts.storeName}</p>
</body></html>`;
  const text = `Reset your password for ${opts.storeName}\n${opts.actionLink}\n\nIf you didn’t request this, ignore this email.`;
  return { subject: title, html, text };
}
