import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { MediaItem, ABLoop } from '../types'
import { loadSubtitleAsVttUrl } from '../lib/subtitle'

export interface PlayerHandle {
  play(): void
  pause(): void
  toggle(): void
  seekRel(deltaSec: number): void
  seekAbs(sec: number): void
  setVolume(v: number): void
  setMuted(m: boolean): void
  setRate(r: number): void
  frameStep(dir: 1 | -1): void
  toggleSubtitle(): void
  loadSubtitleFromPath(path: string): Promise<void>
  getEl(): HTMLVideoElement | null
}

interface Props {
  current: MediaItem | null
  volume: number
  muted: boolean
  rate: number
  abLoop: ABLoop
  onTimeUpdate: (t: number) => void
  onDurationChange: (d: number) => void
  onPlayingChange: (playing: boolean) => void
  onRateChange: (r: number) => void
  onEnded: () => void
}

const Player = forwardRef<PlayerHandle, Props>(function Player(props, ref) {
  const {
    current,
    volume,
    muted,
    rate,
    abLoop,
    onTimeUpdate,
    onDurationChange,
    onPlayingChange,
    onRateChange,
    onEnded
  } = props

  const videoRef = useRef<HTMLVideoElement>(null)
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null)
  const [subtitleVisible, setSubtitleVisible] = useState(true)
  const [resumeShown, setResumeShown] = useState<{ pos: number; dur: number } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const lastBlobRef = useRef<string | null>(null)
  const currentPathRef = useRef<string | null>(null)

  // Apply volume / mute / rate
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.volume = Math.max(0, Math.min(1, volume))
  }, [volume])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = muted
  }, [muted])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.playbackRate = rate
  }, [rate])

  // Load source on track change + auto-load sibling subtitle + resume position
  useEffect(() => {
    let cancelled = false
    async function load() {
      const v = videoRef.current
      if (!v) return
      if (lastBlobRef.current) {
        URL.revokeObjectURL(lastBlobRef.current)
        lastBlobRef.current = null
      }
      setSubtitleUrl(null)
      setResumeShown(null)
      setErrorMsg(null)
      currentPathRef.current = current?.path ?? null
      if (!current) {
        v.removeAttribute('src')
        v.load()
        return
      }
      v.src = window.medialab.toMediaUrl(current.path)
      v.load()

      // Subtitle for video files only
      if (current.kind === 'video') {
        const subPath = await window.medialab.findSubtitle(current.path)
        if (cancelled) return
        if (subPath) {
          const url = await loadSubtitleAsVttUrl(subPath)
          if (cancelled) return
          if (url) {
            lastBlobRef.current = url
            setSubtitleUrl(url)
          }
        }
      }

      // Resume position
      const resume = (await window.medialab.getSetting<Record<string, { position: number; duration: number; updatedAt: number }>>(
        'resume'
      )) || {}
      const entry = resume[current.path]
      if (entry && entry.duration > 0 && entry.position > 5 && entry.position < entry.duration - 10) {
        setResumeShown({ pos: entry.position, dur: entry.duration })
      }

      try {
        await v.play()
      } catch {
        // autoplay blocked; user can press space
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [current?.path])

  // Save resume position periodically
  useEffect(() => {
    const id = setInterval(async () => {
      const v = videoRef.current
      const p = currentPathRef.current
      if (!v || !p || !v.duration || v.paused) return
      const resume =
        (await window.medialab.getSetting<Record<string, { position: number; duration: number; updatedAt: number }>>(
          'resume'
        )) || {}
      resume[p] = { position: v.currentTime, duration: v.duration, updatedAt: Date.now() }
      await window.medialab.setSetting('resume', resume)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  // A-B loop monitoring
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (abLoop.a == null || abLoop.b == null) return
    const onTick = () => {
      if (abLoop.a == null || abLoop.b == null) return
      if (v.currentTime >= abLoop.b) {
        v.currentTime = abLoop.a
      }
    }
    v.addEventListener('timeupdate', onTick)
    return () => v.removeEventListener('timeupdate', onTick)
  }, [abLoop.a, abLoop.b])

  useImperativeHandle(ref, () => ({
    play: () => videoRef.current?.play().catch(() => {}),
    pause: () => videoRef.current?.pause(),
    toggle: () => {
      const v = videoRef.current
      if (!v) return
      if (v.paused) v.play().catch(() => {})
      else v.pause()
    },
    seekRel: (delta) => {
      const v = videoRef.current
      if (!v || !isFinite(v.duration)) return
      v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + delta))
    },
    seekAbs: (sec) => {
      const v = videoRef.current
      if (!v) return
      v.currentTime = Math.max(0, Math.min(v.duration || sec, sec))
    },
    setVolume: (val) => {
      const v = videoRef.current
      if (!v) return
      v.volume = Math.max(0, Math.min(1, val))
    },
    setMuted: (m) => {
      const v = videoRef.current
      if (!v) return
      v.muted = m
    },
    setRate: (r) => {
      const v = videoRef.current
      if (!v) return
      v.playbackRate = r
      onRateChange(r)
    },
    frameStep: (dir) => {
      const v = videoRef.current
      if (!v) return
      if (!v.paused) v.pause()
      v.currentTime = Math.max(0, v.currentTime + (dir * 1) / 30)
    },
    toggleSubtitle: () => {
      setSubtitleVisible((s) => !s)
    },
    loadSubtitleFromPath: async (p) => {
      if (lastBlobRef.current) URL.revokeObjectURL(lastBlobRef.current)
      const url = await loadSubtitleAsVttUrl(p)
      if (url) {
        lastBlobRef.current = url
        setSubtitleUrl(url)
        setSubtitleVisible(true)
      }
    },
    getEl: () => videoRef.current
  }))

  // Toggle subtitle track display
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const tracks = v.textTracks
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = subtitleVisible ? 'showing' : 'disabled'
    }
  }, [subtitleVisible, subtitleUrl])

  const handleResume = () => {
    const v = videoRef.current
    if (v && resumeShown) {
      v.currentTime = resumeShown.pos
      v.play().catch(() => {})
    }
    setResumeShown(null)
  }

  const isAudio = current?.kind === 'audio'

  return (
    <div className={`player-stage ${isAudio ? 'audio-mode' : ''}`}>
      <video
        ref={videoRef}
        className="player-video"
        onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
        onDurationChange={(e) => onDurationChange(e.currentTarget.duration)}
        onPlay={() => onPlayingChange(true)}
        onPause={() => onPlayingChange(false)}
        onEnded={onEnded}
        onError={(e) => {
          const v = e.currentTarget
          const err = v.error
          const codeText: Record<number, string> = {
            1: 'ABORTED (사용자/스크립트가 중단)',
            2: 'NETWORK (파일 로드 실패 - 경로/권한 확인)',
            3: 'DECODE (코덱 디코딩 실패)',
            4: 'SRC_NOT_SUPPORTED (지원하지 않는 포맷/코덱)'
          }
          const code = err?.code ?? 0
          const text = `[코드 ${code}] ${codeText[code] || 'Unknown'}${err?.message ? ' — ' + err.message : ''}`
          console.error('Video error:', code, err?.message, 'src:', v.currentSrc)
          setErrorMsg(text)
        }}
        onLoadStart={() => console.log('[video] loadstart', videoRef.current?.currentSrc)}
        onLoadedMetadata={(e) => console.log('[video] loadedmetadata, duration=', e.currentTarget.duration)}
        onCanPlay={() => console.log('[video] canplay')}
        onClick={() => {
          const v = videoRef.current
          if (!v) return
          if (v.paused) v.play().catch(() => {})
          else v.pause()
        }}
        onDoubleClick={() => window.medialab.toggleFullscreen()}
      >
        {subtitleUrl && (
          <track default kind="subtitles" srcLang="ko" label="자막" src={subtitleUrl} />
        )}
      </video>

      {isAudio && current && (
        <div className="audio-overlay">
          <div className="audio-icon">♪</div>
          <div className="audio-title">{current.name}</div>
        </div>
      )}

      {!current && (
        <div className="player-empty">
          <div className="empty-logo">MediaLab</div>
          <div className="empty-hint">F8을 눌러 재생목록에 파일을 추가하세요</div>
        </div>
      )}

      {resumeShown && (
        <div className="resume-banner">
          <span>이어보기 {Math.floor(resumeShown.pos / 60)}분 {Math.floor(resumeShown.pos % 60)}초</span>
          <button onClick={handleResume}>이어서 보기</button>
          <button className="ghost" onClick={() => setResumeShown(null)}>처음부터</button>
        </div>
      )}

      {errorMsg && (
        <div className="error-banner">
          <strong>재생 실패</strong>
          <span>{errorMsg}</span>
          <button className="ghost" onClick={() => setErrorMsg(null)}>닫기</button>
        </div>
      )}
    </div>
  )
})

export default Player
