import { getStore } from '@netlify/blobs'

export async function saveFailsafe(formType, headers, rowValues) {
  const fields = {}
  headers.forEach((h, i) => { fields[h] = rowValues[i] ?? '' })

  let stored = false
  try {
    const store = getStore('failed-submissions')
    const key = `${formType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    await store.set(key, JSON.stringify({ formType, savedAt: new Date().toISOString(), fields }))
    stored = true
  } catch (err) {
    console.error('[failsafe] Blob store failed:', err.message)
  }

  // Also send email notification if Resend is configured
  if (process.env.RESEND_API_KEY) {
    try {
      const tableRows = Object.entries(fields)
        .map(([k, v]) => `<tr><td style="padding:7px 12px;border:1px solid #e5e7eb;font-weight:600;color:#374151;white-space:nowrap;">${k}</td><td style="padding:7px 12px;border:1px solid #e5e7eb;color:#111827;">${v || '—'}</td></tr>`)
        .join('')

      const html = `
        <div style="font-family:Inter,Arial,sans-serif;max-width:640px;">
          <div style="background:#005F2C;padding:20px 28px;border-radius:8px 8px 0 0;">
            <h2 style="color:#fff;margin:0;font-size:18px;">⚠️ GC4C Form — Excel Failsafe</h2>
            <p style="color:#a7d4b5;margin:6px 0 0;font-size:14px;">Excel write failed. Submission saved to failsafe store${stored ? ' ✓' : ' (store also failed — data below only)'}.</p>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:24px 28px;">
            <p style="color:#6b7280;font-size:14px;margin:0 0 16px;">Form: <strong style="color:#111827;">${formType}</strong></p>
            <table style="border-collapse:collapse;width:100%;font-size:14px;">${tableRows}</table>
            <p style="color:#9ca3af;font-size:12px;margin:20px 0 0;">Download all failed submissions at <strong>/api/export-failures</strong> on your Netlify site.</p>
          </div>
        </div>
      `

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
          to: [process.env.FAILSAFE_TO_EMAIL || 'harryp010400@gmail.com'],
          subject: `[FAILSAFE] ${formType} — ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })}`,
          html,
        }),
      })
    } catch (err) {
      console.error('[failsafe] Email notification failed:', err.message)
    }
  }

  return stored
}
