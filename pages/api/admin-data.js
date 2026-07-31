import supabase from '../../lib/supabase.js'

const BANK_FIELDS_COMMS = ['sort_code', 'account_number', 'holder_name', 'paypal_email', 'iban', 'bic_swift']
const BANK_FIELDS_STORE = ['sort_code', 'account_number', 'paypal_email', 'iban', 'bic_swift']

function stripBank(row, fields) {
  const out = { ...row }
  fields.forEach(f => delete out[f])
  return out
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const tab = req.query.tab === 'store' ? 'store' : 'comms'
  const isFinance = req.cookies?.gc4c_finance === process.env.FINANCE_PASSWORD

  const table = tab === 'store' ? 'store_submissions' : 'comms_submissions'
  const bankFields = tab === 'store' ? BANK_FIELDS_STORE : BANK_FIELDS_COMMS

  const allData = []
  const pageSize = 1000
  let cursor = null // { created_at, id } of the last row seen

  while (true) {
    let query = supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(pageSize)

    if (cursor) {
      query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`)
    }

    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    if (data && data.length > 0) {
      allData.push(...data)
      cursor = { created_at: data[data.length - 1].created_at, id: data[data.length - 1].id }
    }
    if (!data || data.length < pageSize) break
  }

  const rows = isFinance ? allData : allData.map(r => stripBank(r, bankFields))

  return res.status(200).json({ rows, isFinance })
}
