import supabase from '../../lib/supabase.js'
import { saveFailsafe } from '../../lib/failsafe.js'

const HEADERS = [
  'Submitted At', 'Colleague Name', 'Customer Name', 'PO Number / React',
  'Number of Items', 'Country of Origin', 'Payment Amount (£)',
  'Date of Payment', 'Time of Payment', 'Transaction Type',
  'Sort Code', 'Account Number', 'Account Holder Name',
  'PayPal Email', 'IBAN', 'BIC / SWIFT Code',
]

function formatSubmission(body) {
  const {
    colleagueName, customerName, poNumber, numberOfItems, countryOfOrigin,
    paymentAmount, dateOfPayment, timeOfPayment, transactionType,
    sortCode, accountNumber, holderName, paypalEmail, iban, bicSwift,
  } = body

  const now = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' })
  const [yr, mo, dy] = (dateOfPayment || '').split('-')
  const formattedDate = yr ? `${dy}/${mo}/${yr}` : ''

  let formattedTime = timeOfPayment || ''
  if (formattedTime) {
    const [h, m] = formattedTime.split(':').map(Number)
    formattedTime = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
  }

  const isBankTransfer = transactionType === 'Bank Transfer'
  const isPaypal = transactionType === 'Paypal'
  const isInternational = transactionType === 'International'

  return {
    submitted_at: now,
    colleague_name: colleagueName,
    customer_name: customerName,
    po_number: poNumber || null,
    number_of_items: parseInt(numberOfItems) || null,
    country_of_origin: countryOfOrigin,
    payment_amount: `£${parseFloat(paymentAmount).toFixed(2)}`,
    date_of_payment: formattedDate,
    time_of_payment: formattedTime,
    transaction_type: transactionType,
    sort_code: isBankTransfer ? (sortCode || null) : null,
    account_number: isBankTransfer ? (accountNumber || null) : null,
    holder_name: isBankTransfer ? (holderName || null) : null,
    paypal_email: isPaypal ? (paypalEmail || null) : null,
    iban: isInternational ? (iban || null) : null,
    bic_swift: isInternational ? (bicSwift || null) : null,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const required = ['colleagueName', 'customerName', 'numberOfItems', 'countryOfOrigin', 'paymentAmount', 'dateOfPayment', 'timeOfPayment', 'transactionType']
  for (const field of required) {
    if (!req.body[field]) return res.status(400).json({ error: `Missing required field: ${field}` })
  }

  const data = formatSubmission(req.body)

  try {
    const { error } = await supabase.from('comms_submissions').insert(data)
    if (error) throw error
    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('[submit-comms] Supabase failed:', err.message)
  }

  // Fallback: Netlify Blobs
  const failsafeFields = {
    'Submitted At': data.submitted_at,
    'Colleague Name': data.colleague_name,
    'Customer Name': data.customer_name,
    'PO Number / React': data.po_number || '',
    'Number of Items': String(data.number_of_items || ''),
    'Country of Origin': data.country_of_origin,
    'Payment Amount (£)': data.payment_amount,
    'Date of Payment': data.date_of_payment,
    'Time of Payment': data.time_of_payment,
    'Transaction Type': data.transaction_type,
    'Sort Code': data.sort_code || '',
    'Account Number': data.account_number || '',
    'Account Holder Name': data.holder_name || '',
    'PayPal Email': data.paypal_email || '',
    'IBAN': data.iban || '',
    'BIC / SWIFT Code': data.bic_swift || '',
  }

  const saved = await saveFailsafe('Comms', failsafeFields)
  if (saved) return res.status(200).json({ success: true, warning: 'Saved via failsafe' })
  return res.status(500).json({ error: 'Submission failed and failsafe unavailable — please try again' })
}
