import { useCallback, useEffect, useRef, useState } from 'react'
import Player, { PlayerHandle } from './components/Player'
import Controls from './components/Controls'
import Playlist from './components/Playlist'
import AddFolderDialog from './components/AddFolderDialog'
import Splash from './components/Splash'
import { useShortcuts } from './hooks/useShortcuts'
import type { MediaItem, ABLoop, RepeatMode } from './types'

export const APP_VERSION = '1.0.0'

export default function App() {
  const [splashDone, setSplashDone] = useState(false)

  const playerRef = useRef<PlayerHandle>(null)
  const volumeOverlayTimer = useRef<number | null>(null)

  const [items, setItems] = useState<MediaItem[]>([])
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)

  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [rate, setRate] = useState(1)

  const [abLoop, setAbLoop] = useState<ABLoop>({ a: null, b: null })
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off')
  const [shuffle, setShuffle] = useState(false)

  const [panelOpen, setPanelOpen] = useState(false)
  const [folderDialogOpen, setFolderDialogOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [volumeOverlay, setVolumeOverlay] = useState<number | null>(null)

  const current = currentIndex != null ? items[currentIndex] ?? null : null

  // Initial hydrate from settings
  useEffect(() => {
    void (async () => {
      try {
        const v = await window.medialab.getSetting<number>('volume')
        const m = await window.medialab.getSetting<boolean>('muted')
        const p = await window.medialab.getSetting<boolean>('panelOpen')
        const r = await window.medialab.getSetting<RepeatMode>('repeatMode')
        const sh = await window.medialab.getSetting<boolean>('shuffle')
        if (typeof v === 'number') setVolume(v)
        if (typeof m === 'boolean') setMuted(m)
        if (typeof p === 'boolean') setPanelOpen(p)
        if (r === 'one' || r === 'all' || r === 'off') setRepeatMode(r)
        if (typeof sh === 'boolean') setShuffle(sh)
      } finally {
        setHydrated(true)
      }
    })()
  }, [])

  // Persist relevant settings
  useEffect(() => {
    if (!hydrated) return
    void window.medialab.setSetting('volume', volume)
  }, [volume, hydrated])
  useEffect(() => {
    if (!hydrated) return
    void window.medialab.setSetting('muted', muted)
  }, [muted, hydrated])
  useEffect(() => {
    if (!hydrated) return
    void window.medialab.setSetting('repeatMode', repeatMode)
  }, [repeatMode, hydrated])
  useEffect(() => {
    if (!hydrated) return
    void window.medialab.setSetting('shuffle', shuffle)
  }, [shuffle, hydrated])

  // Persist panel state + resize window
  useEffect(() => {
    if (!hydrated) return
    void window.medialab.setPanel(panelOpen)
  }, [panelOpen, hydrated])

  // Subscribe to fullscreen state from main
  useEffect(() => {
    return window.medialab.onFullscreenChange((full) => setFullscreen(full))
  }, [])

  // In fullscreen, controls are hidden entirely.
  useEffect(() => {
    setControlsVisible(!fullscreen)
  }, [fullscreen])

  useEffect(() => {
    return () => {
      if (volumeOverlayTimer.current != null) window.clearTimeout(volumeOverlayTimer.current)
    }
  }, [])

  // Reset A-B markers when track changes
  useEffect(() => {
    setAbLoop({ a: null, b: null })
    setCurrentTime(0)
  }, [current?.path])

  // ---- Playlist actions ----
  const addItems = useCallback((newItems: MediaItem[]) => {
    if (newItems.length === 0) return
    setItems((prev) => {
      const seen = new Set(prev.map((i) => i.path))
      const additions = newItems.filter((i) => !seen.has(i.path))
      const next = [...prev, ...additions]
      if (currentIndex == null && next.length > 0) setCurrentIndex(prev.length)
      return next
    })
  }, [currentIndex])

  const handleAddFiles = useCallback(async () => {
    const picked = await window.medialab.pickFiles()
    addItems(picked)
  }, [addItems])

  const handleAddFolderConfirm = useCallback(
    async (opts: { audio: boolean; video: boolean; recursive: boolean }) => {
      const picked = await window.medialab.pickFolder(opts)
      addItems(picked)
    },
    [addItems]
  )

  const handleRemove = useCallback(
    (idx: number) => {
      setItems((prev) => {
        const next = prev.filter((_, i) => i !== idx)
        if (currentIndex != null) {
          if (idx === currentIndex) {
            setCurrentIndex(next.length > 0 ? Math.min(idx, next.length - 1) : null)
          } else if (idx < currentIndex) {
            setCurrentIndex(currentIndex - 1)
          }
        }
        return next
      })
    },
    [currentIndex]
  )

  const handleClear = useCallback(() => {
    setItems([])
    setCurrentIndex(null)
  }, [])

  const handleSave = useCallback(async () => {
    if (items.length === 0) return
    await window.medialab.savePlaylist(items)
  }, [items])

  const handleLoad = useCallback(async () => {
    const pl = await window.medialab.loadPlaylist()
    if (pl) {
      setItems(pl.items)
      setCurrentIndex(pl.items.length > 0 ? 0 : null)
    }
  }, [])

  const handleSelect = useCallback((idx: number) => {
    setCurrentIndex(idx)
  }, [])

  const handleAddDropped = useCallback(async (paths: string[]) => {
    // Drag-dropped files: classify by extension
    const VIDEO = new Set(['.mp4', '.m4v', '.mkv', '.webm', '.mov', '.avi', '.wmv', '.flv', '.ts', '.mpg', '.mpeg', '.3gp', '.ogv'])
    const AUDIO = new Set(['.mp3', '.flac', '.m4a', '.wav', '.ogg', '.opus', '.aac', '.wma', '.aiff', '.aif', '.ape', '.alac'])
    const newItems: MediaItem[] = []
    for (const p of paths) {
      const ext = '.' + p.split('.').pop()?.toLowerCase()
      const name = p.split(/[\\/]/).pop() || p
      if (VIDEO.has(ext)) newItems.push({ path: p, name, kind: 'video', size: 0 })
      else if (AUDIO.has(ext)) newItems.push({ path: p, name, kind: 'audio', size: 0 })
    }
    addItems(newItems)
  }, [addItems])

  // Files opened from OS (double-click on associated file, or "Open With")
  useEffect(() => {
    return window.medialab.onOpenFiles((paths) => {
      if (!paths || paths.length === 0) return
      const VIDEO = new Set(['.mp4', '.m4v', '.mkv', '.webm', '.mov', '.avi', '.wmv', '.flv', '.ts', '.mpg', '.mpeg', '.3gp', '.ogv'])
      const AUDIO = new Set(['.mp3', '.flac', '.m4a', '.wav', '.ogg', '.opus', '.aac', '.wma', '.aiff', '.aif', '.ape', '.alac'])
      const newItems: MediaItem[] = []
      for (const p of paths) {
        const ext = '.' + (p.split('.').pop() ?? '').toLowerCase()
        const name = p.split(/[\\/]/).pop() || p
        if (VIDEO.has(ext)) newItems.push({ path: p, name, kind: 'video', size: 0 })
        else if (AUDIO.has(ext)) newItems.push({ path: p, name, kind: 'audio', size: 0 })
      }
      if (newItems.length === 0) return
      // Add and start playing the first new item
      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.path))
        const additions = newItems.filter((i) => !seen.has(i.path))
        const next = [...prev, ...additions]
        // Find playing target — first of newly added that exists in next
        const firstAddedPath = (additions[0] ?? newItems[0]).path
        const targetIdx = next.findIndex((i) => i.path === firstAddedPath)
        if (targetIdx >= 0) setCurrentIndex(targetIdx)
        return next
      })
      // Skip splash on file-open launch so playback starts immediately
      setSplashDone(true)
    })
  }, [])

  const handlePickSubtitle = useCallback(async () => {
    const p = await window.medialab.pickSubtitle()
    if (p) await playerRef.current?.loadSubtitleFromPath(p)
  }, [])

  // ---- Playback navigation ----
  const goNext = useCallback(() => {
    if (items.length === 0 || currentIndex == null) return
    if (repeatMode === 'one') {
      // Restart current
      playerRef.current?.seekAbs(0)
      playerRef.current?.play()
      return
    }
    if (shuffle && items.length > 1) {
      let idx: number
      do {
        idx = Math.floor(Math.random() * items.length)
      } while (idx === currentIndex)
      setCurrentIndex(idx)
      return
    }
    const next = currentIndex + 1
    if (next >= items.length) {
      if (repeatMode === 'all') setCurrentIndex(0)
      // else: stop at end
    } else {
      setCurrentIndex(next)
    }
  }, [items.length, currentIndex, repeatMode, shuffle])

  const goPrev = useCallback(() => {
    if (items.length === 0 || currentIndex == null) return
    // If >3s in, restart current; else go previous
    if (currentTime > 3) {
      playerRef.current?.seekAbs(0)
      return
    }
    const prev = currentIndex - 1
    if (prev < 0) {
      if (repeatMode === 'all') setCurrentIndex(items.length - 1)
    } else {
      setCurrentIndex(prev)
    }
  }, [items.length, currentIndex, currentTime, repeatMode])

  // ---- Keyboard handlers wiring ----
  const handleAB = useCallback(() => {
    setAbLoop((prev) => {
      if (prev.a == null) return { a: currentTime, b: null }
      if (prev.b == null) {
        if (currentTime <= prev.a) return { a: currentTime, b: null }
        return { a: prev.a, b: currentTime }
      }
      return { a: null, b: null }
    })
  }, [currentTime])

  const handleSpeed = useCallback(
    (delta: number) => {
      const next = Math.max(0.25, Math.min(4, +(rate + delta).toFixed(2)))
      playerRef.current?.setRate(next)
      setRate(next)
    },
    [rate]
  )

  const handleZoom = useCallback(
    (scale: number) => {
      const v = playerRef.current?.getEl()
      if (!v || !v.videoWidth || !v.videoHeight) return
      const controlsEl = document.querySelector('.controls') as HTMLElement | null
      const controlsH = controlsEl?.getBoundingClientRect().height ?? 84
      const panelW = panelOpen ? 340 : 0
      const targetW = Math.round(v.videoWidth * scale + panelW)
      const targetH = Math.round(v.videoHeight * scale + controlsH)
      void window.medialab.setContentSize(targetW, targetH)
    },
    [panelOpen]
  )

  const showVolumeOverlay = useCallback((nextVolume: number) => {
    setVolumeOverlay(Math.round(nextVolume * 100))
    if (volumeOverlayTimer.current != null) window.clearTimeout(volumeOverlayTimer.current)
    volumeOverlayTimer.current = window.setTimeout(() => {
      setVolumeOverlay(null)
      volumeOverlayTimer.current = null
    }, 2000)
  }, [])

  useShortcuts({
    onPlayPause: () => playerRef.current?.toggle(),
    onSeekRel: (d) => playerRef.current?.seekRel(d),
    onVolumeRel: (d) => {
      setVolume((v) => {
        const next = Math.max(0, Math.min(1, +(v + d).toFixed(2)))
        showVolumeOverlay(next)
        return next
      })
      if (muted) setMuted(false)
    },
    onToggleMute: () => setMuted((m) => !m),
    onTogglePanel: () => setPanelOpen((p) => !p),
    onToggleFullscreen: () => window.medialab.toggleFullscreen(),
    onNext: goNext,
    onPrev: goPrev,
    onFrameStep: (d) => playerRef.current?.frameStep(d),
    onABMark: handleAB,
    onSubtitleToggle: () => playerRef.current?.toggleSubtitle(),
    onSpeedRel: handleSpeed,
    onZoom: handleZoom
  })

  const showControls = !fullscreen || controlsVisible
  const showPanel = panelOpen && !fullscreen

  if (!splashDone) {
    return <Splash version={APP_VERSION} duration={3000} onDone={() => setSplashDone(true)} />
  }

  return (
    <div
      className={`app ${panelOpen ? 'panel-open' : ''} ${fullscreen ? 'fullscreen' : ''}`}
    >
      <div className="main">
        <Player
          ref={playerRef}
          current={current}
          volume={volume}
          muted={muted}
          rate={rate}
          abLoop={abLoop}
          onTimeUpdate={setCurrentTime}
          onDurationChange={setDuration}
          onPlayingChange={setPlaying}
          onRateChange={setRate}
          onEnded={goNext}
        />
        {showControls && (
        <Controls
          playing={playing}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          muted={muted}
          rate={rate}
          abLoop={abLoop}
          repeatMode={repeatMode}
          shuffle={shuffle}
          panelOpen={panelOpen}
          onPlayPause={() => playerRef.current?.toggle()}
          onSeek={(s) => playerRef.current?.seekAbs(s)}
          onVolume={(v) => {
            setVolume(v)
            showVolumeOverlay(v)
            if (muted && v > 0) setMuted(false)
          }}
          onMute={() => setMuted((m) => !m)}
          onPrev={goPrev}
          onNext={goNext}
          onRepeat={() =>
            setRepeatMode((m) => (m === 'off' ? 'all' : m === 'all' ? 'one' : 'off'))
          }
          onShuffle={() => setShuffle((s) => !s)}
          onAB={handleAB}
          onPanel={() => setPanelOpen((p) => !p)}
          onFullscreen={() => window.medialab.toggleFullscreen()}
          onSubtitle={() => playerRef.current?.toggleSubtitle()}
          onSpeed={handleSpeed}
        />
        )}
      </div>

      {showPanel && (
        <Playlist
          items={items}
          currentIndex={currentIndex}
          onSelect={handleSelect}
          onAddFiles={handleAddFiles}
          onAddFolder={() => setFolderDialogOpen(true)}
          onRemove={handleRemove}
          onClear={handleClear}
          onSave={handleSave}
          onLoad={handleLoad}
          onPickSubtitle={handlePickSubtitle}
          onAddDropped={handleAddDropped}
        />
      )}

      <AddFolderDialog
        open={folderDialogOpen}
        onClose={() => setFolderDialogOpen(false)}
        onConfirm={handleAddFolderConfirm}
      />

      {volumeOverlay != null && (
        <div className="volume-overlay" aria-live="polite">
          Volume {volumeOverlay}%
        </div>
      )}
    </div>
  )
}
