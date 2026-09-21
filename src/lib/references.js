// Deterministic reference extraction from bill text (no LLM needed).
// Finds U.S. Code cites, Public Laws, and other federal bills, and links them.

const USC_RE = /(\d+)\s*U\.?S\.?C\.?\s*§*\s*(\d+[a-zA-Z0-9.\-()]*)/g
const PL_RE = /Public Law\s*(?:No\.?\s*)?(\d+)\s*[-–]\s*(\d+)/gi
const BILL_RE = /\b(H\.R\.|S\.|H\.J\.Res\.|S\.J\.Res\.|H\.Con\.Res\.|S\.Con\.Res\.|H\.Res\.|S\.Res\.)\s*(\d+)\b/g

function contextOf(text, idx, span = 160) {
  const a = Math.max(0, idx - span), b = Math.min(text.length, idx + span)
  return text.slice(a, b).replace(/\s+/g, ' ').trim()
}

function sectionOf(text, idx) {
  const head = text.slice(0, idx)
  const m = head.match(/SEC\.\s*\d+[^\n]{0,120}/gi)
  return m ? m[m.length - 1].trim().slice(0, 120) : 'bill text'
}

export function extractReferences(fullText = '', congress = '119') {
  const refs = []
  const seen = new Set()
  let m
  USC_RE.lastIndex = 0
  while ((m = USC_RE.exec(fullText))) {
    const key = `usc-${m[1]}-${m[2]}`
    if (seen.has(key)) continue; seen.add(key)
    refs.push({
      kind: 'uscode', title: `${m[1]} U.S.C. ${m[2]}`,
      url: `https://uscode.house.gov/view.xhtml?req=${encodeURIComponent(m[1] + ' USC ' + m[2])}`,
      whyCited: `Cited in ${sectionOf(fullText, m.index)} — “…${contextOf(fullText, m.index)}…”`,
    })
  }
  PL_RE.lastIndex = 0
  while ((m = PL_RE.exec(fullText))) {
    const key = `pl-${m[1]}-${m[2]}`
    if (seen.has(key)) continue; seen.add(key)
    refs.push({
      kind: 'public-law', title: `Public Law ${m[1]}-${m[2]}`,
      url: `https://www.congress.gov/public-laws/${m[1]}th-congress`,
      whyCited: `Cited in ${sectionOf(fullText, m.index)} — “…${contextOf(fullText, m.index)}…”`,
    })
  }
  BILL_RE.lastIndex = 0
  while ((m = BILL_RE.exec(fullText))) {
    const key = `bill-${m[1]}-${m[2]}`.toLowerCase()
    if (seen.has(key)) continue; seen.add(key)
    const slug = m[1].toLowerCase().replace(/\./g, '').replace(/\s/g, '-')
    refs.push({
      kind: 'bill', title: `${m[1]} ${m[2]}`,
      url: `https://www.congress.gov/search?q=%7B%22source%22%3A%22legislation%22%2C%22congress%22%3A%22${congress}%22%7D&searchResultViewType=expanded&KWICView=false`,
      whyCited: `Referenced in ${sectionOf(fullText, m.index)} — “…${contextOf(fullText, m.index)}…”`,
      slug,
    })
  }
  return refs.slice(0, 60)
}
