// 배너 광고 슬롯 — 공감스튜디오 서버에서 받은 배너를 표시
// 광고 없거나 네트워크 실패 시 "광고주를 모십니다" placeholder
// 클릭 시 사용자 기본 브라우저로 외부 URL 열기 (window.medialab.openExternalUrl)

import { useBanner } from '../hooks/useBanner'
import { API_ENDPOINTS, APP_CODE } from '../config/api'

interface Props {
  slotId: string // 'panel-bottom' 등
  width: number
  height: number
  label?: string
}

export default function BannerSlot({ slotId, width, height, label }: Props): React.JSX.Element {
  const banner = useBanner(slotId)

  const handleClick = (e: React.MouseEvent): void => {
    e.preventDefault()
    if (!banner?.linkUrl) return
    const trackUrl = API_ENDPOINTS.bannerClick(banner.trackingId, APP_CODE)
    window.medialab?.openExternalUrl?.(trackUrl)
  }

  if (banner) {
    return (
      <a
        href={banner.linkUrl ?? '#'}
        onClick={handleClick}
        data-slot={slotId}
        className="banner-slot has-banner"
        style={{ width, height }}
        title={banner.altText || label || slotId}
      >
        <img
          src={banner.imageUrl}
          alt={banner.altText || ''}
          draggable={false}
          style={{ width, height, objectFit: 'cover' }}
        />
      </a>
    )
  }

  return (
    <div className="banner-slot" data-slot={slotId} style={{ width, height }}>
      <div className="banner-placeholder">광고주를 모십니다</div>
      <div className="banner-placeholder-sub">
        {label ?? slotId} · {width}×{height}
      </div>
    </div>
  )
}
