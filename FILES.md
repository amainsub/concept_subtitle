# 프로젝트 파일 구조

## 📁 실제 사용 파일 목록

### 🔧 설정 파일
```
├── package.json              # 프로젝트 설정 및 의존성
├── package-lock.json         # 의존성 잠금 파일
├── vite.config.js           # Vite 빌드 설정
└── .gitignore               # Git 제외 파일
```

### 📄 메인 파일
```
├── index.html               # 메인 HTML (진입점)
├── src/
│   ├── main.js             # 메인 JavaScript (앱 진입점)
│   └── style.css           # 전역 스타일
```

### 🎬 핵심 클래스
```
src/core/common/
├── TimeCode.js              # 타임코드 (00:00:00,000)
├── Paragraph.js             # 단일 자막 (시작/끝 시간 + 텍스트)
└── Subtitle.js              # 자막 컬렉션 (전체 자막 관리)
```

### 📝 자막 형식 파서 (8개)
```
src/core/formats/
├── SubtitleFormat.js        # 베이스 클래스
├── index.js                 # 형식 레지스트리
├── SubRip.js                # .srt (가장 흔함)
├── WebVTT.js                # .vtt (웹 표준)
├── AdvancedSubStationAlpha.js  # .ass (고급 스타일링)
├── SubStationAlpha.js       # .ssa (레거시)
├── SAMI.js                  # .smi (한국에서 사용)
├── MicroDVD.js              # .sub (프레임 기반)
├── TimedText10.js           # .xml (TTML 1.0)
└── JsonSubtitle.js          # .json (커스텀)
```

### 🎨 UI 컴포넌트
```
src/ui/components/
├── VideoPlayer.js           # 비디오 재생 + 자막 오버레이
└── WaveformViewer.js        # 오디오 파형 + 타임라인
```

### 🛠️ 유틸리티
```
src/utils/
├── encoding.js              # 파일 인코딩 감지 (jschardet)
├── korean.js                # 한국어 처리 (자소 분해/결합)
├── spellcheck.js            # 맞춤법 검사 (Typo.js + Hunspell)
├── user-dictionary.js       # 사용자 사전
└── uuid.js                  # UUID 생성
```

### 🧪 테스트 (138개)
```
tests/
├── core/
│   ├── TimeCode.test.js     # 12 tests
│   ├── Paragraph.test.js    # 11 tests
│   ├── Subtitle.test.js     # 23 tests
│   └── SubRip.test.js       # 15 tests
└── formats/
    ├── SubStationAlpha.test.js   # 9 tests
    ├── TimedText10.test.js       # 9 tests
    └── JsonSubtitle.test.js      # 10 tests
```

### 📦 Public 리소스
```
public/
├── favicon.svg              # 파비콘
├── icons.svg                # 아이콘 스프라이트
├── dictionaries/            # 한국어 맞춤법 사전 (Hunspell)
│   ├── ko-KR.dic           # 단어 사전 (2.9MB)
│   ├── ko-KR.aff           # 접사 규칙 (11MB)
│   └── LICENSE*            # 사전 라이선스 (5개)
└── samples/
    ├── default.mp4         # 샘플 비디오 (심볼릭 링크)
    ├── default.srt         # 샘플 자막 (심볼릭 링크)
    └── sample-waveform-full.json  # 파형 데이터 (3.4MB)
```

### 📚 문서
```
├── README.md                # 프로젝트 설명 + 라이선스
├── LICENSE                  # GPL-3.0 라이선스
├── FEATURES.md              # 기능 목록
└── PROJECT_ROADMAP.md       # 개발 로드맵
```

### 🔨 스크립트
```
scripts/
└── generate-waveform.js     # 비디오 → 파형 데이터 변환
```

---

## 📊 파일 통계

### 코드 파일
- **JavaScript**: 27개 (핵심 로직)
- **CSS**: 1개 (스타일)
- **HTML**: 1개 (진입점)
- **테스트**: 7개 (138개 테스트)

### 총 파일 수
- **소스 코드**: ~35개
- **문서**: 4개
- **설정**: 3개
- **사전/데이터**: ~20개 (dictionaries + samples)

### 프로젝트 크기
- **소스 코드**: ~200 KB
- **파형 데이터**: 3.4 MB
- **사전 파일**: ~14 MB
- **node_modules**: ~140 MB (개발 시에만)

---

## 🎯 핵심 사용 흐름

```
index.html
    └── src/main.js (메인 앱)
          ├── src/core/common/* (TimeCode, Paragraph, Subtitle)
          ├── src/core/formats/* (형식 파서 8개)
          ├── src/ui/components/VideoPlayer.js (비디오)
          ├── src/ui/components/WaveformViewer.js (파형)
          └── src/utils/* (인코딩, 맞춤법, 한국어)
```

---

## 🚀 실행 시 로드되는 파일

### 1. HTML
- `index.html`

### 2. JavaScript (자동 번들링)
- `src/main.js` + 모든 import된 모듈

### 3. CSS
- `src/style.css`

### 4. 리소스 (온디맨드)
- `public/samples/default.mp4` (비디오)
- `public/samples/default.srt` (자막)
- `public/samples/sample-waveform-full.json` (파형, 3.4MB)
- `public/dictionaries/ko-KR.*` (맞춤법 사용 시)

---

## 📦 배포 시 필요한 파일

### 빌드 후 (`npm run build`)
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js      # 번들된 JavaScript
│   └── index-[hash].css     # 번들된 CSS
└── [public 폴더 내용 복사]
```

### 최소 배포 파일
- `dist/` 폴더 전체
- `public/dictionaries/` (맞춤법 필요 시)
- `public/samples/sample-waveform-full.json` (파형 표시 필요 시)

---

## ⚠️ 제외된 파일 (.gitignore)

```
node_modules/       # npm 패키지 (140MB)
dist/               # 빌드 결과물
.DS_Store           # macOS 메타데이터
*.log               # 로그 파일
.env                # 환경 변수 (로컬)
```

---

**전체 파일 수**: ~60개 (node_modules 제외)  
**실제 사용 코드**: ~35개 JavaScript/CSS/HTML 파일
