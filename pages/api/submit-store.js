import supabase from '../../lib/supabase.js'
import { saveFailsafe } from '../../lib/failsafe.js'

function formatSubmission(body) {
  const {
    store, colleagueName, customerName, customerEmail, customerPhone,
    paymentAmount, dateOfPayment, timeOfPayment, additionalNotes,
    transactionType, sortCode, accountNumber, paypalEmail, iban, bicSwift, consent,
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
    store,
    colleague_name: colleagueName,
    customer_name: customerName,
    customer_email: customerEmail || null,
    customer_phone: customerPhone,
    payment_amount: `£${parseFloat(paymentAmount).toFixed(2)}`,
    date_of_payment: formattedDate,
    time_of_payment: formattedTime,
    additional_notes: additionalNotes || null,
    transaction_type: transactionType,
    sort_code: isBankTransfer ? (sortCode || null) : null,
    account_number: isBankTransfer ? (accountNumber || null) : null,
    paypal_email: isPaypal ? (paypalEmail || null) : null,
    iban: isInternational ? (iban || null) : null,
    bic_swift: isInternational ? (bicSwift || null) : null,
    consent_given: consent ? 'Yes' : 'No',
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const required = ['store', 'colleagueName', 'customerName', 'customerPhone', 'paymentAmount', 'dateOfPayment', 'timeOfPayment', 'transactionType']
  for (const field of required) {
    if (!req.body[field]) return res.status(400).json({ error: `Missing required field: ${field}` })
  }

  if (!req.body.consent) return res.status(400).json({ error: 'Customer consent is required' })

  const data = formatSubmission(req.body)

  try {
    const { error } = await supabase.from('store_submissions').insert(data)
    if (error) throw error
    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('[submit-store] Supabase failed:', err.message)
  }

  // Fallback: Netlify Blobs
  const failsafeFields = {
    'Submitted At': data.submitted_at,
    'Store / Department': data.store,
    'Colleague Name': data.colleague_name,
    'Customer Name': data.customer_name,
    'Customer Email': data.customer_email || '',
    'Customer Phone': data.customer_phone,
    'Payment Amount (£)': data.payment_amount,
    'Date of Payment': data.date_of_payment,
    'Time of Payment': data.time_of_payment,
    'Additional Notes': data.additional_notes || '',
    'Transaction Type': data.transaction_type,
    'Sort Code': data.sort_code || '',
    'Account Number': data.account_number || '',
    'PayPal Email': data.paypal_email || '',
    'IBAN': data.iban || '',
    'BIC / SWIFT Code': data.bic_swift || '',
    'Consent Given': data.consent_given,
  }

  const saved = await saveFailsafe('Store', failsafeFields)
  if (saved) return res.status(200).json({ success: true, warning: 'Saved via failsafe' })
  return res.status(500).json({ error: 'Submission failed and failsafe unavailable — please try again' })
}
