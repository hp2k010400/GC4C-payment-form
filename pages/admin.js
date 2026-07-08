import Head from 'next/head'
import { useState, useEffect, useCallback } from 'react'

const LOGO_URL = 'https://cdn.shopify.com/s/files/1/0559/0450/1875/files/GC4C_SVG_Logo.svg?v=1745920148'

const TX_TYPES = ['Bank Transfer', 'Paypal', 'International', 'Store Credit']

const COMMS_COLUMNS = [
  { key: 'submitted_at',      label: 'Submitted At',      finance: false },
  { key: 'colleague_name',    label: 'Colleague Name',    finance: false, filterOptions: ['Christopher Smith','David Keogh','Euan Russel','Mark Stewart','Phil Mack','Phillip Barron','Robert Campbell','Samantha Smith','Daniel Allan','David Malloy','Colin Grant','James Malloy','Carter Jerome','Jamie Sinclair','Ross Murray','Jack Hewitt','Jakob Dalland','Declan Bickerton','Nathan Free','Southampton','Milton Keynes'] },
  { key: 'po_number',         label: 'PO Number / React', finance: false },
  { key: 'number_of_items',   label: 'Items',             finance: false },
  { key: 'country_of_origin', label: 'Country',           finance: false },
  { key: 'date_of_payment',   label: 'Date',              finance: false },
  { key: 'time_of_payment',   label: 'Time',              finance: false },
  { key: 'transaction_type',  label: 'Transaction Type',  finance: false, filterOptions: TX_TYPES },
  { key: 'customer_name',     label: 'Customer Name',     finance: false },
  { key: 'sort_code',         label: 'Sort Code',         finance: true  },
  { key: 'account_number',    label: 'Account No.',       finance: true  },
  { key: 'payment_amount',    label: 'Amount',            finance: false },
  { key: 'holder_name',       label: 'Holder Name',       finance: true  },
  { key: 'paypal_email',      label: 'PayPal Email',      finance: true  },
  { key: 'iban',              label: 'IBAN',              finance: true  },
  { key: 'bic_swift',         label: 'BIC / SWIFT',       finance: true  },
]

const STORE_COLUMNS = [
  { key: 'submitted_at',      label: 'Submitted At',      finance: false },
  { key: 'store',             label: 'Store',             finance: false, filterOptions: ['Edinburgh','Milton Keynes','Warrington','Southampton'] },
  { key: 'colleague_name',    label: 'Colleague Name',    finance: false },
  { key: 'date_of_payment',   label: 'Date',              finance: false },
  { key: 'time_of_payment',   label: 'Time',              finance: false },
  { key: 'additional_notes',  label: 'Notes',             finance: false },
  { key: 'transaction_type',  label: 'Transaction Type',  finance: false, filterOptions: TX_TYPES },
  { key: 'consent_given',     label: 'Consent',           finance: false, filterOptions: ['Yes','No'] },
  { key: 'customer_name',     label: 'Customer Name',     finance: false },
  { key: 'customer_email',    label: 'Email',             finance: false },
  { key: 'customer_phone',    label: 'Phone',             finance: false },
  { key: 'sort_code',         label: 'Sort Code',         finance: true  },
  { key: 'account_number',    label: 'Account No.',       finance: true  },
  { key: 'payment_amount',    label: 'Amount',            finance: false },
  { key: 'paypal_email',      label: 'PayPal Email',      finance: true  },
  { key: 'iban',              label: 'IBAN',              finance: true  },
  { key: 'bic_swift',         label: 'BIC / SWIFT',       finance: true  },
]

