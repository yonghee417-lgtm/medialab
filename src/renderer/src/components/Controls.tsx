import { useRef } from 'react'
import { formatTime } from '../lib/format'
import type { ABLoop, RepeatMode } from '../types'

interface Props {
  playing: boolean
  currentTime: number
  duration: number
  volume: number
  muted: boolean
  rate: number
  abLoop: ABLoop
  repeatMode: RepeatMode
  shuffle: boolean
  panelOpen: boolean
  onPlayPause: () => void
  onSeek: (sec: number) => void
  onVolume: (v: number) => void
  onMute: () => void
  onPrev: () => void
  onNext: () => void
  onRepeat: () => void
  onShuffle: () => void
  onAB: () => void
  onPanel: () => void
  onFullscreen: () => void
  onSubtitle: () => void
  onSpeed: (delta: number) => void
}

export default function Controls(props: Props) {
  const seekRef = useRef<HTMLInputElement>(null)

  const repeatLabel = props.repeatMode === 'one' ? '1' : props.repeatMode === 'all' ? '∞' : '·'
  const abLabel =
    props.abLoop.a == null ? 'A-B' : props.abLoop.b == null ? `A:${formatTime(props.abLoop.a)}` : 'A↔B'

  return (
    <div className="controls">
      <div className="seek-row">
        <span className="time">{formatTime(props.currentTime)}</span>
        <div className="seek-wrap">
          <input
            ref={seekRef}
            className="seek"
            type="range"
            min={0}
            max={props.duration || 0}
            step={0.1}
            value={Math.min(props.currentTime, props.duration || 0)}
            onChange={(e) => props.onSeek(parseFloat(e.target.value))}
            style={{
              background: `linear-gradient(to right, #5a8dee 0%, #5a8dee ${
                props.duration ? (props.currentTime / props.duration) * 100 : 0
              }%, #2a2d35 ${
                props.duration ? (props.currentTime / props.duration) * 100 : 0
              }%, #2a2d35 100%)`
            }}
          />
          {props.abLoop.a != null && props.duration > 0 && (
            <span
              className="ab-marker a"
              style={{ left: `${(props.abLoop.a / props.duration) * 100}%` }}
            />
          )}
          {props.abLoop.b != null && props.duration > 0 && (
            <span
              className="ab-marker b"
              style={{ left: `${(props.abLoop.b / props.duration) * 100}%` }}
            />
          )}
        </div>
        <span className="time">{formatTime(props.duration)}</span>
      </div>

      <div className="btn-row">
        <div className="left-group">
          <button className="icon-btn" onClick={props.onPrev} title="이전 (P)">
            ⏮
          </button>
          <button className="icon-btn primary" onClick={props.onPlayPause} title="재생/일시정지 (Space)">
            {props.playing ? '⏸' : '▶'}
          </button>
          <button className="icon-btn" onClick={props.onNext} title="다음 (N)">
            ⏭
          </button>

          <div className="vol-group">
            <button
              className="icon-btn small"
              onClick={props.onMute}
              title={props.muted ? '음소거 해제 (M)' : '음소거 (M)'}
            >
              {props.muted || props.volume === 0 ? '🔇' : props.volume < 0.5 ? '🔉' : '🔊'}
            </button>
            <input
              className="vol"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={props.muted ? 0 : props.volume}
              onChange={(e) => props.onVolume(parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div className="right-group">
          <button className="icon-btn small" onClick={() => props.onSpeed(-0.1)} title="속도 감소 [">
            −
          </button>
          <span className="speed">{props.rate.toFixed(2)}x</span>
          <button className="icon-btn small" onClick={() => props.onSpeed(0.1)} title="속도 증가 ]">
            +
          </button>

          <button
            className={`icon-btn small ${props.abLoop.a != null ? 'active' : ''}`}
            onClick={props.onAB}
            title="A-B 구간반복 (A)"
          >
            {abLabel}
          </button>

          <button
            className={`icon-btn small ${props.shuffle ? 'active' : ''}`}
            onClick={props.onShuffle}
            title="셔플"
          >
            🔀
          </button>
          <button
            className={`icon-btn small ${props.repeatMode !== 'off' ? 'active' : ''}`}
            onClick={props.onRepeat}
            title={`반복 (${props.repeatMode})`}
          >
            🔁<sup>{repeatLabel}</sup>
          </button>

          <button className="icon-btn small" onClick={props.onSubtitle} title="자막 토글 (S)">
            CC
          </button>
          <button className="icon-btn small" onClick={props.onFullscreen} title="전체화면 (F)">
            ⛶
          </button>
          <button
            className={`icon-btn small ${props.panelOpen ? 'active' : ''}`}
            onClick={props.onPanel}
            title="재생목록 (F8)"
          >
            ☰
          </button>
        </div>
      </div>
    </div>
  )
}
