// SRT and SAMI(.smi) -> WebVTT conversion (returns blob URL or null)

export type SubtitleFormat = 'srt' | 'vtt' | 'smi' | 'ass' | 'unknown'

export function detectFormat(filename: string): SubtitleFormat {
  const lower = filename.toLowerCase()
  if (lower.endsWith('.srt')) return 'srt'
  if (lower.endsWith('.vtt')) return 'vtt'
  if (lower.endsWith('.smi') || lower.endsWith('.sami')) return 'smi'
  if (lower.endsWith('.ass') || lower.endsWith('.ssa')) return 'ass'
  return 'unknown'
}

export function srtToVtt(text: string): string {
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const body = cleaned.replace(
    /(\d{2}:\d{2}:\d{2}),(\d{3})/g,
    '$1.$2'
  )
  return 'WEBVTT\n\n' + body
}

// Minimal SAMI (.smi) → VTT converter. Handles <SYNC Start=N>...<P>text</P>
export function smiToVtt(text: string): string {
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const syncRe = /<SYNC[^>]*Start\s*=\s*"?(\d+)"?[^>]*>/gi
  const cues: { start: number; html: string }[] = []
  const matches = [...cleaned.matchAll(syncRe)]
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    const start = parseInt(m[1], 10)
    const next = matches[i + 1]
    const startIdx = (m.index ?? 0) + m[0].length
    const endIdx = next ? next.index ?? cleaned.length : cleaned.length
    let chunk = cleaned.slice(startIdx, endIdx)
    chunk = chunk
      .replace(/<P[^>]*>/gi, '')
      .replace(/<\/P>/gi, '')
      .replace(/<BR\s*\/?>/gi, '\n')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/<[^>]+>/g, '')
      .trim()
    if (chunk) cues.push({ start, html: chunk })
  }
  let out = 'WEBVTT\n\n'
  for (let i = 0; i < cues.length; i++) {
    const cur = cues[i]
    const next = cues[i + 1]
    const end = next ? next.start : cur.start + 5000
    if (!cur.html || cur.html === '&nbsp;') continue
    out += `${formatTime(cur.start)} --> ${formatTime(end)}\n${cur.html}\n\n`
  }
  return out
}

function formatTime(ms: number): string {
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  const s = Math.floor((ms % 60_000) / 1000)
  const mm = ms % 1000
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)}.${pad(mm, 3)}`
}

function pad(n: number, l: number): string {
  return n.toString().padStart(l, '0')
}

export async function loadSubtitleAsVttUrl(filePath: string): Promise<string | null> {
  try {
    const text = await window.medialab.readText(filePath)
    const fmt = detectFormat(filePath)
    let vtt: string
    if (fmt === 'srt') vtt = srtToVtt(text)
    else if (fmt === 'smi') vtt = smiToVtt(text)
    else if (fmt === 'vtt') vtt = text
    else return null
    const blob = new Blob([vtt], { type: 'text/vtt' })
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}
