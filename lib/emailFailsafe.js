export async function emailFailsafe(subject, rows) {
  if (!process.env.RESEND_API_KEY) return false

  try {
    const tableRows = rows
      .map(([k, v]) => `<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;font-weight:600;color:#374151;white-space:nowrap;">${k}</td><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#111827;">${v || '—'}</td></tr>`)
      .join('')

    const html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:640px;">
        <div style="background:#005F2C;padding:20px 28px;border-radius:8px 8px 0 0;">
          <h2 style="color:#fff;margin:0;font-size:18px;">⚠️ GC4C Form — Excel Failsafe</h2>
          <p style="color:#a7d4b5;margin:6px 0 0;font-size:14px;">The Excel write failed. Submission data saved below.</p>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:24px 28px;">
          <p style="color:#6b7280;font-size:14px;margin:0 0 16px;">Form: <strong style="color:#111827;">${subject}</strong></p>
          <table style="border-collapse:collapse;width:100%;font-size:14px;">${tableRows}</table>
          <p style="color:#9ca3af;font-size:12px;margin:20px 0 0;">This email was sent automatically because the OneDrive Excel write failed. Please add this submission manually once the issue is resolved.</p>
        </div>
      </div>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'GC4C Forms <forms@golfclubs4cash.co.uk>',
        to: [process.env.FAILSAFE_TO_EMAIL || 'harry.phillips@golfclubs4cash.co.uk'],
        subject: `[FAILSAFE] ${subject} — ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}`,
        html,
      }),
    })

    return res.ok
  } catch {
    return false
  }
}
