import { app, dialog, BrowserWindow } from 'electron'
import { promises as fs } from 'fs'
import path from 'path'
import { MediaItem } from './files'

const PLAYLIST_DIR = () => path.join(app.getPath('userData'), 'playlists')

export interface SavedPlaylist {
  name: string
  items: MediaItem[]
  savedAt: number
}

async function ensureDir() {
  await fs.mkdir(PLAYLIST_DIR(), { recursive: true })
}

export async function listPlaylists(): Promise<{ name: string; file: string }[]> {
  await ensureDir()
  const entries = await fs.readdir(PLAYLIST_DIR())
  return entries
    .filter((e) => e.endsWith('.json'))
    .map((e) => ({ name: path.basename(e, '.json'), file: path.join(PLAYLIST_DIR(), e) }))
}

export async function savePlaylist(win: BrowserWindow, items: MediaItem[]): Promise<string | null> {
  await ensureDir()
  const res = await dialog.showSaveDialog(win, {
    title: '재생목록 저장',
    defaultPath: path.join(PLAYLIST_DIR(), '내 재생목록.json'),
    filters: [{ name: '재생목록 (JSON)', extensions: ['json'] }]
  })
  if (res.canceled || !res.filePath) return null
  const data: SavedPlaylist = {
    name: path.basename(res.filePath, '.json'),
    items,
    savedAt: Date.now()
  }
  await fs.writeFile(res.filePath, JSON.stringify(data, null, 2), 'utf-8')
  return res.filePath
}

export async function loadPlaylist(win: BrowserWindow): Promise<SavedPlaylist | null> {
  await ensureDir()
  const res = await dialog.showOpenDialog(win, {
    title: '재생목록 불러오기',
    defaultPath: PLAYLIST_DIR(),
    properties: ['openFile'],
    filters: [{ name: '재생목록 (JSON)', extensions: ['json'] }]
  })
  if (res.canceled || res.filePaths.length === 0) return null
  const txt = await fs.readFile(res.filePaths[0], 'utf-8')
  return JSON.parse(txt) as SavedPlaylist
}