const COPY_KEYS = new Set(['customer_name', 'sort_code', 'account_number', 'payment_amount'])
const isCopyable = col => COPY_KEYS.has(col.key)

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
  const [filterDateTo, setFilterDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState({})
  const [showFilters, setShowFilters] = useState(false)
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [viewMode, setViewMode] = useState('table')
  const [summaryPeriod, setSummaryPeriod] = useState('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [editingCell, setEditingCell] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [copied, setCopied] = useState(false)
  const [marchingIds, setMarchingIds] = useState(new Set())
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
  const filteredRows = rows
    .filter(r => {
      if (!filterDate) return true
      const d = parsePaymentDate(r.date_of_payment)
      if (!d) return false
      const from = new Date(filterDate); from.setHours(0,0,0,0)
      if (d < from) return false
      if (filterDateTo) { const to = new Date(filterDateTo); to.setHours(23,59,59,999); if (d > to) return false }
      else if (d > new Date(filterDate + 'T23:59:59')) return false
      return true
    })
    .filter(r => {
      if (!statusFilter) return true
      if (statusFilter === 'none') return !r.status
      return r.status === statusFilter
    })
    .filter(r => Object.entries(columnFilters).every(([key, val]) => {
      if (!val) return true
      const col = allCols.find(c => c.key === key)
      return col?.filterOptions ? r[key] === val : String(r[key] || '').toLowerCase().includes(val.toLowerCase())
    }))

  function setToday() {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    setFilterDate(`${yyyy}-${mm}-${dd}`)
  }

  function copyRows(rowsToCopy) {
    const cols = visibleCols.filter(isCopyable)
    const body = rowsToCopy.map(row => cols.map(c => row[c.key] || '').join('\t')).join('\n')
    navigator.clipboard.writeText(body)
    setMarchingIds(new Set(rowsToCopy.map(r => r.id)))
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  function copyAll() { copyRows(filteredRows) }
  function copySelected() { copyRows(filteredRows.filter(r => selectedRows.has(r.id))) }

  useEffect(() => {
    if (marchingIds.size === 0) return
    const handleKey = e => { if (e.key === 'Escape') setMarchingIds(new Set()) }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [marchingIds])

  useEffect(() => { setMarchingIds(new Set()) }, [tab, filterDate])
  useEffect(() => { setColumnFilters({}); setSelectedRows(new Set()); setFilterDateTo(''); setStatusFilter('') }, [tab])

  function toggleRow(id) {
    setSelectedRows(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelectedRows(prev =>
      prev.size === filteredRows.length ? new Set() : new Set(filteredRows.map(r => r.id))
    )
  }

  async function batchStatus(status) {
    const table = tab === 'store' ? 'store_submissions' : 'comms_submissions'
    const ids = [...selectedRows]
    setRows(prev => prev.map(r => selectedRows.has(r.id) ? { ...r, status } : r))
    setSelectedRows(new Set())
    await Promise.all(ids.map(id =>
      fetch('/api/admin-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, table, status }),
      })
    ))
  }

  function parsePaymentDate(str) {
    if (!str) return null
    const [d, m, y] = str.split('/')
    if (!d || !m || !y) return null
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d))
  }

  function inPeriod(dateStr) {
    const d = parsePaymentDate(dateStr)
    if (!d) return false
    const now = new Date()
    if (summaryPeriod === 'day') return d.toDateString() === now.toDateString()
    if (summaryPeriod === 'week') {
      const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7)); mon.setHours(0,0,0,0)
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999)
      return d >= mon && d <= sun
    }
    if (summaryPeriod === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    if (summaryPeriod === 'custom') {
      if (customFrom && d < new Date(customFrom + 'T00:00:00')) return false
      if (customTo) { const to = new Date(customTo + 'T00:00:00'); to.setHours(23,59,59,999); if (d > to) return false }
      return true
    }
    return true
  }

  function buildSummary() {
    const periodRows = rows.filter(r => inPeriod(r.date_of_payment))
    const grouped = {}
    periodRows.forEach(r => {
      const name = r.colleague_name || 'Unknown'
      if (!grouped[name]) grouped[name] = { name, count: 0, items: 0, total: 0 }
      grouped[name].count++
      grouped[name].items += parseInt(r.number_of_items) || 0
      grouped[name].total += parseFloat((r.payment_amount || '').replace(/[£,]/g, '')) || 0
    })
    return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name))
  }

  function startEdit(row, col) {
    if (col.key === 'submitted_at') return
    setEditingCell({ rowId: row.id, colKey: col.key })
    setEditValue(row[col.key] || '')
  }

  async function saveEdit() {
    if (!editingCell) return
    const { rowId, colKey } = editingCell
    const table = tab === 'store' ? 'store_submissions' : 'comms_submissions'
    const prev = rows.find(r => r.id === rowId)?.[colKey]
    setRows(p => p.map(r => r.id === rowId ? { ...r, [colKey]: editValue } : r))
    setEditingCell(null)
    try {
      const res = await fetch('/api/admin-edit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: rowId, table, field: colKey, value: editValue }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setRows(p => p.map(r => r.id === rowId ? { ...r, [colKey]: prev } : r))
    }
  }

  async function cycleStatus(row) {
    const cycle = [null, 'complete', 'void', 'incorrect']
    const current = row.status || null
    const next = cycle[(cycle.indexOf(current) + 1) % cycle.length]
    const table = tab === 'store' ? 'store_submissions' : 'comms_submissions'
    setRows(prev => prev.map(r => r.id === row.id ? { ...r, status: next } : r))
    try {
      const res = await fetch('/api/admin-status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, table, status: next }),
      })
      if (!res.ok) throw new Error()
    } catch {
      setRows(prev => prev.map(r => r.id === row.id ? { ...r, status: current } : r))
    }
  }

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
                <button className="finance-signout" onClick={async () => {
                  await fetch('/api/finance-logout', { method: 'POST' })
                  await fetchData(tab)
                }} title="Sign out of finance mode">✕</button>
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
            <button className={`tab-btn${tab === 'comms' ? ' tab-active' : ''}`} onClick={() => { setTab('comms'); setViewMode('table') }}>Comms</button>
            <button className={`tab-btn${tab === 'store' ? ' tab-active' : ''}`} onClick={() => { setTab('store'); setViewMode('table') }}>Store</button>
            <div className="tab-divider" />
            <button className={`tab-btn${viewMode === 'summary' ? ' tab-active' : ''}`} onClick={() => setViewMode(v => v === 'summary' ? 'table' : 'summary')}>Summary</button>
          </div>
          <div className="toolbar-right">
            {isFinance && (
              <div className="status-legend">
                <span className="legend-dot dot-complete" />Complete
                <span className="legend-dot dot-void" />Void
                <span className="legend-dot dot-incorrect" />Incorrect
              </div>
            )}
            <button
              className={`filter-toggle-btn${showFilters ? ' filter-toggle-active' : ''}`}
              onClick={() => { setShowFilters(f => !f); setColumnFilters({}) }}
            >
              Filter columns
            </button>
            <select
              className="status-filter-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              <option value="none">Unprocessed</option>
              <option value="complete">Complete</option>
              <option value="void">Void</option>
              <option value="incorrect">Incorrect</option>
            </select>
            <div className="date-filter">
              <input type="date" className="date-input" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
              <span className="date-range-sep">→</span>
              <input type="date" className="date-input" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} min={filterDate || undefined} />
              <button className="date-quick-btn" onClick={() => {
                const d = new Date(); d.setDate(d.getDate() - 1)
                const s = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
                setFilterDate(s); setFilterDateTo('')
              }}>Yesterday</button>
              <button className="date-quick-btn" onClick={() => { setToday(); setFilterDateTo('') }}>Today</button>
              {(filterDate || filterDateTo) && <button className="date-clear-btn" onClick={() => { setFilterDate(''); setFilterDateTo('') }}>✕</button>}
            </div>
            {lastUpdated && !loading && (
              <span className="row-count">
                {filteredRows.length}{(filterDate || filterDateTo || statusFilter || Object.values(columnFilters).some(Boolean)) ? ` of ${rows.length}` : ''} submission{filteredRows.length !== 1 ? 's' : ''}
              </span>
            )}
            <button className="refresh-btn" onClick={() => fetchData(tab, true)} disabled={refreshing || loading} title="Refresh">↻</button>
            {selectedRows.size > 0 && (
              <button className="copy-all-btn" onClick={copySelected}>
                {copied ? '✓ Copied' : `Copy selected (${selectedRows.size})`}
              </button>
            )}
            <button className="copy-all-btn" onClick={copyAll} disabled={filteredRows.length === 0 || loading}>
              {copied ? '✓ Copied' : 'Copy all'}
            </button>
            <button className="export-btn" onClick={exportCSV} disabled={filteredRows.length === 0 || loading}>
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary view */}
        {viewMode === 'summary' && (
          <div className="admin-content">
            <div className="summary-wrap">
              <div className="summary-period-bar">
                {['day','week','month','custom'].map(p => (
                  <button key={p} className={`period-btn${summaryPeriod === p ? ' period-active' : ''}`} onClick={() => setSummaryPeriod(p)}>
                    {p === 'day' ? 'Today' : p === 'week' ? 'This Week' : p === 'month' ? 'This Month' : 'Custom'}
                  </button>
                ))}
                {summaryPeriod === 'custom' && (
                  <div className="custom-range">
                    <input type="date" className="date-input" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
                    <span style={{color:'#9ca3af'}}>→</span>
                    <input type="date" className="date-input" value={customTo} onChange={e => setCustomTo(e.target.value)} />
                  </div>
                )}
              </div>
              {(() => {
                const summary = buildSummary()
                const grandCount = summary.reduce((s, r) => s + r.count, 0)
                const grandItems = summary.reduce((s, r) => s + r.items, 0)
                const grandTotal = summary.reduce((s, r) => s + r.total, 0)
                return (
                  <div className="table-wrap">
                    <table className="admin-table summary-table">
                      <thead>
                        <tr>
                          <th>Row Labels</th>
                          <th>Number of Trades</th>
                          <th>Sum of Number of Items</th>
                          <th>Sum of Payment Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.length === 0 && (
                          <tr><td colSpan={4} style={{textAlign:'center',color:'#9ca3af',padding:'32px'}}>No data for this period</td></tr>
                        )}
                        {summary.map(r => (
                          <tr key={r.name}>
                            <td>{r.name}</td>
                            <td>{r.count.toLocaleString()}</td>
                            <td>{r.items.toLocaleString()}</td>
                            <td className="summary-amount">£{r.total.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="summary-grand-total">
                          <td>Grand Total</td>
                          <td>{grandCount.toLocaleString()}</td>
                          <td>{grandItems.toLocaleString()}</td>
                          <td className="summary-amount">£{grandTotal.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )
              })()}

              {tab === 'store' && (() => {
                const periodRows = rows.filter(r => inPeriod(r.date_of_payment))
                const storeGrouped = {}
                periodRows.forEach(r => {
                  const s = r.store || 'Unknown'
                  if (!storeGrouped[s]) storeGrouped[s] = { name: s, count: 0, total: 0 }
                  storeGrouped[s].count++
                  storeGrouped[s].total += parseFloat((r.payment_amount || '').replace(/[£,]/g, '')) || 0
                })
                const storeTotals = Object.values(storeGrouped).sort((a, b) => a.name.localeCompare(b.name))
                const storeGrandCount = storeTotals.reduce((s, r) => s + r.count, 0)
                const storeGrandTotal = storeTotals.reduce((s, r) => s + r.total, 0)
                return storeTotals.length > 0 ? (
                  <div style={{marginTop: 32}}>
                    <h3 style={{fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 12}}>By Store Location</h3>
                    <div className="table-wrap">
                      <table className="admin-table summary-table">
                        <thead>
                          <tr>
                            <th>Store</th>
                            <th>Number of Trades</th>
                            <th>Sum of Payment Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {storeTotals.map(r => (
                            <tr key={r.name}>
                              <td>{r.name}</td>
                              <td>{r.count.toLocaleString()}</td>
                              <td className="summary-amount">£{r.total.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="summary-grand-total">
                            <td>Grand Total</td>
                            <td>{storeGrandCount.toLocaleString()}</td>
                            <td className="summary-amount">£{storeGrandTotal.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ) : null
              })()}
            </div>
          </div>
        )}

        {/* Table area */}
        {viewMode === 'table' && <div className="admin-content">
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
                    {isFinance && (
                      <th className="col-status-hd">
                        <input
                          type="checkbox"
                          className="row-checkbox"
                          checked={filteredRows.length > 0 && filteredRows.every(r => selectedRows.has(r.id))}
                          onChange={toggleAll}
                          title="Select all"
                        />
                      </th>
                    )}
                    {visibleCols.map(col => (
                      <th key={col.key} className={col.finance ? 'col-finance' : ''}>
                        {col.label}
                      </th>
                    ))}
                  </tr>
                  {showFilters && (
                    <tr className="filter-row">
                      {isFinance && <th className="col-status-hd" />}
                      {visibleCols.map(col => (
                        <th key={col.key} className={col.finance ? 'col-finance' : ''}>
                          {col.filterOptions ? (
                            <select
                              className="col-filter-select"
                              value={columnFilters[col.key] || ''}
                              onChange={e => setColumnFilters(f => ({ ...f, [col.key]: e.target.value }))}
                            >
                              <option value="">All</option>
                              {col.filterOptions.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <input
                              className="col-filter-input"
                              value={columnFilters[col.key] || ''}
                              onChange={e => setColumnFilters(f => ({ ...f, [col.key]: e.target.value }))}
                              placeholder="Filter…"
                            />
                          )}
                        </th>
                      ))}
                    </tr>
                  )}
                </thead>
                <tbody>
                  {filteredRows.map((row, i) => {
                    const rowStatus = row.status || 'none'
                    const cells = visibleCols.map(col => {
                      const copyable = isCopyable(col)
                      const cls = [
                        col.finance ? 'col-finance' : '',
                        isFinance && copyable ? 'cell-copyable' : '',
                        isFinance && copyable && marchingIds.has(row.id) ? 'cell-marching' : '',
                      ].filter(Boolean).join(' ')
                      const isEditing = editingCell?.rowId === row.id && editingCell?.colKey === col.key
                      return (
                        <td
                          key={col.key}
                          className={`${cls}${col.key !== 'submitted_at' ? ' cell-editable' : ''}`}
                          onDoubleClick={() => startEdit(row, col)}
                          title={col.key !== 'submitted_at' ? 'Double-click to edit' : undefined}
                        >
                          {isEditing ? (
                            <input
                              className="cell-edit-input"
                              autoFocus
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onBlur={saveEdit}
                              onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingCell(null) }}
                            />
                          ) : (
                            row[col.key] != null && row[col.key] !== '' ? (col.key === 'payment_amount' ? String(row[col.key]).replace(/^£/, '') : row[col.key]) : '—'
                          )}
                        </td>
                      )
                    })
                    return (
                      <tr key={row.id || i} className={`row-status-${rowStatus}`}>
                        {isFinance && (
                          <td className="col-status-cell">
                            <input
                              type="checkbox"
                              className="row-checkbox"
                              checked={selectedRows.has(row.id)}
                              onChange={() => toggleRow(row.id)}
                            />
                            <button
                              className={`status-dot dot-${rowStatus}`}
                              onClick={() => cycleStatus(row)}
                              title={rowStatus === 'none' ? 'Click to mark complete' : `Status: ${rowStatus} — click to cycle`}
                            />
                          </td>
                        )}
                        {cells}
                      </tr>
                    )
                  })}
                </tbody>

              </table>
            </div>
          )}
        </div>}
      </div>

      {/* Batch action bar */}
      {isFinance && selectedRows.size > 0 && (
        <div className="batch-bar">
          <span className="batch-count">{selectedRows.size} row{selectedRows.size !== 1 ? 's' : ''} selected</span>
          <button className="batch-btn batch-complete" onClick={() => batchStatus('complete')}>Mark Complete</button>
          <button className="batch-btn batch-void" onClick={() => batchStatus('void')}>Mark Void</button>
          <button className="batch-btn batch-incorrect" onClick={() => batchStatus('incorrect')}>Mark Incorrect</button>
          <button className="batch-btn batch-clear" onClick={() => batchStatus(null)}>Clear Status</button>
          <button className="batch-deselect" onClick={() => setSelectedRows(new Set())}>✕ Deselect all</button>
        </div>
      )}

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
  .finance-signout {
    background: none; border: none; cursor: pointer;
    color: #065f46; font-size: 14px; font-weight: 700;
    padding: 0 0 0 6px; line-height: 1; opacity: 0.6;
    transition: opacity 0.15s;
  }
  .finance-signout:hover { opacity: 1; }
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
  .tab-divider { width: 1px; height: 24px; background: #e5e7eb; margin: 0 4px; align-self: center; }
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

  /* Summary view */
  .summary-wrap { max-width: 720px; }
  .summary-period-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
  .period-btn { padding: 8px 18px; border-radius: 8px; border: 1.5px solid #d1d5db; background: #fff; font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer; color: #374151; transition: all 0.15s; }
  .period-btn:hover { border-color: #005F2C; color: #005F2C; }
  .period-active { background: #005F2C !important; color: #fff !important; border-color: #005F2C !important; }
  .custom-range { display: flex; align-items: center; gap: 8px; }
  .summary-table td, .summary-table th { white-space: nowrap; }
  .summary-amount { font-weight: 600; font-variant-numeric: tabular-nums; }
  .summary-grand-total td { background: #f3f4f6 !important; font-weight: 700; border-top: 2px solid #d1d5db; }

  /* Inline edit */
  .cell-editable:hover { background: #f0fdf4 !important; cursor: cell; }
  .cell-edit-input { width: 100%; padding: 2px 4px; border: 2px solid #005F2C; border-radius: 4px; font-size: 13px; font-family: inherit; background: #fff; outline: none; }

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

  /* Status legend */
  .status-legend { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 600; color: #6b7280; }
  .legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-left: 8px; }
  .legend-dot:first-child { margin-left: 0; }
  .dot-complete { background: #16a34a; }
  .dot-void { background: #dc2626; }
  .dot-incorrect { background: #d97706; }

  /* Filter toggle */
  .filter-toggle-btn {
    padding: 7px 14px; border-radius: 8px; border: 1.5px solid #d1d5db;
    background: #fff; font-size: 13px; font-weight: 600; font-family: inherit;
    cursor: pointer; color: #374151; transition: border-color 0.15s, color 0.15s, background 0.15s;
    white-space: nowrap;
  }
  .filter-toggle-btn:hover { border-color: #005F2C; color: #005F2C; }
  .filter-toggle-active { border-color: #005F2C !important; background: #f0faf4 !important; color: #005F2C !important; }

  /* Column filter row */
  .filter-row th { padding: 4px 6px !important; background: #f9fafb; }
  .col-filter-input, .col-filter-select {
    width: 100%; padding: 5px 8px; border: 1.5px solid #d1d5db; border-radius: 6px;
    font-size: 12px; font-family: inherit; color: #374151; outline: none;
    background: #fff;
  }
  .col-filter-input:focus, .col-filter-select:focus { border-color: #005F2C; }
  .col-filter-select { cursor: pointer; }

  /* Checkboxes */
  .row-checkbox { width: 15px; height: 15px; cursor: pointer; accent-color: #005F2C; vertical-align: middle; margin-right: 6px; }

  /* Batch bar */
  .batch-bar {
    position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
    background: #111827; color: #fff; border-radius: 12px;
    padding: 12px 20px; display: flex; align-items: center; gap: 10px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3); z-index: 300; white-space: nowrap;
  }
  .batch-count { font-size: 13px; font-weight: 600; margin-right: 4px; }
  .batch-btn {
    padding: 7px 14px; border-radius: 8px; border: none;
    font-size: 13px; font-weight: 600; font-family: inherit; cursor: pointer;
    transition: opacity 0.15s;
  }
  .batch-btn:hover { opacity: 0.85; }
  .batch-complete { background: #16a34a; color: #fff; }
  .batch-void { background: #dc2626; color: #fff; }
  .batch-incorrect { background: #d97706; color: #fff; }
  .batch-clear { background: #4b5563; color: #fff; }
  .batch-deselect { background: none; border: none; color: #9ca3af; font-size: 13px; cursor: pointer; font-family: inherit; padding: 0 4px; }
  .batch-deselect:hover { color: #fff; }

  /* Status column */
  .col-status-hd { width: 72px; text-align: center !important; }
  .col-status-cell { text-align: center; padding: 6px 4px !important; width: 72px; }
  .status-dot {
    width: 18px; height: 18px; border-radius: 50%;
    border: 2px solid #d1d5db; background: transparent;
    cursor: pointer; display: inline-block;
    transition: all 0.15s; vertical-align: middle;
  }
  .status-dot:hover { transform: scale(1.2); }
  .dot-none { border-color: #d1d5db; background: transparent; }
  .dot-complete { border-color: #16a34a; background: #16a34a; }
  .dot-void { border-color: #dc2626; background: #dc2626; }
  .dot-incorrect { border-color: #d97706; background: #d97706; }

  /* Row status backgrounds */
  .row-status-complete td { background: #f0fdf4 !important; }
  .row-status-void td { background: #fef2f2 !important; }
  .row-status-incorrect td { background: #fefce8 !important; }
  .row-status-complete td.col-finance { background: #dcfce7 !important; }
  .row-status-void td.col-finance { background: #fee2e2 !important; }
  .row-status-incorrect td.col-finance { background: #fef9c3 !important; }

  /* Status filter */
  .status-filter-select {
    padding: 7px 10px; border: 1.5px solid #d1d5db; border-radius: 8px;
    font-size: 13px; font-family: inherit; color: #374151;
    outline: none; cursor: pointer; background: #fff;
  }
  .status-filter-select:focus { border-color: #005F2C; }

  /* Date filter */
  .date-filter { display: flex; align-items: center; gap: 6px; }
  .date-range-sep { color: #9ca3af; font-size: 13px; }
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
