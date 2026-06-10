export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  res.setHeader('Set-Cookie', 'gc4c_finance=; HttpOnly; SameSite=Strict; Max-Age=0; Path=/')
  return res.status(200).json({ success: true })
}
