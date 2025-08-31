export function renderResetEmail(opts: {
  storeName: string;
  logoUrl?: string | null;
  actionLink: string;
}) {
  const { storeName, logoUrl, actionLink } = opts;
  const logoBlock = logoUrl
    ? `<img src="${logoUrl}" alt="${storeName}" style="max-width:160px; margin:0 auto 16px; display:block;" />`
    : `<div style="font-weight:600; font-size:18px; text-align:center; margin:0 0 16px;">${storeName}</div>`;
  const subject = `${storeName} • Reset your password`;
  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; padding:24px;">
      ${logoBlock}
      <h1 style="font-size:18px; margin:0 0 12px;">Reset your password</h1>
      <p style="margin:0 0 16px;">Tap the button below to set a new password for ${storeName}.</p>
      <p style="margin:24px 0;"><a href="${actionLink}" style="padding:12px 16px; border-radius:8px; text-decoration:none; display:inline-block; border:1px solid #ddd;">Set new password</a></p>
      <p style="font-size:12px; color:#666;">If the button doesn’t work, copy and paste this link:<br>${actionLink}</p>
    </div>`;
  const text = `Reset your ${storeName} password:\n${actionLink}`;
  return { subject, html, text };
}
