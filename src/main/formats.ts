export const AUDIO_EXTS = new Set([
  '.mp3', '.flac', '.m4a', '.wav', '.ogg', '.opus',
  '.aac', '.wma', '.aiff', '.aif', '.ape', '.alac'
])

export const VIDEO_EXTS = new Set([
  '.mp4', '.m4v', '.mkv', '.webm', '.mov', '.avi',
  '.wmv', '.flv', '.ts', '.mpg', '.mpeg', '.3gp', '.ogv'
])

export const SUBTITLE_EXTS = new Set(['.srt', '.vtt', '.smi', '.sami', '.ass', '.ssa'])

export type MediaKind = 'audio' | 'video'

export function classify(ext: string): MediaKind | null {
  const e = ext.toLowerCase()
  if (AUDIO_EXTS.has(e)) return 'audio'
  if (VIDEO_EXTS.has(e)) return 'video'
  return null
}
