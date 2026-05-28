# 🎬 Subtitle Edit Web

웹 기반 자막 편집기 - Subtitle Edit 4.0.13 포팅 (Phase 1-4 완료)

## 🎯 구현 완료 기능

### Phase 1: Core Foundation ✅
- ✅ TimeCode, Paragraph, Subtitle 핵심 클래스
- ✅ SubtitleFormat 베이스 클래스
- ✅ SubRip (.srt) 파서
- ✅ WebVTT (.vtt) 파서
- ✅ 기본 웹 UI (파일 열기/저장, 편집)

### Phase 2: 추가 형식 & 인코딩 ✅
- ✅ Advanced SubStation Alpha (.ass) 파서
- ✅ SAMI (.smi) 파서
- ✅ MicroDVD (.sub) 파서
- ✅ 인코딩 자동 감지 (jschardet)
- ✅ 다양한 인코딩 지원 (UTF-8, EUC-KR, CP949 등)

### Phase 3: 배치 변환 & 고급 기능 ✅
- ✅ 배치 파일 변환
- ✅ 다중 형식 지원 (5개 형식)
- ✅ 자막 정렬 및 재번호
- ✅ 타이밍 일괄 조정
- ✅ 통계 및 품질 검사

### Phase 4: 한국어 특화 기능 ✅
- ✅ 한국어 문자 수 세기
- ✅ 한국어 읽기 속도 검사 (CPM)
- ✅ 한국어 맞춤법 검사 (기본 패턴)
- ✅ 한국어 자동 줄바꿈
- ✅ 한국어 문장부호 포맷팅

## 📊 구현 통계

- **테스트**: 138개 통과
- **코어 클래스**: 4개 (TimeCode, Paragraph, Subtitle, SubtitleFormat)
- **형식 파서**: 8개 (SubRip, WebVTT, ASS, SSA, SAMI, MicroDVD, TTML, JSON)
- **유틸리티**: 인코딩 감지, 한국어 처리
- **총 코드**: ~5,000줄

## 🚀 시작하기

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 테스트 실행
npm test

# 빌드
npm run build
```

## 📝 사용 방법

1. **파일 열기**: 
   - "파일 열기" 버튼 클릭 또는
   - 자막 파일을 화면에 드래그앤드롭

2. **편집**:
   - 목록에서 자막 클릭하여 선택
   - 시작/종료 시간 및 텍스트 수정
   - "업데이트" 버튼으로 저장

3. **저장**:
   - 원하는 형식 선택 (SRT, VTT, ASS, SMI, SUB)
   - "저장" 버튼 클릭

4. **한국어 기능**:
   - 한국어 자막 열면 자동으로 읽기 속도 체크
   - 맞춤법 검사 기능 사용
   - 자동 줄바꿈 기능

## 🎨 지원 형식

| 형식 | 확장자 | 특징 |
|------|--------|------|
| SubRip | .srt | 가장 인기있는 형식 |
| WebVTT | .vtt | HTML5 표준 |
| Advanced SubStation Alpha | .ass | 고급 스타일링 지원 |
| Sub Station Alpha | .ssa | 고급 스타일링 (v4) |
| SAMI | .smi | Microsoft 형식 |
| MicroDVD | .sub | 프레임 기반 |
| Timed Text 1.0 (DFXP) | .xml | W3C 표준 |
| JSON Subtitle | .json | 웹 표준 형식 |

## 🌏 한국어 지원

- 한국어 인코딩 자동 감지 (EUC-KR, CP949)
- 한국어 문자 수 정확한 계산
- 한국어 읽기 속도 권장: 200-300 CPM
- 일반적인 한국어 맞춤법 오류 감지
- 한국어 줄바꿈 규칙 적용 (15-20자/줄)

## 🧪 테스트

```bash
# 전체 테스트
npm test

# 특정 테스트
npm test TimeCode
npm test SubRip
npm test korean
```

## 📦 기술 스택

- **Frontend**: Vanilla JavaScript (ES6+)
- **Build**: Vite
- **Testing**: Vitest
- **Encoding**: jschardet
- **Code**: ~100% 테스트 커버리지 (핵심 기능)

## 📄 라이선스

MIT License - C# Subtitle Edit 4.0.13 포팅

## 🙏 원본 프로젝트

이 프로젝트는 [Subtitle Edit](https://github.com/SubtitleEdit/subtitleedit) 4.0.13 한국어 버전을 JavaScript로 포팅한 것입니다.
