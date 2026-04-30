# MediaLab

가볍지만 강력한 음악·영상 재생 프로그램 (Windows / macOS).

## 주요 기능

- 음악·영상 통합 재생 (mp3, flac, m4a, wav, ogg, opus, mp4, mkv, webm 등)
- F8 으로 재생목록 패널 토글 (창이 옆으로 늘어남)
- 파일 추가 / 폴더 추가 (음악/영상 체크박스 + 하위폴더 옵션)
- 자막 자동 로드 (.srt / .smi / .vtt — 같은 이름 파일 자동 검색)
- 마지막 재생 위치 기억 (이어보기)
- A-B 구간 반복
- 재생 속도 조절 (0.25x ~ 4x)
- 셔플 / 반복 (off / one / all)
- 드래그&드롭으로 파일 추가
- 재생목록 저장 / 불러오기

## 단축키

| 키 | 동작 |
|---|---|
| `Space` | 재생 / 일시정지 |
| `← / →` | 5초 이동 |
| `Ctrl + ← / →` | 30초 이동 |
| `Alt + ← / →` | 5분 이동 |
| `↑ / ↓` | 볼륨 ±5% |
| `M` | 음소거 |
| `F` | 전체화면 |
| `F8` | 재생목록 패널 토글 |
| `, / .` | 이전 / 다음 프레임 |
| `[ / ]` | 재생속도 −/+ |
| `A` | A-B 구간 시작점 / 끝점 / 해제 |
| `S` | 자막 표시 토글 |
| `N / P` | 다음 / 이전 트랙 |

## 개발 실행

요구사항: Node.js 20+ (LTS 권장)

```bash
npm install
npm run dev
```

## 빌드

로고는 `assets/Logo.png` 에 PNG (권장 1024×1024 이상) 로 배치하세요.
빌드 시 자동으로 Windows .ico / macOS .icns 로 변환됩니다.

```bash
# Windows .exe (NSIS 인스톨러)
npm run pack:win

# macOS .dmg (Universal binary, Intel + Apple Silicon)
npm run pack:mac

# 둘 다
npm run pack:all
```

산출물: `release/` 폴더

## 폴더 구조

```
medialab/
├── assets/
│   └── Logo.png            # 사용자 로고 (PNG, 빌드 시 아이콘으로 자동 변환)
├── build/                  # electron-builder 빌드 리소스 (자동 생성)
├── scripts/
│   └── prepare-icon.mjs    # Logo.png → build/icon.png 복사
├── src/
│   ├── main/               # Electron main process
│   │   ├── index.ts
│   │   ├── store.ts        # 설정/이어보기 저장 (electron-store)
│   │   ├── files.ts        # 파일·폴더 다이얼로그, 자막 자동검색
│   │   ├── playlist.ts     # 재생목록 저장/불러오기
│   │   └── formats.ts      # 지원 포맷 정의
│   ├── preload/
│   │   ├── index.ts        # contextBridge API
│   │   └── index.d.ts
│   └── renderer/           # React UI
│       ├── index.html
│       └── src/
│           ├── App.tsx
│           ├── main.tsx
│           ├── styles.css
│           ├── types.ts
│           ├── components/
│           │   ├── Player.tsx
│           │   ├── Controls.tsx
│           │   ├── Playlist.tsx
│           │   └── AddFolderDialog.tsx
│           ├── hooks/
│           │   └── useShortcuts.ts
│           └── lib/
│               ├── format.ts
│               └── subtitle.ts   # SRT/SAMI → WebVTT 변환
├── electron.vite.config.ts
├── electron-builder.yml
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── tsconfig.web.json
```

## 코덱 지원 안내

V1은 Chromium 내장 미디어 엔진(HTML5 video)을 사용합니다.

- ✅ 안정 재생: `mp3`, `flac`, `m4a`, `wav`, `ogg`, `opus`, `aac`, `mp4`, `webm`, `mkv` (h264/h265)
- ⚠️ 제한적: `wma`, `wmv`, `avi`, 일부 오래된 코덱 — 코덱 컨테이너 따라 안 될 수 있음

향후 mpv 백엔드를 추가해 모든 포맷 지원 확장이 가능합니다.

## 사용자 데이터 위치

- Windows: `%APPDATA%/medialab/`
- macOS: `~/Library/Application Support/medialab/`

저장 항목: 볼륨/반복/셔플 설정, 마지막 재생 위치(이어보기), 저장된 재생목록.
