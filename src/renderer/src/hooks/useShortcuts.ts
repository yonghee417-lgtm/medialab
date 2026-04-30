import { useEffect } from 'react'

export interface ShortcutHandlers {
  onPlayPause: () => void
  onSeekRel: (deltaSec: number) => void
  onVolumeRel: (delta: number) => void
  onToggleMute: () => void
  onTogglePanel: () => void
  onToggleFullscreen: () => void
  onNext: () => void
  onPrev: () => void
  onFrameStep: (dir: 1 | -1) => void
  onABMark: () => void
  onSubtitleToggle: () => void
  onSpeedRel: (delta: number) => void
  onZoom: (scale: number) => void
}

export function useShortcuts(h: ShortcutHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore inside input fields
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return

      const key = e.key
      const code = e.code

      // Alt + digit: window zoom (1=50%, 2=100%, 3=200%, 4=300%)
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const zoomMap: Record<string, number> = { '1': 0.5, '2': 1, '3': 2, '4': 3 }
        if (zoomMap[key] !== undefined) {
          e.preventDefault()
          h.onZoom(zoomMap[key])
          return
        }
      }

      // F-keys / single keys without modifiers
      if (!e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        if (code === 'Space') {
          e.preventDefault()
          h.onPlayPause()
          return
        }
        if (key === 'Enter') {
          // If a playlist row is focused, let it handle Enter
          if (target?.closest('[data-row]')) return
          e.preventDefault()
          h.onToggleFullscreen()
          return
        }
        if (key === 'F8') {
          e.preventDefault()
          h.onTogglePanel()
          return
        }
        if (key === 'f' || key === 'F') {
          e.preventDefault()
          h.onToggleFullscreen()
          return
        }
        if (key === 'm' || key === 'M') {
          e.preventDefault()
          h.onToggleMute()
          return
        }
        if (key === 'a' || key === 'A') {
          e.preventDefault()
          h.onABMark()
          return
        }
        if (key === 'n' || key === 'N') {
          e.preventDefault()
          h.onNext()
          return
        }
        if (key === 'p' || key === 'P') {
          e.preventDefault()
          h.onPrev()
          return
        }
        if (key === 'PageDown') {
          e.preventDefault()
          h.onNext()
          return
        }
        if (key === 'PageUp') {
          e.preventDefault()
          h.onPrev()
          return
        }
        if (key === 's' || key === 'S') {
          e.preventDefault()
          h.onSubtitleToggle()
          return
        }
        if (key === ',') {
          e.preventDefault()
          h.onFrameStep(-1)
          return
        }
        if (key === '.') {
          e.preventDefault()
          h.onFrameStep(1)
          return
        }
        if (key === '[') {
          e.preventDefault()
          h.onSpeedRel(-0.1)
          return
        }
        if (key === ']') {
          e.preventDefault()
          h.onSpeedRel(0.1)
          return
        }
      }

      // Arrow keys with modifiers
      if (key === 'ArrowLeft' || key === 'ArrowRight') {
        e.preventDefault()
        const dir = key === 'ArrowRight' ? 1 : -1
        let secs = 5
        if (e.altKey) secs = 300
        else if (e.ctrlKey || e.metaKey) secs = 30
        h.onSeekRel(dir * secs)
        return
      }
      if (key === 'ArrowUp' || key === 'ArrowDown') {
        e.preventDefault()
        const dir = key === 'ArrowUp' ? 1 : -1
        h.onVolumeRel(dir * 0.05)
        return
      }
      if (key === 'PageDown') {
        e.preventDefault()
        h.onNext()
        return
      }
      if (key === 'PageUp') {
        e.preventDefault()
        h.onPrev()
        return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [h])
}
