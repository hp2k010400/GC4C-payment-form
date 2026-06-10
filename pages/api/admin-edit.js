import supabase from '../../lib/supabase.js'

const VALID_TABLES = ['comms_submissions', 'store_submissions']
const EDITABLE = {
  comms_submissions: ['colleague_name','customer_name','po_number','number_of_items','country_of_origin','payment_amount','date_of_payment','time_of_payment','transaction_type','sort_code','account_number','holder_name','paypal_email','iban','bic_swift'],
  store_submissions:  ['store','colleague_name','customer_name','customer_email','customer_phone','payment_amount','date_of_payment','time_of_payment','additional_notes','transaction_type','sort_code','account_number','paypal_email','iban','bic_swift','consent_given'],
}

export default async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).end()

  const { id, table, field, value } = req.body
  if (!VALID_TABLES.includes(table)) return res.status(400).json({ error: 'Invalid table' })
  if (!EDITABLE[table].includes(field)) return res.status(400).json({ error: 'Field not editable' })

  const { error } = await supabase.from(table).update({ [field]: value }).eq('id', id)
  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ success: true })
}
