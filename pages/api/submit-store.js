import { saveFailsafe } from '../../lib/failsafe.js'

const SHEET_NAME = 'Sheet1'

const HEADERS_FULL = [
  'Submitted At', 'Store / Department', 'Colleague Name',
  'Customer Name', 'Customer Email', 'Customer Phone',
  'Payment Amount (£)', 'Date of Payment', 'Time of Payment',
  'Additional Notes', 'Transaction Type',
  'Sort Code', 'Account Number', 'PayPal Email', 'IBAN', 'BIC / SWIFT Code',
  'Consent Given',
]

const HEADERS_NO_BANK = [
  'Submitted At', 'Store / Department', 'Colleague Name',
  'Customer Name', 'Customer Email', 'Customer Phone',
  'Payment Amount (£)', 'Date of Payment', 'Time of Payment',
  'Additional Notes', 'Transaction Type', 'Consent Given',
]

const colLetter = (n) => {
  let s = ''
  while (n > 0) {
    s = String.fromCharCode(65 + ((n - 1) % 26)) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

async function getMSToken() {
  const res = await fetch(
    `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.AZURE_CLIENT_ID,
        client_secret: process.env.AZURE_CLIENT_SECRET,
        scope: 'https://graph.microsoft.com/.default',
      }),
    }
  )
  const json = await res.json()
  if (!res.ok) throw new Error(`Auth failed: ${json.error_description || json.error}`)
  return json.access_token
}

async function graphRequest(token, path, method = 'GET', body) {
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Graph API error ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

async function getFileId(token, userId, fileName) {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${userId}/drive/root:/${encodeURIComponent(fileName)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  if (res.status === 404) throw new Error(`Excel file "${fileName}" not found in OneDrive root.`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Failed to find file (${res.status})`)
  }
  return (await res.json()).id
}

async function appendRow(token, userId, fileId, headers, rowValues) {
  const lastCol = colLetter(headers.length)
  const base = `/users/${userId}/drive/items/${fileId}/workbook/worksheets/${encodeURIComponent(SHEET_NAME)}`

  let nextRow
  try {
    const usedRange = await graphRequest(token, `${base}/usedRange`)
    const rowCount = usedRange.rowCount || 0
    if (rowCount === 0) {
      await graphRequest(token, `${base}/range(address='A1:${lastCol}1')`, 'PATCH', { values: [headers] })
      nextRow = 2
    } else {
      const firstCell = usedRange.values?.[0]?.[0]
      if (typeof firstCell === 'string' && firstCell.toLowerCase().includes('submitted')) {
        nextRow = rowCount + 1
      } else {
        await graphRequest(token, `${base}/range(address='A1:${lastCol}1')`, 'PATCH', { values: [headers] })
        nextRow = rowCount + 2
      }
    }
  } catch {
    nextRow = 2
  }

  await graphRequest(token, `${base}/range(address='A${nextRow}:${lastCol}${nextRow}')`, 'PATCH', { values: [rowValues] })
}

function formatSubmission(body) {
  const { store, colleagueName, customerName, customerEmail, customerPhone, paymentAmount, dateOfPayment, timeOfPayment, additionalNotes, transactionType, sortCode, accountNumber, paypalEmail, iban, bicSwift, consent } = body

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
  const consentVal = consent ? 'Yes' : 'No'

  const fullRow = [
    now, store, colleagueName, customerName,
    customerEmail || '', customerPhone,
    `£${parseFloat(paymentAmount).toFixed(2)}`,
    formattedDate, formattedTime,
    additionalNotes || '',
    transactionType,
    isBankTransfer ? (sortCode || '') : '',
    isBankTransfer ? (accountNumber || '') : '',
    isPaypal ? (paypalEmail || '') : '',
    isInternational ? (iban || '') : '',
    isInternational ? (bicSwift || '') : '',
    consentVal,
  ]

  const noBankRow = [
    now, store, colleagueName, customerName,
    customerEmail || '', customerPhone,
    `£${parseFloat(paymentAmount).toFixed(2)}`,
    formattedDate, formattedTime,
    additionalNotes || '',
    transactionType,
    consentVal,
  ]

  return { fullRow, noBankRow }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const required = ['store', 'colleagueName', 'customerName', 'customerPhone', 'paymentAmount', 'dateOfPayment', 'timeOfPayment', 'transactionType']
  for (const field of required) {
    if (!req.body[field]) return res.status(400).json({ error: `Missing required field: ${field}` })
  }

  if (!req.body.consent) return res.status(400).json({ error: 'Customer consent is required' })

  const { fullRow, noBankRow } = formatSubmission(req.body)
  const userId = process.env.ONEDRIVE_USER_EMAIL
  const azureReady = ['AZURE_TENANT_ID', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET', 'ONEDRIVE_USER_EMAIL'].every(k => process.env[k])

  if (azureReady) {
    try {
      const token = await getMSToken()
      const [fileIdFull, fileIdNoBank] = await Promise.all([
        getFileId(token, userId, 'STORE HOMEMADE.xlsx'),
        getFileId(token, userId, 'STORE HOMEMADE NO BANK.xlsx'),
      ])
      await Promise.all([
        appendRow(token, userId, fileIdFull, HEADERS_FULL, fullRow),
        appendRow(token, userId, fileIdNoBank, HEADERS_NO_BANK, noBankRow),
      ])
      return res.status(200).json({ success: true })
    } catch (err) {
      console.error('[submit-store] Excel write failed:', err.message)
    }
  } else {
    console.warn('[submit-store] Azure not configured — routing to failsafe')
  }

  const saved = await saveFailsafe('Store', HEADERS_FULL, fullRow)
  if (saved) return res.status(200).json({ success: true, warning: 'Saved via failsafe' })
  return res.status(500).json({ error: 'Submission failed and failsafe unavailable — please try again' })
}
