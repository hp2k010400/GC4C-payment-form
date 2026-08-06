import Head from 'next/head'
import { useState } from 'react'

const STORES = ['Edinburgh', 'Milton Keynes', 'Warrington', 'Southampton']


const TRANSACTION_TYPES = ['Bank Transfer', 'Paypal', 'International', 'Store Credit']

const LOGO_URL = 'https://cdn.shopify.com/s/files/1/0559/0450/1875/files/GC4C_SVG_Logo.svg?v=1745920148'

const EMPTY = {
  store: '',
  colleagueName: '',
  paymentAmount: '',
  dateOfPayment: '',
  timeOfPayment: '',
  additionalNotes: '',
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  confirmPaymentAmount: '',
  transactionType: '',
  sortCode: '',
  accountNumber: '',
  paypalEmail: '',
  iban: '',
  bicSwift: '',
  consent: false,
}

function Logo() {
  return (
    <div className="gc-logo-wrap">
      <img src={LOGO_URL} alt="GolfClubs4Cash" className="gc-logo-img" />
    </div>
  )
}

function currentTime() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function Field({ label, required, error, hint, children, className }) {
  return (
    <div className={`gc-field${className ? ` ${className}` : ''}`}>
      <label className="gc-label">
        {label}
        {required && <span className="gc-required"> *</span>}
      </label>
      {children}
      {hint && !error && <div className="gc-hint">{hint}</div>}
      {error && <div className="gc-error-msg">{error}</div>}
    </div>
  )
}

function SuccessPage({ customerName, paymentAmount, transactionType, onReset }) {
  return (
    <div className="gc-page">
      <div className="gc-card">
        <Logo />
        <div className="gc-success">
          <div className="gc-success-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className="gc-success-title">Submission Received</h2>
          <p className="gc-success-text">
            Payment details for <strong>{customerName}</strong> submitted
          </p>
          <div className="gc-success-details">
            <div className="gc-success-row">
              <span>Payment Value</span>
              <strong>£{parseFloat(paymentAmount || 0).toFixed(2)}</strong>
            </div>
            <div className="gc-success-row">
              <span>Payment Method</span>
              <strong>{transactionType}</strong>
            </div>
          </div>
          <button className="gc-btn-primary" onClick={onReset}>Submit Another</button>
        </div>
      </div>
    </div>
  )
}

