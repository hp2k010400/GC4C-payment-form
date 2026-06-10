import supabase from '../../lib/supabase.js'

const VALID_TABLES = ['comms_submissions', 'store_submissions']
const VALID_STATUSES = ['complete', 'void', 'incorrect', null]

export default async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).end()

  const isFinance = req.cookies?.gc4c_finance === process.env.FINANCE_PASSWORD
  if (!isFinance) return res.status(403).json({ error: 'Finance access required' })

  const { id, table, status } = req.body
  if (!VALID_TABLES.includes(table)) return res.status(400).json({ error: 'Invalid table' })
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' })

  const { error } = await supabase.from(table).update({ status }).eq('id', id)
  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ success: true })
}
