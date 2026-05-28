# Phase 2: UI 재설계 - 원본과 100% 동일하게

## 🎯 목표
현재 간단한 데모 UI를 **원본 Subtitle Edit 4.0.13과 완전히 동일한** UI/UX로 재구현

## 📋 원본 UI 구조 (Main.Designer.cs 분석)

### 1. MenuStrip (메뉴바)
```
File (파일)
├── New (새로 만들기)
├── Open (열기)
├── Open - keep video (비디오 유지하고 열기)
├── Reopen (다시 열기)
├── Save (저장)
├── Save as (다른 이름으로 저장)
├── Restore auto-backup (자동 백업 복원)
├── Format properties (형식 속성)
├── Styles (스타일)
├── ─────────
├── Open original (원본 열기)
├── Save original (원본 저장)
├── Save original as (원본을 다른 이름으로 저장)
├── Remove original (원본 제거)
├── Remove translation (번역 제거)
├── ─────────
├── Open containing folder (폴더 열기)
├── Compare (비교)
├── Verify completeness (완성도 확인)
├── Statistics (통계)
├── Plugins (플러그인)
├── ─────────
├── Import (가져오기) ▶
│   ├── Import images (OCR)
│   ├── Import plain text
│   ├── Import time codes
│   ├── Import from video
│   ├── Import Blu-ray SUP
│   ├── Import SUB/IDX
│   ├── Import DVD subtitles
│   ├── Import hard-coded subs (OCR)
│   └── Import manual ANSI
├── Export (내보내기) ▶
│   ├── Adobe Encore
│   ├── Avid STL
│   ├── Ayato
│   ├── PNG/XML
│   ├── Blu-ray SUP
│   ├── (... 30+ export formats)
│   └── Custom text format
├── ─────────
└── Exit (끝내기)

Edit (편집)
├── Undo (실행 취소)
├── Redo (다시 실행)
├── Show history (실행 취소 내역 표시)
├── ─────────
├── Insert unicode character (유니코드 문자 삽입)
├── ─────────
├── Find (찾기)
├── Find next (다음 찾기)
├── Replace (바꾸기)
├── Multiple replace (다중 바꾸기)
├── Go to line number (줄 번호로 이동)
├── Show original in preview (미리 보기에 원본 표시)
├── ─────────
├── Right-to-left mode (오른쪽에서 왼쪽 모드)
├── RTL unicode control chars (RTL 유니코드 제어 문자)
├── Remove unicode control chars (유니코드 제어 문자 제거)
├── Reverse RTL start/end (RTL 시작/끝 반전)
├── ─────────
├── Modify selection (선택 항목 수정)
├── Inverse selection (선택 반전)
└── Select all (모두 선택)

Tools (도구)
├── Adjust display time (표시 시간 조정)
├── Apply duration limits (길이 제한 적용)
├── Bridge gaps (간격 메우기)
├── Set minimum display time (최소 표시 시간 설정)
├── Fix common errors (일반 오류 수정)
├── Start numbering from (번호 시작)
├── Remove text for hearing impaired (청각 장애인용 텍스트 제거)
├── Convert colors to dialog (색상을 대화로 변환)
├── Convert actors (배우 변환)
├── Change casing (대/소문자 변경)
├── Auto merge short lines (짧은 줄 자동 병합)
├── Merge duplicate text (중복 텍스트 병합)
├── Merge lines with same time codes (동일한 시간 코드 줄 병합)
├── Auto split long lines (긴 줄 자동 분할)
├── Sort by (정렬) ▶
│   ├── Number
│   ├── Start time
│   ├── End time
│   ├── Duration
│   ├── Text
│   ├── Single line max. length
│   ├── Text total length
│   ├── Chars/sec
│   ├── Words/min
│   ├── Actor
│   ├── Style
│   └── Network nick
├── ─────────
├── Show earlier/later (앞/뒤로 표시)
├── Make subtitle longer/shorter (자막 길게/짧게)
├── Adjust times (시간 조정)
├── Change frame rate (프레임 속도 변경)
├── Change speed (속도 변경)
├── Translate (번역)
├── NLLB translate (NLLB 번역)
├── Auto-translate (자동 번역) ▶
│   ├── Google Translate
│   ├── DeepL
│   ├── ChatGPT
│   └── (... 30+ services)
├── Copy-paste translate (복사-붙여넣기 번역)
├── ─────────
├── Netflix quality check (Netflix 품질 검사)
├── Beautify time codes (시간 코드 정리)
├── Batch convert (배치 변환)
├── Split (분할)
├── Join (결합)
├── Append (추가)
└── (... more tools)

Video (비디오)
├── Open video file (비디오 파일 열기)
├── Open video from URL (URL에서 비디오 열기)
├── Close video file (비디오 파일 닫기)
├── ─────────
├── Generate blank video (빈 비디오 생성)
├── Generate video with soft subs (소프트 자막 포함 비디오 생성)
├── Generate video with burned-in subs (하드 자막 포함 비디오 생성)
├── Generate transparent video (투명 비디오 생성)
├── ─────────
├── Show earlier/later (앞/뒤로 표시)
├── Undo (실행 취소)
├── Redo (다시 실행)
├── Import scene changes (장면 변경 가져오기)
├── Remove scene changes (장면 변경 제거)
└── Wave form selected audio only (선택한 오디오만 파형)

Synchronization (동기화)
├── Adjust all times (모든 시간 조정)
├── Visual sync (시각 동기화)
├── Point sync (포인트 동기화)
├── Point sync via another subtitle (다른 자막을 통한 포인트 동기화)
└── Change frame rate (프레임 속도 변경)

Auto-translate (자동 번역)
├── Translate (번역)
├── Translate selected lines (선택한 줄 번역)
├── Translate from selected line to end (선택한 줄부터 끝까지 번역)
└── Translation memory (번역 메모리)

Options (옵션)
├── Settings (설정)
├── Choose language (언어 선택)
├── Spelling dictionaries (맞춤법 사전)
└── Network settings (네트워크 설정)

Help (도움말)
├── Help (도움말)
├── Check for updates (업데이트 확인)
├── Check for updates (포함 beta) (업데이트 확인 - 베타 포함)
└── About (정보)
```

