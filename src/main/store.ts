import Store from 'electron-store'

export interface ResumeEntry {
  position: number
  duration: number
  updatedAt: number
}

export interface AppSettings {
  volume: number
  muted: boolean
  panelOpen: boolean
  windowBounds?: { width: number; height: number; x?: number; y?: number }
  lastPlaylist: string[]
  resume: Record<string, ResumeEntry>
  repeatMode: 'off' | 'one' | 'all'
  shuffle: boolean
}

const defaults: AppSettings = {
  volume: 0.8,
  muted: false,
  panelOpen: false,
  lastPlaylist: [],
  resume: {},
  repeatMode: 'off',
  shuffle: false
}

export const store = new Store<AppSettings>({
  name: 'medialab',
  defaults
})
