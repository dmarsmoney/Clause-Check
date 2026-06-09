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
  "summary": "2-3 sentence plain English explanation of what this clause means for a freelancer",
  "risk": "Low or Medium or High",
  "riskReason": "1 sentence explaining why this risk level was assigned",
  "flags": [
    {"text": "specific thing to watch out for or a positive aspect", "ok": false}
  ]
}
Provide 3-5 flags total. Set ok:true for fair/standard clauses, ok:false for red flags.
CONTRACT CLAUSE:
${clause}`
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clause: prompt })
      })
      const data = await res.json()
      const text = data.content.map(b => b.text || '').join('').replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(text)
      incrementUsed()
      setUsed(getUsed())
      setResult(parsed)
    } catch (e) {
    alert('Error: ' + e.message)
}
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <div style={{ width: 36, height: 36, background: '#E6F1FB', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📄</div>
        <span style={{ fontSize: 20, fontWeight: 600, color: '#111' }}>ClauseCheck</span>
      </div>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>Paste any contract clause — get a plain-English explanation plus risk flags instantly.</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 4, background: '#eee', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: pct + '%', height: '100%', background: remaining === 0 ? '#E24B4A' : '#378ADD', borderRadius: 2 }} />
        </div>
        <span style={{ fontSize: 12, color: '#888', whiteSpace: 'nowrap' }}>
          {remaining === 0 ? 'Daily limit reached' : `${remaining} free ${remaining === 1 ? 'analysis' : 'analyses'} today`}
        </span>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1rem', marginBottom: 12 }}>
        <textarea
          value={clause}
          onChange={e => setClause(e.target.value)}
          placeholder="Paste a contract clause here..."
          style={{ width: '100%', minHeight: 130, resize: 'vertical', fontSize: 14, fontFamily: 'system-ui, sans-serif', color: '#111', background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 8, padding: '0.75rem', lineHeight: 1.6, outline: 'none', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
          <button onClick={analyze} disabled={loading} style={{ background: loading ? '#B5D4F4' : '#185FA5', color: '#fff', border: 'none', borderRadius: 8, padding: '0 1.25rem', height: 36, fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Analyzing...' : 'Analyze clause'}
          </button>
          <button onClick={() => setClause(EXAMPLES[0])} style={{ fontSize: 12, color: '#666', background: 'none', border: '1px solid #e5e5e5', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>Try example 1</button>
          <button onClick={() => setClause(EXAMPLES[1])} style={{ fontSize: 12, color: '#666', background: 'none', border: '1px solid #e5e5e5', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>Try example 2</button>
        </div>
      </div>
      {loading && (
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1rem', marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: '#888' }}>Analyzing your clause...</p>
        </div>
      )}
      {showPaywall && (
        <div style={{ background: '#fff', border: '2px solid #378ADD', borderRadius: 12, padding: '1.5rem', textAlign: 'center', marginBottom: 12 }}>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>You have used your 3 free analyses today</p>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>Upgrade to ClauseCheck Pro for unlimited analyses.</p>
          <button onClick={() => window.open('https://buy.stripe.com/bJe8wR7JQ4Vc2D37MldUY00', '_blank')} style={{ background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, padding: '0 1.5rem', height: 40, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            Upgrade for $9/month
          </button>
        </div>
      )}
      {result && (
        <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: 12, padding: '1rem', marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Plain-English summary</p>
          <p style={{ fontSize: 14, color: '#111', lineHeight: 1.7, marginBottom: 16 }}>{result.summary}</p>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Risk level</p>
          <span style={{ display: 'inline-block', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 8, marginBottom: 12, background: result.risk === 'High' ? '#FCEBEB' : result.risk === 'Medium' ? '#FAEEDA' : '#EAF3DE', color: result.risk === 'High' ? '#A32D2D' : result.risk === 'Medium' ? '#854F0B' : '#3B6D11' }}>
            {result.risk} risk
          </span>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>{result.riskReason}</p>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>What to watch out for</p>
          {result.flags.map((f, i) => (
            <div key={i} style={{ fontSize: 13, color: '#555', display: 'flex', gap: 8, marginBottom: 6 }}>
              <span style={{ color: f.ok ? '#639922' : '#E24B4A' }}>{f.ok ? '✓' : '✗'}</span>
              {f.text}
            </div>
          ))}
        </div>
      )}
      <p style={{ fontSize: 11, color: '#bbb', lineHeight: 1.5, marginTop: 16 }}>
        ClauseCheck provides educational explanations only and is not legal advice. Always consult a licensed attorney for legal decisions.
      </p>
    </div>
  )
}
