import { useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: (opts: { audio: boolean; video: boolean; recursive: boolean }) => void
}

export default function AddFolderDialog({ open, onClose, onConfirm }: Props) {
  const [audio, setAudio] = useState(true)
  const [video, setVideo] = useState(true)
  const [recursive, setRecursive] = useState(true)

  if (!open) return null

  const canConfirm = audio || video

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>폴더 추가</h3>
        <p className="hint">
          선택한 폴더에서 어떤 종류의 파일을 추가할지 골라주세요. 폴더 경로는 다음 단계에서 선택합니다.
        </p>
        <label className="check">
          <input type="checkbox" checked={audio} onChange={(e) => setAudio(e.target.checked)} />
          <span>음악 파일 추가</span>
          <small>mp3, flac, m4a, wav, ogg, opus, aac 등</small>
        </label>
        <label className="check">
          <input type="checkbox" checked={video} onChange={(e) => setVideo(e.target.checked)} />
          <span>영상 파일 추가</span>
          <small>mp4, mkv, mov, webm, avi, wmv 등</small>
        </label>
        <label className="check">
          <input type="checkbox" checked={recursive} onChange={(e) => setRecursive(e.target.checked)} />
          <span>하위 폴더 포함</span>
          <small>하위 폴더의 파일도 모두 검색</small>
        </label>

        <div className="modal-actions">
          <button className="ghost" onClick={onClose}>취소</button>
          <button
            className="primary"
            disabled={!canConfirm}
            onClick={() => {
              onConfirm({ audio, video, recursive })
              onClose()
            }}
          >
            폴더 선택
          </button>
        </div>
      </div>
    </div>
  )
}
