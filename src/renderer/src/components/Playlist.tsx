import { useRef, useState } from 'react'
import type { MediaItem } from '../types'
import { formatBytes } from '../lib/format'

interface Props {
  items: MediaItem[]
  currentIndex: number | null
  onSelect: (index: number) => void
  onAddFiles: () => void
  onAddFolder: () => void
  onRemove: (index: number) => void
  onClear: () => void
  onSave: () => void
  onLoad: () => void
  onPickSubtitle: () => void
  onAddDropped: (paths: string[]) => void
}

export default function Playlist(props: Props) {
  const [filter, setFilter] = useState('')
  const [dragging, setDragging] = useState(false)
  const dragCounter = useRef(0)

  const filtered = props.items
    .map((item, i) => ({ item, i }))
    .filter(({ item }) =>
      filter ? item.name.toLowerCase().includes(filter.toLowerCase()) : true
    )

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current = 0
    setDragging(false)
    const paths: string[] = []
    for (const f of Array.from(e.dataTransfer.files)) {
      const p = window.medialab.getFilePath(f)
      if (p) paths.push(p)
    }
    if (paths.length) props.onAddDropped(paths)
  }

  return (
    <aside
      className={`playlist ${dragging ? 'drag-over' : ''}`}
      onDragEnter={(e) => {
        e.preventDefault()
        dragCounter.current++
        setDragging(true)
      }}
      onDragLeave={() => {
        dragCounter.current--
        if (dragCounter.current <= 0) setDragging(false)
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="playlist-header">
        <div className="playlist-title">
          <span>재생목록</span>
          <span className="count">{props.items.length}</span>
        </div>
        <div className="playlist-actions">
          <button className="ghost small" onClick={props.onAddFiles}>＋ 파일</button>
          <button className="ghost small" onClick={props.onAddFolder}>＋ 폴더</button>
        </div>
        <div className="playlist-actions secondary">
          <button className="ghost small" onClick={props.onSave} title="재생목록 저장">저장</button>
          <button className="ghost small" onClick={props.onLoad} title="재생목록 불러오기">불러오기</button>
          <button className="ghost small" onClick={props.onPickSubtitle} title="자막 파일 선택">자막</button>
          <button className="ghost small danger" onClick={props.onClear} title="모두 비우기">비움</button>
        </div>
        <input
          className="filter"
          placeholder="검색..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="playlist-body">
        {filtered.length === 0 && (
          <div className="empty">
            <div>재생목록이 비어있습니다</div>
            <div className="hint">파일/폴더 추가 또는 드래그&드롭</div>
          </div>
        )}
        {filtered.map(({ item, i }) => (
          <div
            key={item.path + i}
            data-row="1"
            tabIndex={0}
            className={`row ${i === props.currentIndex ? 'active' : ''}`}
            onDoubleClick={() => props.onSelect(i)}
            onClick={() => props.onSelect(i)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                e.stopPropagation()
                props.onSelect(i)
              } else if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault()
                e.stopPropagation()
                props.onRemove(i)
              }
            }}
          >
            <div className="kind">{item.kind === 'audio' ? '♪' : '▶'}</div>
            <div className="meta">
              <div className="name" title={item.path}>{item.name}</div>
              <div className="sub">{formatBytes(item.size)}</div>
            </div>
            <button
              className="x"
              onClick={(e) => {
                e.stopPropagation()
                props.onRemove(i)
              }}
              title="제거"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {dragging && <div className="drop-overlay">여기에 놓아 추가</div>}
    </aside>
  )
}