### 2. ToolStrip (툴바)
```
[New] [Open] [Open Video] [Save] [Save As] | [Find] [Replace] |
[Fix Errors] [Remove HI] [Visual Sync] [Burn In] [Spell Check] |
[ASS Style] [Properties] [Attachments] [AssaDraw] |
[Netflix QC] [Beautify] [Settings] | [Help] |
[Source View] [Layout] |
Format: [SubRip ▼] | Encoding: [UTF-8 ▼] | Frame rate: [25.000 ▼] [Get]
```

### 3. Main Area (메인 영역)
```
┌─────────────────────────────────────────────────────────┐
│ Subtitle List (자막 목록)                                  │
│ ┌───┬────────┬────────┬─────┬────┬────┬────┬────────┐ │
│ │ # │ Start  │ End    │ Dur │CPL │WPM │CPS │ Text   │ │
│ ├───┼────────┼────────┼─────┼────┼────┼────┼────────┤ │
│ │ 1 │00:00:01│00:00:03│ 2.0 │ 10 │ 30 │5.0 │Hello   │ │
│ │ 2 │00:00:04│00:00:06│ 2.0 │ 12 │ 35 │6.0 │World   │ │
│ └───┴────────┴────────┴─────┴────┴────┴────┴────────┘ │
├─────────────────────────────────────────────────────────┤
│ Tabs: [List] [Source] [Create]                         │
├─────────────────────────────────────────────────────────┤
│ Text Editor (텍스트 편집기)                                │
│ Start: [00:00:01.000] Duration: [2.000]                │
│ End:   [00:00:03.000]                                   │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Hello, world!                                       │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│ Characters: 12 | Words: 2 | CPS: 6.0                   │
├─────────────────────────────────────────────────────────┤
│ Video / Waveform Area                                   │
│ [Video Player] [Waveform] [Spectrogram]                │
└─────────────────────────────────────────────────────────┘
```

### 4. StatusStrip (상태바)
```
[Status message] [Selected: 2] [Progress: ████░░░ 75%] [Network: ●]
```

## 🚀 구현 계획

### Phase 2.1: 레이아웃 구조 (5시간)
- [ ] MenuStrip 컴포넌트 생성
- [ ] ToolStrip 컴포넌트 생성  
- [ ] SplitContainer 레이아웃
- [ ] StatusStrip 컴포넌트 생성

### Phase 2.2: 메뉴 시스템 (10시간)
- [ ] File 메뉴 (18개 항목)
- [ ] Edit 메뉴 (15개 항목)
- [ ] Tools 메뉴 (30+ 항목)
- [ ] Video 메뉴 (15개 항목)
- [ ] Synchronization 메뉴 (6개 항목)
- [ ] Auto-translate 메뉴 (4개 항목)
- [ ] Options 메뉴 (4개 항목)
- [ ] Help 메뉴 (4개 항목)

### Phase 2.3: 툴바 (5시간)
- [ ] 20+ 버튼 아이콘
- [ ] 형식 선택기
- [ ] 인코딩 선택기
- [ ] 프레임 속도 선택기

### Phase 2.4: 자막 리스트 뷰 (10시간)
- [ ] DataGrid 스타일
- [ ] 모든 열 (#, Start, End, Duration, CPL, WPM, CPS, Actor, Text)
- [ ] 정렬 기능
- [ ] 색상 코딩 (오류 = 빨강, 경고 = 노랑)
- [ ] 다중 선택
- [ ] 컨텍스트 메뉴

### Phase 2.5: 텍스트 편집기 (5시간)
- [ ] TimeCode 입력 필드
- [ ] Duration 계산
- [ ] 텍스트 영역
- [ ] 통계 표시 (Characters, Words, CPS)

## 📝 참고 파일
- `/Users/minsub/Desktop/Test/subtitleedit-4.0.13/src/ui/Forms/Main.Designer.cs`
- `/Users/minsub/Desktop/Test/subtitleedit-4.0.13/src/ui/Languages/ko-KR.xml`

## ✅ 완료 기준
- [ ] 원본과 레이아웃 100% 동일
- [ ] 모든 메뉴 항목 표시 (기능은 Phase 3에서 구현)
- [ ] 한국어 번역 적용
- [ ] 반응형 레이아웃
- [ ] 키보드 단축키 지원

---

**시작**: Session 3
**예상 소요**: 35시간
