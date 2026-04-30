import type { MedialabAPI } from './index'

declare global {
  interface Window {
    medialab: MedialabAPI
  }
}

export {}