export default function StorePaymentForm() {
  const [form, setForm] = useState(() => ({ ...EMPTY, timeOfPayment: currentTime() }))
  const [errors, setErrors] = useState({})
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const showConfirmAmount = parseFloat(form.paymentAmount) > 999.99
  const isBankTransfer = form.transactionType === 'Bank Transfer'
  const isPaypal = form.transactionType === 'Paypal'
  const isInternational = form.transactionType === 'International'

  function update(key, val) {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: '' }))
  }

  function validateStep1() {
    const e = {}
    if (!form.store) e.store = 'Please select a store'
    if (!form.colleagueName) e.colleagueName = 'Please select a colleague'
    if (!form.paymentAmount || parseFloat(form.paymentAmount) <= 0) e.paymentAmount = 'Enter a valid payment amount'
    if (!form.dateOfPayment) e.dateOfPayment = 'Date of payment is required'
    if (!form.timeOfPayment) e.timeOfPayment = 'Time of payment is required'
    return e
  }

  function validateStep2() {
    const e = {}
    if (!form.customerName.trim()) e.customerName = 'Customer name is required'
    if (!form.customerPhone.trim()) e.customerPhone = 'Customer phone number is required'
    if (showConfirmAmount && form.confirmPaymentAmount !== form.paymentAmount) e.confirmPaymentAmount = 'Amounts do not match — please re-enter'
    if (!form.transactionType) e.transactionType = 'Please select a transaction type'
    if (isBankTransfer) {
      if (!form.sortCode.trim()) e.sortCode = 'Sort code is required'
      if (!form.accountNumber.trim()) e.accountNumber = 'Account number is required'
    }
    if (isPaypal) {
      if (!form.paypalEmail.trim()) e.paypalEmail = 'PayPal email is required'
      else if (!/\S+@\S+\.\S+/.test(form.paypalEmail)) e.paypalEmail = 'Enter a valid email address'
    }
    if (isInternational) {
      if (!form.iban.trim()) e.iban = 'IBAN is required'
      if (!form.bicSwift.trim()) e.bicSwift = 'BIC / SWIFT code is required'
    }
    if (!form.consent) e.consent = 'Customer must agree to data usage'
    return e
  }

  function handleNext(e) {
    e.preventDefault()
    const errs = validateStep1()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      const firstErrEl = document.querySelector('.gc-error-msg')
      if (firstErrEl) firstErrEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setErrors({})
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleBack() {
    setStep(1)
    setErrors({})
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validateStep2()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      const firstErrEl = document.querySelector('.gc-error-msg')
      if (firstErrEl) firstErrEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/submit-store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Submission failed — please try again')
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function reset() {
    setForm({ ...EMPTY, timeOfPayment: currentTime() })
    setErrors({})
    setStep(1)
    setSubmitted(false)
    setSubmitError(null)
  }

  if (submitted) return (
    <>
      <Head>
        <title>Submission Received — GC4C Store</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{CSS}</style>
      </Head>
      <SuccessPage customerName={form.customerName} paymentAmount={form.paymentAmount} transactionType={form.transactionType} onReset={reset} />
    </>
  )

  const inputClass = (key) => `gc-input${errors[key] ? ' gc-input-error' : ''}`

  return (
    <>
      <Head>
        <title>GC4C (Store) Payment Submission</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{CSS}</style>
      </Head>

      <div className="gc-page">
        <div className="gc-card">
          <Logo />
          <div className="gc-form-header">
            <h1 className="gc-form-title">GC4C (Store) Payment Submission</h1>
            <p className="gc-form-subtitle">Please complete all sections accurately. This form is for internal and customer use by Golfclubs4cash Ltd.</p>
            <div className="gc-steps">
              <div className={`gc-step ${step === 1 ? 'gc-step-active' : 'gc-step-done'}`}>
                <div className="gc-step-dot">{step > 1 ? '✓' : '1'}</div>
                <span>Staff Details</span>
              </div>
              <div className="gc-step-line" />
              <div className={`gc-step ${step === 2 ? 'gc-step-active' : ''}`}>
                <div className="gc-step-dot">2</div>
                <span>Customer Details</span>
              </div>
            </div>
          </div>
          <div className="gc-divider" />

          {step === 1 && (
            <form onSubmit={handleNext} noValidate>
              <div className="gc-section">
                <div className="gc-section-label">Staff to Complete</div>

                <Field label="Store / Department" required error={errors.store}>
                  <select className={inputClass('store')} value={form.store} onChange={e => update('store', e.target.value)}>
                    <option value="">Please Select</option>
                    {STORES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>

                <Field label="Colleague Name" required error={errors.colleagueName}>
                  <input className={inputClass('colleagueName')} type="text" value={form.colleagueName} onChange={e => update('colleagueName', e.target.value)} placeholder="Your name" />
                </Field>

                <Field label="Payment Amount" required error={errors.paymentAmount} hint="Please enter with two decimal places (e.g., 100.00)">
                  <div className="gc-prefix-wrap">
                    <span className="gc-prefix">£</span>
                    <input className={`${inputClass('paymentAmount')} gc-input-prefixed`} type="text" inputMode="decimal" value={form.paymentAmount} onChange={e => update('paymentAmount', e.target.value)} placeholder="0.00" />
                  </div>
                </Field>

                <div className="gc-field-row">
                  <Field label="Date of Payment" required error={errors.dateOfPayment}>
                    <input className={inputClass('dateOfPayment')} type="date" value={form.dateOfPayment} onChange={e => update('dateOfPayment', e.target.value)} />
                  </Field>
                  <Field label="Time of Payment" required error={errors.timeOfPayment}>
                    <input className={inputClass('timeOfPayment')} type="time" value={form.timeOfPayment} onChange={e => update('timeOfPayment', e.target.value)} />
                  </Field>
                </div>

                <Field label="Additional Notes" error={errors.additionalNotes}>
                  <textarea className="gc-input gc-textarea" value={form.additionalNotes} onChange={e => update('additionalNotes', e.target.value)} placeholder="Any additional information (optional)" rows={3} />
                </Field>
              </div>

              <div className="gc-form-footer">
                <button type="submit" className="gc-btn-primary">Next →</button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} noValidate>
              <div className="gc-section">
                <div className="gc-section-label">Customer to Complete</div>

                <div className="gc-amount-display">
                  <div className="gc-amount-label">Payment Amount</div>
                  <div className="gc-amount-value">£{parseFloat(form.paymentAmount || 0).toFixed(2)}</div>
                </div>

                {showConfirmAmount && (
                  <div className="gc-conditional">
                    <Field label="Confirm Payment Amount" required error={errors.confirmPaymentAmount} hint="Re-enter the amount to confirm — required for payments over £999.99">
                      <div className="gc-prefix-wrap">
                        <span className="gc-prefix">£</span>
                        <input className={`${inputClass('confirmPaymentAmount')} gc-input-prefixed`} type="text" inputMode="decimal" value={form.confirmPaymentAmount} onChange={e => update('confirmPaymentAmount', e.target.value)} placeholder="0.00" />
                      </div>
                    </Field>
                  </div>
                )}

                <Field label="Customer Name" required error={errors.customerName}>
                  <input className={inputClass('customerName')} type="text" value={form.customerName} onChange={e => update('customerName', e.target.value)} placeholder="Full name" />
                </Field>

                <Field label="Customer Email Address" error={errors.customerEmail}>
                  <input className="gc-input" type="email" value={form.customerEmail} onChange={e => update('customerEmail', e.target.value)} placeholder="example@example.com" />
                </Field>

                <Field label="Customer Phone Number" required error={errors.customerPhone}>
                  <input className={inputClass('customerPhone')} type="tel" value={form.customerPhone} onChange={e => update('customerPhone', e.target.value)} placeholder="07700 000000" />
                </Field>

                <Field label="Transaction Type" required error={errors.transactionType}>
                  <select
                    className={inputClass('transactionType')}
                    value={form.transactionType}
                    onChange={e => {
                      const val = e.target.value
                      setForm(f => ({ ...f, transactionType: val, sortCode: '', accountNumber: '', paypalEmail: '', iban: '', bicSwift: '' }))
                      setErrors(er => ({ ...er, transactionType: '', sortCode: '', accountNumber: '', paypalEmail: '', iban: '', bicSwift: '' }))
                    }}
                  >
                    <option value="">Please Select</option>
                    {TRANSACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>

                {isBankTransfer && (
                  <div className="gc-conditional">
                    <Field label="Sort Code" required error={errors.sortCode}>
                      <input className={inputClass('sortCode')} type="text" value={form.sortCode} onChange={e => update('sortCode', e.target.value)} placeholder="123456" maxLength={8} />
                    </Field>
                    <Field label="Account Number" required error={errors.accountNumber}>
                      <input className={inputClass('accountNumber')} type="text" value={form.accountNumber} onChange={e => update('accountNumber', e.target.value)} placeholder="8-digit account number" maxLength={8} />
                    </Field>
                  </div>
                )}

                {isPaypal && (
                  <div className="gc-conditional">
                    <Field label="PayPal Email" required error={errors.paypalEmail}>
                      <input className={inputClass('paypalEmail')} type="email" value={form.paypalEmail} onChange={e => update('paypalEmail', e.target.value)} placeholder="example@example.com" />
                    </Field>
                  </div>
                )}

                {isInternational && (
                  <div className="gc-conditional">
                    <Field label="IBAN" required error={errors.iban}>
                      <input className={inputClass('iban')} type="text" value={form.iban} onChange={e => update('iban', e.target.value.toUpperCase())} />
                    </Field>
                    <Field label="BIC / SWIFT Code" required error={errors.bicSwift}>
                      <input className={inputClass('bicSwift')} type="text" value={form.bicSwift} onChange={e => update('bicSwift', e.target.value.toUpperCase())} />
                    </Field>
                  </div>
                )}

                <div className={`gc-field gc-consent-field${errors.consent ? ' gc-consent-error' : ''}`}>
                  <label className="gc-consent-label">
                    <input
                      type="checkbox"
                      className="gc-checkbox"
                      checked={form.consent}
                      onChange={e => update('consent', e.target.checked)}
                    />
                    <span>
                      I agree for GolfClubs4Cash Ltd to use my data solely for the purpose of completing payment. Payment takes up to 3 working days.
                      <span className="gc-required"> *</span>
                    </span>
                  </label>
                  {errors.consent && <div className="gc-error-msg">{errors.consent}</div>}
                </div>
              </div>

              {submitError && <div className="gc-error-banner">{submitError}</div>}

              <div className="gc-form-footer gc-form-footer-two">
                <button type="button" className="gc-btn-secondary" onClick={handleBack}>← Back</button>
                <button type="submit" className="gc-btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit Details'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  )
}

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: linear-gradient(160deg, #eef5ef 0%, #f5f7f5 100%); min-height: 100vh; color: #111827; }
  .gc-page { min-height: 100vh; padding: 48px 16px 72px; display: flex; flex-direction: column; align-items: center; }
  .gc-card { width: 100%; max-width: 640px; background: #fff; border-radius: 20px; box-shadow: 0 4px 32px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04); overflow: hidden; }
  .gc-logo-wrap { display: flex; flex-direction: column; align-items: center; padding: 40px 40px 32px; border-bottom: 1px solid #f3f4f6; }
  .gc-logo-img { height: 72px; width: auto; object-fit: contain; }
  .gc-form-header { padding: 32px 44px 24px; }
  .gc-form-title { font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 10px; line-height: 1.3; }
  .gc-form-subtitle { font-size: 15px; color: #6b7280; line-height: 1.6; margin-bottom: 24px; }
  .gc-steps { display: flex; align-items: center; gap: 0; }
  .gc-step { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 600; color: #9ca3af; }
  .gc-step-active { color: #005F2C; }
  .gc-step-done { color: #005F2C; opacity: 0.6; }
  .gc-step-dot { width: 26px; height: 26px; border-radius: 50%; background: #e5e7eb; color: #6b7280; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .gc-step-active .gc-step-dot { background: #005F2C; color: #fff; }
  .gc-step-done .gc-step-dot { background: #005F2C; color: #fff; }
  .gc-step-line { flex: 1; height: 2px; background: #e5e7eb; margin: 0 12px; }
  .gc-divider { height: 1px; background: #f3f4f6; margin: 0 44px; }
  .gc-section { padding: 32px 44px; }
  .gc-section-label { font-size: 11.5px; font-weight: 700; letter-spacing: 0.1em; color: #005F2C; text-transform: uppercase; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid #005F2C; display: inline-block; }
  .gc-field { margin-bottom: 24px; }
  .gc-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .gc-label { display: block; font-size: 15px; font-weight: 600; color: #374151; margin-bottom: 8px; }
  .gc-required { color: #dc2626; }
  .gc-input { width: 100%; padding: 13px 16px; border: 1.5px solid #d1d5db; border-radius: 8px; font-size: 16px; font-family: inherit; color: #111827; background: #fff; transition: border-color 0.15s, box-shadow 0.15s; outline: none; -webkit-appearance: none; appearance: none; }
  .gc-input:focus { border-color: #005F2C; box-shadow: 0 0 0 3px rgba(0, 95, 44, 0.12); }
  .gc-input-error { border-color: #ef4444 !important; box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08) !important; }
  .gc-input::placeholder { color: #9ca3af; }
  input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
  input[type=number] { -moz-appearance: textfield; }
  .gc-textarea { resize: vertical; min-height: 88px; }
  select.gc-input { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 16px center; padding-right: 44px; cursor: pointer; }
  .gc-prefix-wrap { position: relative; display: flex; align-items: center; }
  .gc-prefix { position: absolute; left: 16px; font-size: 16px; font-weight: 500; color: #6b7280; pointer-events: none; z-index: 1; }
  .gc-input-prefixed { padding-left: 28px; }
  .gc-hint { margin-top: 6px; font-size: 13px; color: #9ca3af; }
  .gc-error-msg { margin-top: 6px; font-size: 13.5px; color: #dc2626; font-weight: 500; }
  .gc-conditional { animation: gcFadeIn 0.2s ease both; }
  @keyframes gcFadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
  .gc-amount-display { background: #f0faf4; border: 1.5px solid #bbdfc8; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between; }
  .gc-amount-label { font-size: 14px; font-weight: 600; color: #374151; }
  .gc-amount-value { font-size: 22px; font-weight: 700; color: #005F2C; }
  .gc-consent-field { }
  .gc-consent-label { display: flex; align-items: flex-start; gap: 12px; cursor: pointer; font-size: 14.5px; color: #374151; line-height: 1.55; }
  .gc-checkbox { width: 18px; height: 18px; flex-shrink: 0; margin-top: 2px; accent-color: #005F2C; cursor: pointer; }
  .gc-consent-error .gc-consent-label { color: #b91c1c; }
  .gc-error-banner { margin: 0 44px 24px; padding: 16px 18px; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; font-size: 14.5px; color: #b91c1c; line-height: 1.5; }
  .gc-form-footer { padding: 8px 44px 40px; }
  .gc-form-footer-two { display: flex; gap: 12px; }
  .gc-btn-primary { flex: 1; padding: 16px; background: #005F2C; color: #fff; border: none; border-radius: 10px; font-size: 17px; font-weight: 600; font-family: inherit; cursor: pointer; transition: background 0.15s, transform 0.1s, box-shadow 0.15s; letter-spacing: 0.01em; }
  .gc-btn-primary:hover:not(:disabled) { background: #004a23; box-shadow: 0 4px 16px rgba(0, 95, 44, 0.25); }
  .gc-btn-primary:active:not(:disabled) { transform: scale(0.99); }
  .gc-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
  .gc-btn-secondary { padding: 16px 24px; background: #fff; color: #374151; border: 1.5px solid #d1d5db; border-radius: 10px; font-size: 17px; font-weight: 600; font-family: inherit; cursor: pointer; transition: border-color 0.15s, background 0.15s; white-space: nowrap; }
  .gc-btn-secondary:hover { border-color: #9ca3af; background: #f9fafb; }
  .gc-success { padding: 56px 44px 60px; display: flex; flex-direction: column; align-items: center; text-align: center; }
  .gc-success-icon { width: 72px; height: 72px; border-radius: 50%; background: #005F2C; display: flex; align-items: center; justify-content: center; margin-bottom: 28px; box-shadow: 0 4px 20px rgba(0, 95, 44, 0.3); }
  .gc-success-title { font-size: 26px; font-weight: 700; color: #111827; margin-bottom: 14px; }
  .gc-success-text { font-size: 16px; color: #6b7280; line-height: 1.6; margin-bottom: 36px; max-width: 400px; }
  .gc-success-text strong { color: #111827; }
  .gc-success-details { width: 100%; max-width: 320px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px 20px; margin-bottom: 28px; }
  .gc-success-row { display: flex; align-items: center; justify-content: space-between; font-size: 14.5px; color: #6b7280; padding: 6px 0; }
  .gc-success-row strong { color: #111827; font-weight: 700; }
  .gc-success-row + .gc-success-row { border-top: 1px solid #e5e7eb; }
  @media (max-width: 520px) {
    .gc-page { padding: 20px 12px 48px; }
    .gc-card { border-radius: 16px; }
    .gc-logo-wrap { padding: 32px 24px 24px; }
    .gc-form-header { padding: 24px 24px 18px; }
    .gc-divider { margin: 0 24px; }
    .gc-section { padding: 24px; }
    .gc-form-footer { padding: 8px 24px 32px; }
    .gc-field-row { grid-template-columns: 1fr; gap: 0; }
    .gc-error-banner { margin: 0 24px 16px; }
    .gc-success { padding: 40px 24px 48px; }
  }
`
