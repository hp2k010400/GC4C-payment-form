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
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, from + pageSize - 1)

    if (error) return res.status(500).json({ error: error.message })
    if (data && data.length > 0) allData.push(...data)
    if (!data || data.length < pageSize) break
    from += pageSize
  }

  const rows = isFinance ? allData : allData.map(r => stripBank(r, bankFields))

  return res.status(200).json({ rows, isFinance })
}
