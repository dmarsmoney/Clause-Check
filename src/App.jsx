import { useState } from 'react'

const EXAMPLES = [
  `The Client shall have the right to terminate this Agreement at any time, for any reason or no reason, upon written notice to Contractor. Upon termination, Contractor shall be entitled to payment only for work completed and accepted prior to the termination date. No kill fee or additional compensation shall be owed.`,
  `Contractor agrees that during the term of this Agreement and for a period of two (2) years following its termination, Contractor shall not, directly or indirectly, solicit or accept work from any client of the Company, nor engage in any business that competes with the Company within the United States.`
]

const FREE_LIMIT = 3

function getUsed() {
  const key = 'cc_used_' + new Date().toDateString()
  return parseInt(localStorage.getItem(key) || '0')
}

function incrementUsed() {
  const key = 'cc_used_' + new Date().toDateString()
  localStorage.setItem(key, getUsed() + 1)
}

export default function App() {
  const [clause, setClause] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [used, setUsed] = useState(getUsed())

  const remaining = Math.max(0, FREE_LIMIT - used)
  const pct = Math.min(100, Math.round((used / FREE_LIMIT) * 100))

  async function analyze() {
    if (!clause.trim()) return
    if (used >= FREE_LIMIT) { setShowPaywall(true); return }
    setLoading(true)
    setResult(null)
    setShowPaywall(false)

    const prompt = `You are a legal plain-language expert helping freelancers understand contract clauses. Analyze the following contract clause and respond ONLY with a valid JSON object (no markdown, no backticks, no preamble):
{
  "summary": "2-3 sentence plain English explanation",
  "risk": "Low or Medium or High",
  "riskReason": "1 sentence explaining the risk level",
  "flags": [
    {"text": "specific flag", "ok": false}
  ]
}
Provide 3-5 flags. Set ok:true for fair clauses, ok:false for red flags.
CONTRACT CLAUSE: ${clause}`

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clause: prompt })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (!data.result || !data.result.content) throw new Error('Bad response: ' + JSON.stringify(data))
      const text = data.result.content.map(b => b.text || '').join('').replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(text)
      incrementUsed()
      setUsed(getUsed())
      setResult(parsed)
    } catch (e) {
      alert('Error: ' + e.message)
