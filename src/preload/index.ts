import { contextBridge, ipcRenderer, webUtils } from 'electron'

export interface MediaItem {
  path: string
  name: string
  kind: 'audio' | 'video'
  size: number
}

export interface SavedPlaylist {
  name: string
  items: MediaItem[]
  savedAt: number
}

const api = {
  pickFiles: (): Promise<MediaItem[]> => ipcRenderer.invoke('files:pick'),
  pickFolder: (opts: { audio: boolean; video: boolean; recursive: boolean }): Promise<MediaItem[]> =>
    ipcRenderer.invoke('files:pick-folder', opts),
  pickSubtitle: (): Promise<string | null> => ipcRenderer.invoke('files:pick-subtitle'),
  findSubtitle: (mediaPath: string): Promise<string | null> =>
    ipcRenderer.invoke('files:find-subtitle', mediaPath),
  readText: (p: string): Promise<string> => ipcRenderer.invoke('files:read-text', p),

  savePlaylist: (items: MediaItem[]): Promise<string | null> =>
    ipcRenderer.invoke('playlist:save', items),
  loadPlaylist: (): Promise<SavedPlaylist | null> => ipcRenderer.invoke('playlist:load'),
  listPlaylists: (): Promise<{ name: string; file: string }[]> =>
    ipcRenderer.invoke('playlist:list'),

  getSetting: <T = unknown>(key: string): Promise<T> => ipcRenderer.invoke('store:get', key),
  setSetting: (key: string, val: unknown): Promise<void> =>
    ipcRenderer.invoke('store:set', key, val),

  setPanel: (open: boolean): Promise<void> => ipcRenderer.invoke('window:set-panel', open),
  toggleFullscreen: (): Promise<void> => ipcRenderer.invoke('window:toggle-fullscreen'),
  setAlwaysOnTop: (on: boolean): Promise<void> => ipcRenderer.invoke('window:set-always-on-top', on),
  setContentSize: (w: number, h: number): Promise<void> =>
    ipcRenderer.invoke('window:set-content-size', w, h),
  onFullscreenChange: (cb: (full: boolean) => void): (() => void) => {
    const listener = (_: unknown, full: boolean) => cb(full)
    ipcRenderer.on('window:fullscreen', listener)
    return () => ipcRenderer.removeListener('window:fullscreen', listener)
  },

  toMediaUrl: (p: string): string => {
    const norm = p.replace(/\\/g, '/')
    // file:/// for absolute paths. encodeURIComponent each segment to handle
    // spaces, Korean characters, special chars; preserve / separators.
    const encoded = norm
      .split('/')
      .map((seg) => encodeURIComponent(seg))
      .join('/')
    // Windows: "C:/foo" -> "file:///C:/foo"
    // macOS/Linux: "/Users/foo" -> "file:///Users/foo"
    const prefix = norm.startsWith('/') ? 'file://' : 'file:///'
    return prefix + encoded
  },

  getFilePath: (file: File): string => {
    try {
      return webUtils.getPathForFile(file)
    } catch {
      return ''
    }
  }
}

contextBridge.exposeInMainWorld('medialab', api)

export type MedialabAPI = typeof api
