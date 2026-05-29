# Subtitle Edit Web

웹 기반 자막 편집기 - Subtitle Edit 4.0.13 포팅

## 🎬 주요 기능

- **8개 자막 형식 지원**: SubRip (.srt), WebVTT (.vtt), ASS (.ass), SSA (.ssa), SAMI (.smi), MicroDVD (.sub), TTML (.xml), JSON
- **실시간 파형 표시**: 68분 전체 오디오 파형 (3.4MB, 100Hz)
- **색상 코딩**: 재생 중인 자막 구간 빨간색 표시
- **비디오 동기화**: 프레임 단위 제어
- **한국어 맞춤법 검사**: Hunspell 기반
- **자막 타임라인**: 드래그 앤 드롭으로 시간 조정

## 🚀 시작하기

### 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

http://localhost:5173 에서 확인

### 빌드

```bash
npm run build
```

### 테스트

```bash
npm test
```

## 📁 프로젝트 구조

```
subtitle-edit-web/
├── src/
│   ├── core/           # 핵심 클래스 (TimeCode, Paragraph, Subtitle)
│   ├── formats/        # 자막 형식 파서 (8개)
│   ├── ui/             # UI 컴포넌트 (VideoPlayer, WaveformViewer)
│   └── utils/          # 유틸리티 (인코딩, 맞춤법 검사)
├── public/
│   ├── dictionaries/   # 한국어 맞춤법 사전
│   └── samples/        # 샘플 파형 데이터
└── tests/              # 단위 테스트 (138개)
```

## 🎨 기술 스택

- **프레임워크**: Vite 8.0
- **테스트**: Vitest 4.1
- **오디오**: Web Audio API
- **파형**: Canvas 2D
- **맞춤법**: Hunspell (Typo.js)

## 📊 파형 기능

- **전체 길이**: 68분 (4109초)
- **파일 크기**: 3.4MB
- **샘플 레이트**: 100 Hz
- **샘플 수**: 205,460
- **로딩 시간**: 
  - 로컬: < 1초
  - 원격: 5-10초 (첫 로드), 이후 캐시
- **증폭**: 3배 (선명한 시각화)

## 📜 라이선스

### 프로젝트 라이선스

이 프로젝트는 오픈소스이며, 원본 Subtitle Edit과 동일한 라이선스를 따릅니다.

### 맞춤법 검사 라이브러리

**Typo.js** - JavaScript Hunspell 스펠체커

**출처**:
- 프로젝트: [Typo.js](https://github.com/cfinke/Typo.js)
- 저작자: Christopher Finke <cfinke@gmail.com>
- 버전: 1.3.2

**라이선스**: BSD-3-Clause (Modified BSD License)
- ✅ 상업적 사용 가능
- ✅ 수정 가능
- ✅ 배포 가능
- ⚠️ 저작권 고지 필요
- ⚠️ 라이선스 포함 필요

### 한국어 맞춤법 사전 라이선스

한국어 맞춤법 검사 기능은 **hunspell 한국어 데이터 프로젝트**의 사전을 사용합니다.

**출처**: 
- 프로젝트: [hunspell-dict-ko](https://github.com/spellcheck-ko/hunspell-dict-ko/)
- 확장: [korean-spellchecker](https://github.com/jihuichoi/korean-spellchecker)
- 저작자: Copyright (C) 2008-2019 spellcheck-ko contributors
- 배포자: Jihui Choi

**라이선스**:
1. **코드 및 레거시 사전**: MPL-1.1 / GPL-2.0 / LGPL-2.1 삼중 라이선스
2. **사전 데이터**: Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)

**라이선스 상세**:
- MPL 1.1: `public/dictionaries/LICENSE.MPL`
- GPL 2.0: `public/dictionaries/LICENSE.GPL`
- LGPL 2.1: `public/dictionaries/LICENSE.LGPL`
- CC BY-SA 4.0: `public/dictionaries/LICENSE.CC-BY-SA-4.0`
- 요약: `public/dictionaries/LICENSE`

**사용 조건**:
- ✅ 상업적 사용 가능
- ✅ 수정 가능
- ✅ 배포 가능
- ⚠️ 동일 조건 공유 필요 (CC BY-SA 4.0)
- ⚠️ 저작자 표시 필요
- ⚠️ 라이선스 명시 필요

**참고**:
- Hunspell 한국어 데이터 버전: 0.7.91 (2019-08-13)
- OpenOffice.org 3.1+ 호환

## 🧪 테스트

```bash
# 모든 테스트 실행
npm test

# UI로 테스트 확인
npm run test:ui

# E2E 테스트
npm run test:e2e
```

**테스트 커버리지**: 138개 테스트 통과 ✅

## 🔧 개발

### 파형 데이터 생성

```bash
node scripts/generate-waveform.js <video-file>
```

### 새로운 형식 추가

1. `src/core/formats/` 에 새 파서 클래스 생성
2. `SubtitleFormat` 클래스 상속
3. `parse()`, `toText()` 메서드 구현
4. `src/core/formats/index.js` 에 등록
5. 테스트 작성

## 📝 버전 히스토리

### v5.6 (2026-05-28)
- ✅ 68분 전체 비디오 파형 구현
- ✅ 실시간 색상 코딩 (녹색/빨간색)
- ✅ 3배 진폭 증폭
- ✅ 로딩 UI 추가
- ✅ localStorage 캐싱
- ✅ ngrok 최적화

### Phase 1 (2026-01 ~ 2026-05)
- ✅ 핵심 클래스 포팅 (TimeCode, Paragraph, Subtitle)
- ✅ 8개 주요 형식 파서
- ✅ 기본 UI 구현
- ✅ 비디오 플레이어 통합
- ✅ 파형 뷰어 구현
- ✅ 138개 테스트 작성

## 🤝 기여

이슈와 풀 리퀘스트를 환영합니다!

## 📧 문의

프로젝트 관련 문의: GitHub Issues

## 🙏 감사의 말

- **Subtitle Edit**: 원본 프로젝트 (https://github.com/SubtitleEdit/subtitleedit)
- **hunspell-dict-ko**: 한국어 맞춤법 사전 (https://github.com/spellcheck-ko/hunspell-dict-ko/)
- **korean-spellchecker**: OpenOffice 확장 (https://github.com/jihuichoi/korean-spellchecker)

---

**Made with ❤️ using Claude Code**
