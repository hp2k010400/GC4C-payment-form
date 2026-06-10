import Head from 'next/head'
import { useState, useEffect, useCallback } from 'react'

const LOGO_URL = 'https://cdn.shopify.com/s/files/1/0559/0450/1875/files/GC4C_SVG_Logo.svg?v=1745920148'

const COMMS_COLUMNS = [
  { key: 'submitted_at',      label: 'Submitted At',      finance: false },
  { key: 'colleague_name',    label: 'Colleague Name',    finance: false },
  { key: 'po_number',         label: 'PO Number / React', finance: false },
  { key: 'number_of_items',   label: 'Items',             finance: false },
  { key: 'country_of_origin', label: 'Country',           finance: false },
  { key: 'payment_amount',    label: 'Amount',            finance: false },
  { key: 'date_of_payment',   label: 'Date',              finance: false },
  { key: 'time_of_payment',   label: 'Time',              finance: false },
  { key: 'transaction_type',  label: 'Transaction Type',  finance: false },
  { key: 'customer_name',     label: 'Customer Name',     finance: false },
  { key: 'sort_code',         label: 'Sort Code',         finance: true  },
  { key: 'account_number',    label: 'Account No.',       finance: true  },
  { key: 'holder_name',       label: 'Holder Name',       finance: true  },
  { key: 'paypal_email',      label: 'PayPal Email',      finance: true  },
  { key: 'iban',              label: 'IBAN',              finance: true  },
  { key: 'bic_swift',         label: 'BIC / SWIFT',       finance: true  },
]

const STORE_COLUMNS = [
  { key: 'submitted_at',      label: 'Submitted At',      finance: false },
  { key: 'store',             label: 'Store',             finance: false },
  { key: 'colleague_name',    label: 'Colleague Name',    finance: false },
  { key: 'payment_amount',    label: 'Amount',            finance: false },
  { key: 'date_of_payment',   label: 'Date',              finance: false },
  { key: 'time_of_payment',   label: 'Time',              finance: false },
  { key: 'additional_notes',  label: 'Notes',             finance: false },
  { key: 'transaction_type',  label: 'Transaction Type',  finance: false },
  { key: 'consent_given',     label: 'Consent',           finance: false },
  { key: 'customer_name',     label: 'Customer Name',     finance: false },
  { key: 'customer_email',    label: 'Email',             finance: false },
  { key: 'customer_phone',    label: 'Phone',             finance: false },
  { key: 'sort_code',         label: 'Sort Code',         finance: true  },
  { key: 'account_number',    label: 'Account No.',       finance: true  },
  { key: 'paypal_email',      label: 'PayPal Email',      finance: true  },
  { key: 'iban',              label: 'IBAN',              finance: true  },
  { key: 'bic_swift',         label: 'BIC / SWIFT',       finance: true  },
]

const isCopyable = col => col.finance || col.key === 'customer_name'

