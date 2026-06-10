export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { password } = req.body || {}
  if (!password || password !== process.env.FINANCE_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect password' })
  }

  const isSecure = process.env.NODE_ENV === 'production'
  res.setHeader(
    'Set-Cookie',
    `gc4c_finance=${process.env.FINANCE_PASSWORD}; HttpOnly; SameSite=Strict; Max-Age=31536000; Path=/${isSecure ? '; Secure' : ''}`
  )
  return res.status(200).json({ success: true })
}
