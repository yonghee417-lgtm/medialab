import { useEffect, useState } from 'react'
import logoUrl from '../assets/logo.png'

interface Props {
  version: string
  duration?: number
  onDone: () => void
}

export default function Splash({ version, duration = 3000, onDone }: Props) {
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const fadeAt = duration - 400
    const fadeTimer = window.setTimeout(() => setFading(true), Math.max(0, fadeAt))
    const doneTimer = window.setTimeout(() => onDone(), duration)
    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(doneTimer)
    }
  }, [duration, onDone])

  return (
    <div className={`splash ${fading ? 'fade-out' : ''}`}>
      <img src={logoUrl} alt="MediaLab" />
      <div>
        <span className="splash-title">MediaLab</span>
        <span className="splash-version">v {version}</span>
      </div>
      <div className="splash-bar" />
    </div>
  )
}
