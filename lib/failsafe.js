import { getStore } from '@netlify/blobs'

export async function saveFailsafe(formType, fields) {
  try {
    const store = getStore('failed-submissions')
    const key = `${formType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    await store.set(key, JSON.stringify({ formType, savedAt: new Date().toISOString(), fields }))
    return true
  } catch (err) {
    console.error('[failsafe] Blob store failed:', err.message)
    return false
  }
}
