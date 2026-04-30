import { app, BrowserWindow, ipcMain, shell, Menu, screen } from 'electron'
import path from 'path'
import { existsSync } from 'fs'
import { store } from './store'
import {
  pickFiles,
  pickFolder,
  pickSubtitle,
  findSiblingSubtitle,
  readFileText
} from './files'
import { listPlaylists, savePlaylist, loadPlaylist } from './playlist'
import { AUDIO_EXTS, VIDEO_EXTS } from './formats'

const PLAYER_W = 920
const PLAYER_H = 580
const PANEL_W = 340

const isDev = !!process.env['ELECTRON_RENDERER_URL']

let win: BrowserWindow | null = null

// ---- Single instance + file open via OS ("Open with" / double-click) ----
const gotInstanceLock = app.requestSingleInstanceLock()
if (!gotInstanceLock) {
  app.quit()
}

let pendingFiles: string[] = []
let rendererReady = false

function isMediaPath(p: string): boolean {
  const ext = path.extname(p).toLowerCase()
  return AUDIO_EXTS.has(ext) || VIDEO_EXTS.has(ext)
}

function extractMediaFromArgv(argv: string[]): string[] {
  // In packaged app: argv[0] = MediaLab.exe, argv[1+] = passed paths.
  // In dev (electron-vite): argv contains many internal flags; skip them.
  const out: string[] = []
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i]
    if (!a || a.startsWith('-') || a === '.') continue
    if (!isMediaPath(a)) continue
    if (existsSync(a)) out.push(path.resolve(a))
  }
  return out
}

function deliverFiles(paths: string[]) {
  if (paths.length === 0) return
  if (rendererReady && win) {
    win.webContents.send('app:open-files', paths)
  } else {
    pendingFiles.push(...paths)
  }
}

function createWindow() {
  const saved = store.get('windowBounds')
  const panelOpen = store.get('panelOpen')
  const baseW = panelOpen ? PLAYER_W + PANEL_W : PLAYER_W

  win = new BrowserWindow({
    width: saved?.width ?? baseW,
    height: saved?.height ?? PLAYER_H,
    x: saved?.x,
    y: saved?.y,
    minWidth: 640,
    minHeight: 420,
    backgroundColor: '#0e0f12',
    show: false,
    autoHideMenuBar: true,
    title: 'MediaLab  v 1.0.0',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      // Local desktop media player: needs to load file:// URLs in <video>.
      // No remote content is ever loaded, so disabling web security is safe here.
      webSecurity: false
    }
  })

  Menu.setApplicationMenu(null)

  win.on('ready-to-show', () => win?.show())

  win.on('close', () => {
    if (!win) return
    const b = win.getBounds()
    store.set('windowBounds', { width: b.width, height: b.height, x: b.x, y: b.y })
  })

  win.on('enter-full-screen', () => win?.webContents.send('window:fullscreen', true))
  win.on('leave-full-screen', () => win?.webContents.send('window:fullscreen', false))

  // Keep window title fixed (prevent renderer's <title> from overriding it)
  win.on('page-title-updated', (e) => e.preventDefault())

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  win.webContents.on('did-finish-load', () => {
    rendererReady = true
    if (pendingFiles.length > 0) {
      win?.webContents.send('app:open-files', pendingFiles)
      pendingFiles = []
    }
  })

  if (isDev) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL']!)
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

function registerIpc() {
  // 외부 URL 열기 (배너 광고 클릭 등) — http(s)만 허용
  ipcMain.handle('shell:openExternal', async (_e, url: string) => {
    if (typeof url !== 'string') return false
    if (!/^https?:\/\//i.test(url)) return false
    await shell.openExternal(url)
    return true
  })

  ipcMain.handle('files:pick', async () => {
    if (!win) return []
    return pickFiles(win)
  })

  ipcMain.handle('files:pick-folder', async (_e, opts: { audio: boolean; video: boolean; recursive: boolean }) => {
    if (!win) return []
    return pickFolder(win, opts)
  })

  ipcMain.handle('files:pick-subtitle', async () => {
    if (!win) return null
    return pickSubtitle(win)
  })

  ipcMain.handle('files:find-subtitle', async (_e, mediaPath: string) => {
    return findSiblingSubtitle(mediaPath)
  })

  ipcMain.handle('files:read-text', async (_e, p: string) => {
    return readFileText(p)
  })

  ipcMain.handle('playlist:save', async (_e, items) => {
    if (!win) return null
    return savePlaylist(win, items)
  })

  ipcMain.handle('playlist:load', async () => {
    if (!win) return null
    return loadPlaylist(win)
  })

  ipcMain.handle('playlist:list', async () => {
    return listPlaylists()
  })

  ipcMain.handle('store:get', (_e, key: string) => store.get(key as never))
  ipcMain.handle('store:set', (_e, key: string, val: unknown) => {
    store.set(key as never, val as never)
  })

  ipcMain.handle('window:set-panel', (_e, open: boolean) => {
    if (!win) return
    store.set('panelOpen', open)
    const b = win.getBounds()
    const targetW = open ? PLAYER_W + PANEL_W : PLAYER_W
    if (b.width < targetW || (!open && b.width > PLAYER_W + 32)) {
      win.setBounds({ x: b.x, y: b.y, width: targetW, height: b.height }, true)
    }
  })

  ipcMain.handle('window:toggle-fullscreen', () => {
    if (!win) return
    win.setFullScreen(!win.isFullScreen())
  })

  ipcMain.handle('window:set-always-on-top', (_e, on: boolean) => {
    if (!win) return
    win.setAlwaysOnTop(on)
  })

  ipcMain.handle('window:set-content-size', (_e, w: number, h: number) => {
    if (!win) return
    if (win.isFullScreen()) return
    if (win.isMaximized()) win.unmaximize()
    const display = screen.getDisplayMatching(win.getBounds())
    const wa = display.workArea
    const finalW = Math.max(640, Math.min(Math.round(w), wa.width))
    const finalH = Math.max(420, Math.min(Math.round(h), wa.height))
    win.setContentSize(finalW, finalH)
  })
}

// Initial argv (when launched fresh by OS via file association)
pendingFiles.push(...extractMediaFromArgv(process.argv))

// Second instance: forward the file path to the running window
app.on('second-instance', (_e, argv) => {
  const files = extractMediaFromArgv(argv)
  if (files.length > 0) deliverFiles(files)
  if (win) {
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

// macOS: "Open With" goes through this event instead of argv
app.on('open-file', (e, p) => {
  e.preventDefault()
  if (isMediaPath(p) && existsSync(p)) deliverFiles([path.resolve(p)])
})

app.whenReady().then(() => {
  registerIpc()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
