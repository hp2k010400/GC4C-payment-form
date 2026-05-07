import { getStore } from '@netlify/blobs'

const ALL_COLUMNS = [
  'savedAt', 'formType',
  'Submitted At', 'Store / Department', 'Colleague Name',
  'Customer Name', 'Customer Email', 'Customer Phone',
  'PO Number / React', 'Number of Items', 'Country of Origin',
  'Payment Amount (£)', 'Date of Payment', 'Time of Payment',
  'Additional Notes', 'Transaction Type',
  'Sort Code', 'Account Number', 'Account Holder Name',
  'PayPal Email', 'IBAN', 'BIC / SWIFT Code', 'Consent Given',
]

function toCSV(rows) {
  const escape = (v) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const header = ALL_COLUMNS.map(escape).join(',')
  const body = rows.map(row => ALL_COLUMNS.map(col => escape(row[col] ?? '')).join(',')).join('\n')
  return `${header}\n${body}`
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const token = process.env.EXPORT_SECRET
  if (token && req.query.token !== token) {
    return res.status(401).json({ error: 'Unauthorized — add ?token=YOUR_EXPORT_SECRET to the URL' })
  }

  try {
    const store = getStore('failed-submissions')
    const { blobs } = await store.list()

    if (blobs.length === 0) {
      return res.status(200).send('No failed submissions stored.')
    }

    const records = await Promise.all(
      blobs.map(async (blob) => {
        const raw = await store.get(blob.key, { type: 'json' })
        return { savedAt: raw.savedAt, formType: raw.formType, ...raw.fields }
      })
    )

    records.sort((a, b) => new Date(a.savedAt) - new Date(b.savedAt))

    const csv = toCSV(records)
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="failed-submissions-${new Date().toISOString().slice(0, 10)}.csv"`)
    return res.status(200).send(csv)
  } catch (err) {
    console.error('[export-failures]', err.message)
    return res.status(500).json({ error: err.message })
  }
}