function LockIcon({ open }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

export default function AdminPage() {
  const [tab, setTab] = useState('comms')
  const [rows, setRows] = useState([])
  const [isFinance, setIsFinance] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [filterDate, setFilterDate] = useState('')
  const [copied, setCopied] = useState(false)
  const [marching, setMarching] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const fetchData = useCallback(async (activeTab, silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin-data?tab=${activeTab}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load data')
      setRows(json.rows || [])
      setIsFinance(json.isFinance || false)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData(tab) }, [tab, fetchData])

  useEffect(() => {
    const interval = setInterval(() => fetchData(tab, true), 30000)
    return () => clearInterval(interval)
  }, [tab, fetchData])

  async function handleFinanceAuth(e) {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')
    try {
      const res = await fetch('/api/finance-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const json = await res.json()
      if (!res.ok) { setAuthError(json.error || 'Incorrect password'); return }
      setShowModal(false)
      setPassword('')
      await fetchData(tab)
    } catch {
      setAuthError('Something went wrong — please try again')
    } finally {
      setAuthLoading(false)
    }
  }

  function exportCSV() {
    const allCols = tab === 'store' ? STORE_COLUMNS : COMMS_COLUMNS
    const columns = allCols.filter(c => isFinance || !c.finance)
    const escape = v => {
      const s = String(v ?? '')
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
    }
    const header = columns.map(c => escape(c.label)).join(',')
    const body = filteredRows.map(row => columns.map(c => escape(row[c.key] ?? '')).join(',')).join('\n')
    const csv = '﻿' + header + '\n' + body
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gc4c-${tab}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const allCols = tab === 'store' ? STORE_COLUMNS : COMMS_COLUMNS
  const visibleCols = allCols.filter(c => isFinance || !c.finance)

  const filterDateFormatted = filterDate ? filterDate.split('-').reverse().join('/') : ''
  const filteredRows = filterDate
    ? rows.filter(r => r.date_of_payment === filterDateFormatted)
    : rows

  function setToday() {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    setFilterDate(`${yyyy}-${mm}-${dd}`)
  }

  function copyAll() {
    const cols = visibleCols.filter(isCopyable)
    const body = filteredRows.map(row => cols.map(c => row[c.key] || '').join('\t')).join('\n')
    navigator.clipboard.writeText(body)
    setMarching(true)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  useEffect(() => {
    if (!marching) return
    const handleKey = e => { if (e.key === 'Escape') setMarching(false) }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [marching])

  useEffect(() => { setMarching(false) }, [tab, filterDate])

  return (
    <>
      <Head>
        <title>GC4C — Payment Admin</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{CSS}</style>
      </Head>

      <div className="admin-page">
        {/* Header */}
        <header className="admin-header">
          <img src={LOGO_URL} alt="GolfClubs4Cash" className="admin-logo" />
          <span className="admin-title">Payment Admin</span>
          <div className="admin-header-right">
            {isFinance ? (
              <div className="finance-badge">
                <LockIcon open />
                Finance Mode Active
              </div>
            ) : (
              <button className="finance-btn" onClick={() => setShowModal(true)}>
                <LockIcon open={false} />
                Finance View
              </button>
            )}
          </div>
        </header>

        {/* Toolbar */}
        <div className="admin-toolbar">
          <div className="admin-tabs">
            <button
              className={`tab-btn${tab === 'comms' ? ' tab-active' : ''}`}
              onClick={() => setTab('comms')}
            >
              Comms
            </button>
            <button
              className={`tab-btn${tab === 'store' ? ' tab-active' : ''}`}
              onClick={() => setTab('store')}
            >
              Store
            </button>
          </div>
          <div className="toolbar-right">
            <div className="date-filter">
              <input
                type="date"
                className="date-input"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
              />
              <button className="date-quick-btn" onClick={setToday}>Today</button>
              {filterDate && <button className="date-clear-btn" onClick={() => setFilterDate('')}>✕</button>}
            </div>
            {lastUpdated && !loading && (
              <span className="row-count">
                {filteredRows.length}{filterDate ? ` of ${rows.length}` : ''} submission{filteredRows.length !== 1 ? 's' : ''}
              </span>
            )}
            <button className="refresh-btn" onClick={() => fetchData(tab, true)} disabled={refreshing || loading} title="Refresh">↻</button>
            <button className="copy-all-btn" onClick={copyAll} disabled={filteredRows.length === 0 || loading}>
              {copied ? '✓ Copied' : 'Copy all'}
            </button>
            <button className="export-btn" onClick={exportCSV} disabled={filteredRows.length === 0 || loading}>
              Export CSV
            </button>
          </div>
        </div>

        {/* Table area */}
        <div className="admin-content">
          {loading && (
            <div className="admin-state">
              <div className="spinner" />
              <span>Loading submissions…</span>
            </div>
          )}

          {error && !loading && (
            <div className="admin-state error-state">
              <p>Could not load data: {error}</p>
              <button onClick={() => fetchData(tab)}>Try again</button>
            </div>
          )}

          {!loading && !error && filteredRows.length === 0 && (
            <div className="admin-state">
              <p>{filterDate ? `No submissions for ${filterDateFormatted}.` : `No submissions yet for ${tab === 'comms' ? 'Comms' : 'Store'}.`}</p>
            </div>
          )}

          {!loading && !error && filteredRows.length > 0 && (
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    {visibleCols.map(col => (
                      <th key={col.key} className={col.finance ? 'col-finance' : ''}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row, i) => (
                    <tr key={row.id || i}>
                      {visibleCols.map(col => {
                        const copyable = isCopyable(col)
                        const cls = [
                          col.finance ? 'col-finance' : '',
                          isFinance && copyable ? 'cell-copyable' : '',
                          isFinance && copyable && marching ? 'cell-marching' : '',
                        ].filter(Boolean).join(' ')
                        return (
                          <td key={col.key} className={cls}>
                            {row[col.key] != null && row[col.key] !== '' ? row[col.key] : '—'}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Finance modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setAuthError(''); setPassword('') }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">
              <LockIcon open={false} />
            </div>
            <h2 className="modal-title">Finance View</h2>
            <p className="modal-subtitle">Enter the finance password to unlock bank details</p>
            <form onSubmit={handleFinanceAuth}>
              <input
                className="modal-input"
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setAuthError('') }}
                placeholder="Password"
                autoFocus
              />
              {authError && <div className="modal-error">{authError}</div>}
              <button type="submit" className="modal-btn-primary" disabled={authLoading || !password}>
                {authLoading ? 'Checking…' : 'Unlock'}
              </button>
              <button
                type="button"
                className="modal-btn-secondary"
                onClick={() => { setShowModal(false); setAuthError(''); setPassword('') }}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { height: 100%; }
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f3f4f6; color: #111827; font-size: 14px; }

  /* Layout */
  .admin-page { min-height: 100vh; display: flex; flex-direction: column; }

  /* Header */
  .admin-header {
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
    height: 60px;
    padding: 0 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .admin-logo { height: 36px; width: auto; object-fit: contain; }
  .admin-title { font-size: 16px; font-weight: 700; color: #111827; flex: 1; }
  .admin-header-right { display: flex; align-items: center; gap: 12px; }

  /* Finance badge / button */
  .finance-badge {
    display: flex; align-items: center; gap: 7px;
    background: #ecfdf5; color: #065f46;
    border: 1px solid #a7f3d0;
    padding: 7px 14px; border-radius: 8px;
    font-size: 13px; font-weight: 600;
  }
  .finance-btn {
    display: flex; align-items: center; gap: 7px;
    background: #fff; color: #374151;
    border: 1.5px solid #d1d5db;
    padding: 7px 14px; border-radius: 8px;
    font-size: 13px; font-weight: 600;
    cursor: pointer; font-family: inherit;
    transition: border-color 0.15s, background 0.15s;
  }
  .finance-btn:hover { border-color: #005F2C; color: #005F2C; background: #f0faf4; }

  /* Toolbar */
  .admin-toolbar {
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
  }
  .admin-tabs { display: flex; gap: 4px; }
  .tab-btn {
    padding: 8px 20px; border-radius: 8px; border: none;
    font-size: 14px; font-weight: 600; font-family: inherit;
    cursor: pointer; color: #6b7280; background: transparent;
    transition: background 0.15s, color 0.15s;
  }
  .tab-btn:hover { background: #f3f4f6; color: #111827; }
  .tab-active { background: #005F2C !important; color: #fff !important; }
  .toolbar-right { display: flex; align-items: center; gap: 12px; }
  .row-count { font-size: 13px; color: #9ca3af; font-weight: 500; }
  .refresh-btn {
    width: 34px; height: 34px; border-radius: 8px;
    border: 1.5px solid #d1d5db; background: #fff;
    font-size: 18px; cursor: pointer; color: #6b7280;
    display: flex; align-items: center; justify-content: center;
    transition: border-color 0.15s, color 0.15s;
    line-height: 1;
  }
  .refresh-btn:hover:not(:disabled) { border-color: #005F2C; color: #005F2C; }
  .refresh-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .export-btn {
    padding: 8px 16px; border-radius: 8px;
    border: 1.5px solid #005F2C; color: #005F2C;
    background: #fff; font-size: 13px; font-weight: 600;
    font-family: inherit; cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .export-btn:hover:not(:disabled) { background: #005F2C; color: #fff; }
  .export-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Content */
  .admin-content { flex: 1; padding: 24px; }

  /* States */
  .admin-state {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 16px;
    min-height: 240px; color: #6b7280; font-size: 15px;
  }
  .error-state { color: #b91c1c; }
  .error-state button {
    padding: 8px 20px; background: #005F2C; color: #fff;
    border: none; border-radius: 8px; cursor: pointer;
    font-size: 14px; font-weight: 600; font-family: inherit;
  }
  .spinner {
    width: 32px; height: 32px; border-radius: 50%;
    border: 3px solid #e5e7eb;
    border-top-color: #005F2C;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Table */
  .table-wrap {
    background: #fff;
    border-radius: 12px;
    border: 1px solid #e5e7eb;
    overflow-x: auto;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  }
  .admin-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    white-space: nowrap;
  }
  .admin-table thead th {
    background: #f9fafb;
    padding: 11px 14px;
    text-align: left;
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #6b7280;
    border-bottom: 1px solid #e5e7eb;
    position: sticky;
    top: 0;
  }
  .admin-table tbody tr { border-bottom: 1px solid #f3f4f6; }
  .admin-table tbody tr:last-child { border-bottom: none; }
  .admin-table tbody tr:hover { background: #f9fafb; }
  .admin-table td {
    padding: 10px 14px;
    color: #374151;
    max-width: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .admin-table td:first-child, .admin-table th:first-child { padding-left: 20px; }
  .admin-table td:last-child, .admin-table th:last-child { padding-right: 20px; }

  /* Finance columns highlight */
  .col-finance { background: #fffbeb !important; }
  thead .col-finance { background: #fef3c7 !important; color: #92400e !important; }

  /* Table cells — non-copyable are not selectable */
  .admin-table td { -webkit-user-select: none !important; user-select: none !important; cursor: default; }
  .cell-copyable { -webkit-user-select: text !important; user-select: text !important; cursor: text; }

  /* Marching ants — Excel-style dashed animated border on copyable cells */
  @keyframes marchAnts {
    0%   { background-position: 0 0, 100% 0, 0 100%, 0 0; }
    100% { background-position: 14px 0, 100% 14px, -14px 100%, 0 -14px; }
  }
  .cell-marching {
    background-image:
      repeating-linear-gradient(90deg, #16a34a 0, #16a34a 7px, transparent 7px, transparent 14px),
      repeating-linear-gradient(180deg, #16a34a 0, #16a34a 7px, transparent 7px, transparent 14px),
      repeating-linear-gradient(90deg, #16a34a 0, #16a34a 7px, transparent 7px, transparent 14px),
      repeating-linear-gradient(180deg, #16a34a 0, #16a34a 7px, transparent 7px, transparent 14px);
    background-size: 14px 2px, 2px 14px, 14px 2px, 2px 14px;
    background-position: 0 0, 100% 0, 0 100%, 0 0;
    background-repeat: repeat-x, repeat-y, repeat-x, repeat-y;
    background-color: #f0fdf4 !important;
    animation: marchAnts 0.35s linear infinite;
  }

  /* Date filter */
  .date-filter { display: flex; align-items: center; gap: 6px; }
  .date-input {
    padding: 7px 10px; border: 1.5px solid #d1d5db; border-radius: 8px;
    font-size: 13px; font-family: inherit; color: #374151;
    outline: none; cursor: pointer;
  }
  .date-input:focus { border-color: #005F2C; }
  .date-quick-btn {
    padding: 7px 12px; border-radius: 8px; border: 1.5px solid #d1d5db;
    background: #fff; font-size: 13px; font-weight: 600; font-family: inherit;
    cursor: pointer; color: #374151; transition: border-color 0.15s, color 0.15s;
    white-space: nowrap;
  }
  .date-quick-btn:hover { border-color: #005F2C; color: #005F2C; }
  .date-clear-btn {
    width: 28px; height: 28px; border-radius: 50%; border: none;
    background: #e5e7eb; color: #6b7280; font-size: 12px;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: background 0.15s;
  }
  .date-clear-btn:hover { background: #d1d5db; }

  /* Copy all button */
  .copy-all-btn {
    padding: 8px 14px; border-radius: 8px;
    border: 1.5px solid #d1d5db; color: #374151;
    background: #fff; font-size: 13px; font-weight: 600;
    font-family: inherit; cursor: pointer; white-space: nowrap;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
  }
  .copy-all-btn:hover:not(:disabled) { border-color: #005F2C; color: #005F2C; background: #f0faf4; }
  .copy-all-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* Modal */
  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.45);
    display: flex; align-items: center; justify-content: center;
    z-index: 200;
    backdrop-filter: blur(2px);
  }
  .modal {
    background: #fff; border-radius: 16px;
    padding: 36px 40px; width: 100%; max-width: 400px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    display: flex; flex-direction: column; align-items: center; gap: 12px;
  }
  .modal-icon {
    width: 52px; height: 52px; border-radius: 50%;
    background: #f3f4f6; display: flex; align-items: center; justify-content: center;
    color: #374151; margin-bottom: 4px;
  }
  .modal-title { font-size: 20px; font-weight: 700; color: #111827; text-align: center; }
  .modal-subtitle { font-size: 14px; color: #6b7280; text-align: center; line-height: 1.5; }
  .modal form { width: 100%; display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
  .modal-input {
    width: 100%; padding: 13px 16px;
    border: 1.5px solid #d1d5db; border-radius: 8px;
    font-size: 16px; font-family: inherit; color: #111827;
    outline: none; transition: border-color 0.15s;
  }
  .modal-input:focus { border-color: #005F2C; box-shadow: 0 0 0 3px rgba(0,95,44,0.1); }
  .modal-error { font-size: 13.5px; color: #dc2626; font-weight: 500; text-align: center; }
  .modal-btn-primary {
    width: 100%; padding: 14px;
    background: #005F2C; color: #fff;
    border: none; border-radius: 10px;
    font-size: 16px; font-weight: 600; font-family: inherit;
    cursor: pointer; transition: background 0.15s;
  }
  .modal-btn-primary:hover:not(:disabled) { background: #004a23; }
  .modal-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .modal-btn-secondary {
    width: 100%; padding: 12px;
    background: #fff; color: #6b7280;
    border: 1.5px solid #e5e7eb; border-radius: 10px;
    font-size: 15px; font-weight: 500; font-family: inherit;
    cursor: pointer; transition: border-color 0.15s;
  }
  .modal-btn-secondary:hover { border-color: #9ca3af; color: #374151; }
`
