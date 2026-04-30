export interface MediaItem {
  path: string
  name: string
  kind: 'audio' | 'video'
  size: number
}

export type RepeatMode = 'off' | 'one' | 'all'

export interface ABLoop {
  a: number | null
  b: number | null
}
