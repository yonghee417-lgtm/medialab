import { dialog, BrowserWindow } from 'electron'
import { promises as fs } from 'fs'
import path from 'path'
import { AUDIO_EXTS, VIDEO_EXTS, SUBTITLE_EXTS, classify, MediaKind } from './formats'

export interface MediaItem {
  path: string
  name: string
  kind: MediaKind
  size: number
}

const ALL_MEDIA = new Set<string>([...AUDIO_EXTS, ...VIDEO_EXTS])

export async function pickFiles(win: BrowserWindow): Promise<MediaItem[]> {
  const res = await dialog.showOpenDialog(win, {
    title: '파일 추가',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: '미디어 파일', extensions: [...ALL_MEDIA].map((e) => e.slice(1)) },
      { name: '음악', extensions: [...AUDIO_EXTS].map((e) => e.slice(1)) },
      { name: '영상', extensions: [...VIDEO_EXTS].map((e) => e.slice(1)) },
      { name: '모든 파일', extensions: ['*'] }
    ]
  })
  if (res.canceled) return []
  return Promise.all(res.filePaths.map(toItem)).then((arr) => arr.filter((x): x is MediaItem => !!x))
}

export async function pickFolder(
  win: BrowserWindow,
  opts: { audio: boolean; video: boolean; recursive: boolean }
): Promise<MediaItem[]> {
  const res = await dialog.showOpenDialog(win, {
    title: '폴더 추가',
    properties: ['openDirectory']
  })
  if (res.canceled || res.filePaths.length === 0) return []
  const root = res.filePaths[0]
  const all = await scanDir(root, opts.recursive)
  return all.filter((it) => (it.kind === 'audio' ? opts.audio : opts.video))
}

export async function pickSubtitle(win: BrowserWindow): Promise<string | null> {
  const res = await dialog.showOpenDialog(win, {
    title: '자막 파일 선택',
    properties: ['openFile'],
    filters: [
      { name: '자막', extensions: [...SUBTITLE_EXTS].map((e) => e.slice(1)) },
      { name: '모든 파일', extensions: ['*'] }
    ]
  })
  if (res.canceled) return null
  return res.filePaths[0]
}

async function scanDir(dir: string, recursive: boolean): Promise<MediaItem[]> {
  const out: MediaItem[] = []
  let entries: import('fs').Dirent[]
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (recursive) {
        const sub = await scanDir(full, true)
        out.push(...sub)
      }
    } else if (entry.isFile()) {
      const item = await toItem(full)
      if (item) out.push(item)
    }
  }
  out.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
  return out
}

async function toItem(full: string): Promise<MediaItem | null> {
  const ext = path.extname(full)
  const kind = classify(ext)
  if (!kind) return null
  let size = 0
  try {
    const stat = await fs.stat(full)
    size = stat.size
  } catch {
    return null
  }
  return {
    path: full,
    name: path.basename(full),
    kind,
    size
  }
}

export async function findSiblingSubtitle(mediaPath: string): Promise<string | null> {
  const dir = path.dirname(mediaPath)
  const base = path.basename(mediaPath, path.extname(mediaPath)).toLowerCase()
  let entries: import('fs').Dirent[]
  try {
    entries = await fs.readdir(dir, { withFileTypes: true })
  } catch {
    return null
  }
  const candidates: { p: string; score: number }[] = []
  for (const e of entries) {
    if (!e.isFile()) continue
    const ext = path.extname(e.name).toLowerCase()
    if (!SUBTITLE_EXTS.has(ext)) continue
    const subBase = path.basename(e.name, ext).toLowerCase()
    let score = 0
    if (subBase === base) score = 100
    else if (subBase.startsWith(base) || base.startsWith(subBase)) score = 50
    else continue
    if (ext === '.srt') score += 5
    if (ext === '.vtt') score += 4
    if (ext === '.smi' || ext === '.sami') score += 3
    candidates.push({ p: path.join(dir, e.name), score })
  }
  if (candidates.length === 0) return null
  candidates.sort((a, b) => b.score - a.score)
  return candidates[0].p
}

export async function readFileText(p: string): Promise<string> {
  const buf = await fs.readFile(p)
  // Detect simple BOM or fallback to utf-8
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    return buf.slice(3).toString('utf-8')
  }
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    return buf.slice(2).toString('utf16le')
  }
  return buf.toString('utf-8')
}
