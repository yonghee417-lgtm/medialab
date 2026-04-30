// vite 의 define 으로 빌드 시점에 주입되는 앱 버전 (배너 API 의 v= 파라미터용)
declare global {
  const __APP_VERSION__: string
}

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
