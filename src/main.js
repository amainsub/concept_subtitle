/**
 * Subtitle Edit Web - 원본과 동일한 UI/UX
 * Version: 5.6 (Cleaned context menu)
 */
console.log('🚀 Subtitle Edit Web v5.6 - Cleaned Menu 🧹');
import './style.css';
import { Subtitle } from './core/common/Subtitle.js';
import { Paragraph } from './core/common/Paragraph.js';
import { TimeCode } from './core/common/TimeCode.js';
import { formatRegistry } from './core/formats/index.js';
import { VideoPlayer } from './ui/components/VideoPlayer.js';
import { WaveformViewer } from './ui/components/WaveformViewer.js';
import { readFileWithEncoding } from './utils/encoding.js';
import { spellChecker } from './utils/spellcheck.js';
import { userDictionary } from './utils/user-dictionary.js';

class SubtitleEdit {
  constructor() {
    this.subtitle = new Subtitle();
    this.currentFormat = null;
    this.fileName = 'untitled.srt';
    this.selectedIndex = -1;
    this.videoPlayer = null;
    this.waveformViewer = null;
    this.history = [];
    this.historyIndex = -1;
    this.lastSearchTerm = '';
    this.lastSearchIndex = -1;
    this.selectedIndices = new Set();

    this.initUI();
    this.attachEventListeners();
    this.initResizers();
    this.loadDefaultFiles();
  }

  initUI() {
    document.querySelector('#app').innerHTML = `
      <!-- MenuStrip -->
      <div class="menu-strip">
        <div class="menu-item">
          <span>파일(F)</span>
          <div class="menu-dropdown">
            <div class="menu-option" data-action="reset">처음으로</div>
            <div class="menu-option" data-action="open">업로드 불러오기...</div>
            <div class="menu-option" data-action="saveAs">다른 이름으로 저장</div>
          </div>
        </div>
        <div class="menu-item">
          <span>편집(E)</span>
          <div class="menu-dropdown">
            <div class="menu-option" data-action="undo">실행 취소</div>
            <div class="menu-option" data-action="redo">다시 실행</div>
            <div class="menu-separator"></div>
            <div class="menu-option" data-action="find">찾기</div>
            <div class="menu-option" data-action="findNext">다음 찾기</div>
            <div class="menu-option" data-action="replace">바꾸기</div>
            <div class="menu-option" data-action="multiReplace">다중 바꾸기</div>
            <div class="menu-option" data-action="goToLine">자막 번호로 이동</div>
            <div class="menu-option" data-action="replaceSelected">선택해서 바꾸기</div>
            <div class="menu-separator"></div>
            <div class="menu-option" data-action="invertSelection">선택 반전</div>
            <div class="menu-option" data-action="selectAll">모두 선택</div>
          </div>
        </div>
      </div>

      <!-- ToolStrip -->
      <div class="tool-strip">
        <button class="tool-btn" title="처음으로 돌아가기" data-action="reset">🔄</button>
        <button class="tool-btn" title="자막 열기" data-action="open">📁</button>
        <button class="tool-btn" title="오프라인 저장" data-action="saveAs">💾</button>
        <div class="tool-separator"></div>
        <button class="tool-btn" title="찾기" data-action="find">🔍</button>
        <button class="tool-btn" title="바꾸기" data-action="replace">🔁</button>
        <button class="tool-btn" title="맞춤법 검사" data-action="spellCheck">📝</button>
        <button class="tool-btn" title="KT 포맷 (. ! 제거)" data-action="ktFormat">
          <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle' font-size='18' font-weight='bold' fill='%23E31937'%3EKT%3C/text%3E%3C/svg%3E" style="width: 20px; height: 20px;" />
        </button>
        <button class="tool-btn" title="실행 취소 (Ctrl+Z)" data-action="undo">↶</button>
        <div class="tool-separator"></div>
        <label class="tool-label" for="contentName">컨텐츠명:</label>
        <input type="text" id="contentName" class="tool-combo" value="찬란한 너의 계절에" style="width: 200px;" />
      </div>

      <!-- Main Container -->
      <div class="main-container">
        <!-- Top Row: Subtitle List+Editor + Video Player -->
        <div class="top-row">
          <!-- 2사분면: Subtitle List + Text Editor -->
          <div class="left-panel">
            <!-- Subtitle List (위쪽) -->
            <div class="subtitle-list-panel">
              <table class="subtitle-grid">
                <thead>
                  <tr>
                    <th style="width: 50px">#</th>
                    <th style="width: 100px">시작</th>
                    <th style="width: 100px">종료</th>
                    <th style="width: 70px">길이</th>
                    <th>텍스트</th>
                  </tr>
                </thead>
                <tbody id="subtitleTableBody">
                  <!-- Rows will be inserted here -->
                </tbody>
              </table>
            </div>

            <!-- Text Editor (아래쪽) -->
            <div class="text-editor-panel">
              <div class="editor-top-row">
                <div class="editor-input-group">
                  <label for="startTime">시작</label>
                  <input type="text" id="startTime" placeholder="00:00:00.000" />
                </div>
                <div class="editor-input-group">
                  <label for="duration">길이</label>
                  <input type="text" id="duration" placeholder="2.000" />
                </div>
                <div class="editor-input-group editor-text-group">
                  <label for="textArea">텍스트</label>
                  <textarea id="textArea" placeholder="자막 텍스트..." rows="2" style="resize: vertical;"></textarea>
                </div>
                <div style="display: flex; flex-direction: column; gap: 5px; margin-top: 15px;">
                  <button class="btn-nav" data-action="unbreakLines" style="height: 25px; font-size: 11px; padding: 2px 8px;">줄바꿈 제거</button>
                  <button class="btn-nav" data-action="autoBreakLines" style="height: 25px; font-size: 11px; padding: 2px 8px;">줄바꿈 적용</button>
                </div>
              </div>
              <div class="editor-stats-row">
                <span id="lineCharsCount" style="color: #666; font-size: 11px;">한 줄: 0자</span>
                <span style="color: #ccc; margin: 0 5px;">|</span>
                <span id="totalCharsCount" style="color: #666; font-size: 11px;">총: 0자</span>
                <span style="color: #ccc; margin: 0 5px;">|</span>
                <span id="charsPerSecond" style="color: #666; font-size: 11px;">초당: 0.0자</span>
              </div>
              <div class="editor-nav-row">
                <button class="btn-nav" data-action="prevSubtitle">◀ 이전</button>
                <button class="btn-nav" data-action="nextSubtitle">다음 ▶</button>
              </div>
            </div>
          </div>

        <!-- 1사분면: Video Player -->
        <div class="video-panel" id="videoPanel">
          <div id="videoPlayerContainer" class="video-placeholder">
            <div class="placeholder-content">
              <p>🎬 비디오 없음</p>
              <p><small>비디오 메뉴 → 비디오 파일 열기 또는 툴바의 🎬 버튼 클릭</small></p>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Row: Waveform only (3, 4사분면 통합) -->
      <div class="bottom-row">
        <div class="waveform-panel" id="waveformPanel">
          <!-- Waveform Canvas -->
          <div class="waveform-canvas-container" style="flex: 1;">
            <div id="waveformContainer"></div>

            <!-- Bottom Zoom and Play Controls -->
            <div class="waveform-controls-bottom">
              <div class="zoom-controls">
                <button class="control-btn" data-action="zoomOut">−</button>
                <span id="zoomLevel">10000%</span>
                <button class="control-btn" data-action="zoomIn">+</button>
              </div>
              <div class="play-controls">
                <button class="control-btn" data-action="waveformPlay" id="waveformPlayBtn">▶️ 재생</button>
                <button class="control-btn" data-action="waveformStop">⏹️ 정지</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      <!-- StatusStrip -->
      <div class="status-strip">
        <span id="statusText">준비</span>
        <span id="selectedInfo"></span>
        <span id="progressInfo"></span>
      </div>

      <!-- Debug Info -->
      <div id="debugInfo" style="position: fixed; bottom: 30px; right: 10px; background: rgba(0,0,0,0.8); color: #0f0; padding: 10px; font-family: monospace; font-size: 11px; max-width: 400px; max-height: 200px; overflow-y: auto; z-index: 9999; display: none;"></div>

      <!-- Hidden Inputs -->
      <input type="file" id="fileInput" accept=".srt,.vtt,.ass,.ssa,.smi,.sub,.xml,.json" style="display:none" />
      <input type="file" id="videoInput" accept="video/*,audio/*" style="display:none" />
    `;
  }

  attachEventListeners() {
    // File operations
    document.querySelectorAll('[data-action="reset"]').forEach(el => {
      el.addEventListener('click', () => this.resetToDefault());
    });

    document.querySelectorAll('[data-action="open"]').forEach(el => {
      el.addEventListener('click', () => document.getElementById('fileInput').click());
    });

    document.querySelectorAll('[data-action="saveAs"]').forEach(el => {
      el.addEventListener('click', () => this.saveFileAs());
    });

    document.querySelectorAll('[data-action="find"]').forEach(el => {
      el.addEventListener('click', () => this.showFindDialog());
    });

    document.querySelectorAll('[data-action="replace"]').forEach(el => {
      el.addEventListener('click', () => this.showReplaceDialog());
    });

    document.querySelectorAll('[data-action="spellCheck"]').forEach(el => {
      el.addEventListener('click', () => this.showSpellCheckDialog());
    });

    document.querySelectorAll('[data-action="ktFormat"]').forEach(el => {
      el.addEventListener('click', () => this.applyKtFormat());
    });

    // Edit menu actions
    document.querySelectorAll('[data-action="undo"]').forEach(el => {
      el.addEventListener('click', () => this.undo());
    });

    document.querySelectorAll('[data-action="redo"]').forEach(el => {
      el.addEventListener('click', () => this.redo());
    });

    document.querySelectorAll('[data-action="findNext"]').forEach(el => {
      el.addEventListener('click', () => this.findNext());
    });

    document.querySelectorAll('[data-action="multiReplace"]').forEach(el => {
      el.addEventListener('click', () => this.showMultiReplaceDialog());
    });

    document.querySelectorAll('[data-action="goToLine"]').forEach(el => {
      el.addEventListener('click', () => this.goToLine());
    });

    document.querySelectorAll('[data-action="replaceSelected"]').forEach(el => {
      el.addEventListener('click', () => this.replaceSelected());
    });

    document.querySelectorAll('[data-action="invertSelection"]').forEach(el => {
      el.addEventListener('click', () => this.invertSelection());
    });

    document.querySelectorAll('[data-action="selectAll"]').forEach(el => {
      el.addEventListener('click', () => this.selectAll());
    });

    document.getElementById('fileInput').addEventListener('change', (e) => this.openFile(e));
    document.getElementById('videoInput').addEventListener('change', (e) => this.openVideo(e));

    // Editor actions
    document.querySelector('[data-action="insert"]')?.addEventListener('click', () => this.insertSubtitle());
    document.querySelector('[data-action="update"]')?.addEventListener('click', () => this.updateSubtitle());
    document.querySelector('[data-action="delete"]')?.addEventListener('click', () => this.deleteSubtitle());

    // Subtitle list selection
    document.getElementById('subtitleTableBody').addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      if (row) {
        const index = parseInt(row.dataset.index);
        this.selectSubtitle(index);
      }
    });

    // Context menu for subtitle table
    document.getElementById('subtitleTableBody').addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const row = e.target.closest('tr');
      if (row) {
        const index = parseInt(row.dataset.index);
        this.selectSubtitle(index);
        this.showContextMenu(e.clientX, e.clientY, index);
      }
    });

    // Close context menu on click outside
    document.addEventListener('click', () => {
      const menu = document.querySelector('.context-menu');
      if (menu) menu.remove();
    });

    // Text editor updates - remove auto-update for manual control
    const textArea = document.getElementById('textArea');
    textArea.addEventListener('input', () => {
      this.updateStats();
    });

    // Enter to apply, Shift+Enter for new line
    textArea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.applyEdit();
        // Blur (unfocus) the textarea after applying
        textArea.blur();
      }
      // Shift+Enter will insert newline (default behavior)
    });

    document.getElementById('duration').addEventListener('input', () => {
      this.updateStats();
    });

    // Line break buttons
    document.querySelector('[data-action="unbreakLines"]')?.addEventListener('click', () => this.unbreakLines());
    document.querySelector('[data-action="autoBreakLines"]')?.addEventListener('click', () => this.autoBreakLines());

    // Navigation buttons
    document.querySelector('[data-action="prevSubtitle"]')?.addEventListener('click', () => this.prevSubtitle());
    document.querySelector('[data-action="nextSubtitle"]')?.addEventListener('click', () => this.nextSubtitle());

    // Waveform controls
    document.querySelector('[data-action="insertAtPlayPosition"]')?.addEventListener('click', () => this.insertAtPlayPosition());
    document.querySelector('[data-action="playFromTextStart"]')?.addEventListener('click', () => this.playFromTextStart());
    document.querySelector('[data-action="goToSubtitle"]')?.addEventListener('click', () => this.goToSubtitle());
    document.querySelector('[data-action="setStartTime"]')?.addEventListener('click', () => this.setStartTime());
    document.querySelector('[data-action="setEndTime"]')?.addEventListener('click', () => this.setEndTime());
    document.querySelector('[data-action="decreaseTime"]')?.addEventListener('click', () => this.adjustTime(-1));
    document.querySelector('[data-action="increaseTime"]')?.addEventListener('click', () => this.adjustTime(1));
    document.querySelector('[data-action="zoomIn"]')?.addEventListener('click', () => this.adjustZoom(1));
    document.querySelector('[data-action="zoomOut"]')?.addEventListener('click', () => this.adjustZoom(-1));
    document.querySelector('[data-action="waveformPlay"]')?.addEventListener('click', () => this.togglePlayback());
    document.querySelector('[data-action="waveformStop"]')?.addEventListener('click', () => this.stopPlayback());

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl+Z: Undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.undo();
      }
      // Ctrl+Shift+Z or Ctrl+Y: Redo
      else if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
        e.preventDefault();
        this.redo();
      }
    });
  }

  newFile() {
    if (confirm('새 파일을 만들시겠습니까? 저장하지 않은 변경 사항은 손실됩니다.')) {
      this.subtitle = new Subtitle();
      this.fileName = 'untitled.srt';
      this.selectedIndex = -1;
      this.renderSubtitles();
      this.updateStatusBar('새 파일이 생성되었습니다');
    }
  }

  async openFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const { text, encoding } = await readFileWithEncoding(file);
      const lines = text.split(/\r?\n/);

      const format = formatRegistry.detectFormat(lines, file.name);
      if (!format) {
        alert('자막 형식을 인식할 수 없습니다.');
        return;
      }

      this.subtitle = new Subtitle();
      format.loadSubtitle(this.subtitle, lines, file.name);
      this.currentFormat = format;
      this.fileName = file.name;

      this.renderSubtitles();
      this.updateStatusBar(`${this.subtitle.paragraphs.length}개 자막을 불러왔습니다 (인코딩: ${encoding})`);
    } catch (error) {
      console.error('File load error:', error);
      alert('파일을 열 수 없습니다: ' + error.message);
    }
  }

  saveFile() {
    if (!this.currentFormat) {
      this.saveFileAs();
      return;
    }

    try {
      const text = this.currentFormat.toText(this.subtitle);
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.fileName;
      a.click();
      URL.revokeObjectURL(url);
      this.updateStatusBar('파일이 저장되었습니다');
    } catch (error) {
      alert('저장 중 오류: ' + error.message);
    }
  }

  saveFileAs() {
    if (!this.currentFormat) {
      this.currentFormat = formatRegistry.getFormatByName('SubRip');
    }

    // Use content name for default filename
    const contentName = document.getElementById('contentName').value || '자막';
    const defaultFileName = `${contentName}${this.currentFormat.extension}`;

    try {
      const text = this.currentFormat.toText(this.subtitle);
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultFileName;
      a.click();
      URL.revokeObjectURL(url);
      this.updateStatusBar(`파일이 "${defaultFileName}"로 저장되었습니다`);
    } catch (error) {
      alert('저장 중 오류: ' + error.message);
    }
  }

  async openVideo(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Initialize video player
    if (!this.videoPlayer) {
      const container = document.getElementById('videoPlayerContainer');
      // Clear placeholder
      container.innerHTML = '';
      container.classList.remove('video-placeholder');

      this.videoPlayer = new VideoPlayer(container);

      this.videoPlayer.onTimeUpdate = (time) => {
        if (this.waveformViewer) {
          this.waveformViewer.setCurrentTime(time);
        }
      };
    }

    this.videoPlayer.loadVideo(file);
    this.videoPlayer.setSubtitles(this.subtitle.paragraphs);

    // Initialize waveform
    if (!this.waveformViewer) {
      const container = document.getElementById('waveformContainer');
      this.waveformViewer = new WaveformViewer(container);

      this.waveformViewer.onSeek = (time) => {
        if (this.videoPlayer) {
          this.videoPlayer.seek(time);
        }
      };
    }

    await this.waveformViewer.loadAudio(file);
    this.waveformViewer.setSubtitles(this.subtitle.paragraphs);

    this.updateStatusBar('비디오 파일이 로드되었습니다');
  }

  async selectSubtitle(index) {
    this.selectedIndex = index;
    const para = this.subtitle.paragraphs[index];
    if (!para) {
      this.showDebug('자막을 찾을 수 없습니다: ' + index);
      return;
    }

    const seekTime = para.startTime.totalSeconds;

    this.showDebug(`자막 #${index + 1} 클릭됨<br>시간: ${seekTime.toFixed(2)}초<br>비디오: ${!!this.videoPlayer}<br>파형: ${!!this.waveformViewer}`);

    const startTimeInput = document.getElementById('startTime');
    const durationInput = document.getElementById('duration');
    const textAreaInput = document.getElementById('textArea');

    if (!startTimeInput || !durationInput || !textAreaInput) {
      console.error('Input fields not found!');
      return;
    }

    startTimeInput.value = para.startTime.toString();
    durationInput.value = para.duration.totalSeconds.toFixed(3);
    textAreaInput.value = para.text;

    this.updateStats();
    this.highlightRow(index);

    // Seek video to subtitle start time
    if (this.videoPlayer && this.videoPlayer.video) {
      const beforeTime = this.videoPlayer.video.currentTime;

      try {
        await this.videoPlayer.seek(seekTime);

        const afterTime = this.videoPlayer.video.currentTime;
        this.showDebug(`비디오 이동: ${beforeTime.toFixed(2)} → ${afterTime.toFixed(2)}초`);

        if (Math.abs(afterTime - seekTime) > 0.5) {
          this.showDebug(`❌ 비디오 seek 실패!<br>목표: ${seekTime.toFixed(2)}<br>실제: ${afterTime.toFixed(2)}`);
        }
      } catch (error) {
        this.showDebug('❌ Video seek error: ' + error.message);
      }
    } else {
      this.showDebug('❌ VideoPlayer 없음!');
    }

    // Seek waveform to subtitle start time and update selected subtitle
    if (this.waveformViewer) {
      const beforeTime = this.waveformViewer.currentTime;
      this.waveformViewer.setCurrentTime(seekTime);
      this.waveformViewer.selectedSubtitleIndex = index; // Sync selected index
      const afterTime = this.waveformViewer.currentTime;
      this.showDebug(`파형 이동: ${beforeTime.toFixed(2)} → ${afterTime.toFixed(2)}초`);
    } else {
      this.showDebug('❌ WaveformViewer 없음!');
    }
  }

  insertSubtitle() {
    const text = document.getElementById('textArea').value;
    const startTime = TimeCode.parse(document.getElementById('startTime').value);
    const endTime = TimeCode.parse(document.getElementById('endTime').value);

    if (!text || !startTime || !endTime) {
      alert('시작 시간, 종료 시간, 텍스트를 입력하세요');
      return;
    }

    this.saveHistory();

    const para = new Paragraph({ startTime, endTime, text });
    this.subtitle.addParagraph(para);
    this.subtitle.sort();
    this.renderSubtitles();

    // Update waveform subtitle blocks
    if (this.waveformViewer) {
      this.waveformViewer.setSubtitles(this.subtitle.paragraphs);
    }

    // Update video player subtitles
    if (this.videoPlayer) {
      this.videoPlayer.setSubtitles(this.subtitle.paragraphs);
    }

    this.updateStatusBar('자막이 추가되었습니다');
  }

  updateSubtitle() {
    if (this.selectedIndex < 0) {
      alert('편집할 자막을 선택하세요');
      return;
    }

    this.saveHistory();

    const para = this.subtitle.paragraphs[this.selectedIndex];
    para.text = document.getElementById('textArea').value;
    para.startTime = TimeCode.parse(document.getElementById('startTime').value);
    para.endTime = TimeCode.parse(document.getElementById('endTime').value);

    // Re-render subtitle list
    this.renderSubtitles();

    // Maintain selection highlight
    this.highlightRow(this.selectedIndex);

    // Update waveform subtitle blocks
    if (this.waveformViewer) {
      this.waveformViewer.setSubtitles(this.subtitle.paragraphs);
    }

    // Update video player subtitles
    if (this.videoPlayer) {
      this.videoPlayer.setSubtitles(this.subtitle.paragraphs);
    }

    this.updateStatusBar('자막이 업데이트되었습니다');
  }

  deleteSubtitle() {
    if (this.selectedIndex < 0) {
      alert('삭제할 자막을 선택하세요');
      return;
    }

    if (confirm('선택한 자막을 삭제하시겠습니까?')) {
      this.saveHistory();

      this.subtitle.paragraphs.splice(this.selectedIndex, 1);
      this.subtitle.renumber();
      this.selectedIndex = -1;
      this.renderSubtitles();

      // Update waveform subtitle blocks
      if (this.waveformViewer) {
        this.waveformViewer.setSubtitles(this.subtitle.paragraphs);
      }

      // Update video player subtitles
      if (this.videoPlayer) {
        this.videoPlayer.setSubtitles(this.subtitle.paragraphs);
      }

      this.updateStatusBar('자막이 삭제되었습니다');
    }
  }

  renderSubtitles() {
    const tbody = document.getElementById('subtitleTableBody');
    tbody.innerHTML = '';

    if (this.subtitle.paragraphs.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = '<td colspan="5" style="text-align: center; padding: 20px; color: #999;">자막이 없습니다. 파일을 열거나 "삽입" 버튼으로 자막을 추가하세요.</td>';
      tbody.appendChild(emptyRow);
      return;
    }

    this.subtitle.paragraphs.forEach((para, index) => {
      const row = document.createElement('tr');
      row.dataset.index = index;

      row.innerHTML = `
        <td>${para.number}</td>
        <td>${para.startTime.toString()}</td>
        <td>${para.endTime.toString()}</td>
        <td>${para.duration.totalSeconds.toFixed(1)}</td>
        <td>${para.text.replace(/\n/g, '↵')}</td>
      `;

      tbody.appendChild(row);
    });
  }

  highlightRow(index) {
    let selectedRow = null;
    document.querySelectorAll('.subtitle-grid tbody tr').forEach((row, i) => {
      const isSelected = i === index;
      row.classList.toggle('selected', isSelected);
      if (isSelected) {
        selectedRow = row;
      }
    });

    // Scroll to selected row
    if (selectedRow) {
      selectedRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  updateStats() {
    const lineCharsCount = document.getElementById('lineCharsCount');
    const totalCharsCount = document.getElementById('totalCharsCount');
    const charsPerSecond = document.getElementById('charsPerSecond');

    if (!lineCharsCount || !totalCharsCount || !charsPerSecond) {
      return;
    }

    const text = document.getElementById('textArea')?.value || '';
    const duration = parseFloat(document.getElementById('duration')?.value) || 1;

    // 총 문자 수 (공백 포함)
    const totalChars = text.length;

    // 한 줄당 문자 수 (줄바꿈으로 분리)
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const maxLineChars = lines.length > 0 ? Math.max(...lines.map(line => line.length)) : 0;

    // 초당 문자 수 (CPS - Characters Per Second)
    const cps = totalChars / duration;

    lineCharsCount.textContent = `한 줄: ${maxLineChars}자`;
    totalCharsCount.textContent = `총: ${totalChars}자`;
    charsPerSecond.textContent = `초당: ${cps.toFixed(1)}자`;

    // 한국어 자막 기준: 초당 15자 이상이면 경고
    if (cps > 15) {
      charsPerSecond.style.color = '#d32f2f';
      charsPerSecond.style.fontWeight = 'bold';
    } else {
      charsPerSecond.style.color = '#666';
      charsPerSecond.style.fontWeight = 'normal';
    }
  }

  updateStatusBar(message) {
    document.getElementById('statusText').textContent = message;
    document.getElementById('selectedInfo').textContent =
      this.selectedIndex >= 0 ? `선택: ${this.selectedIndex + 1}` : '';
  }

  initResizers() {
    const topRow = document.querySelector('.top-row');
    const mainContainer = document.querySelector('.main-container');
    const leftPanel = document.querySelector('.left-panel');
    const subtitleList = document.querySelector('.subtitle-list-panel');

    let isResizingTopBottom = false; // Top row - bottom row
    let isResizingLeftRight = false; // 2사분면 - 1사분면
    let isResizingListEditor = false; // 자막리스트 - 텍스트편집기

    // Top-bottom resizer (상단 - 하단)
    topRow.addEventListener('mousedown', (e) => {
      if (e.offsetY > topRow.offsetHeight - 6) {
        isResizingTopBottom = true;
        document.body.style.cursor = 'ns-resize';
        e.preventDefault();
      }
    });

    // Left-right resizer (2사분면 - 1사분면)
    leftPanel.addEventListener('mousedown', (e) => {
      if (e.offsetX > leftPanel.offsetWidth - 6) {
        isResizingLeftRight = true;
        document.body.style.cursor = 'ew-resize';
        e.preventDefault();
      }
    });

    // Subtitle list - text editor resizer
    subtitleList.addEventListener('mousedown', (e) => {
      if (e.offsetY > subtitleList.offsetHeight - 6) {
        isResizingListEditor = true;
        document.body.style.cursor = 'ns-resize';
        e.preventDefault();
      }
    });

    document.addEventListener('mousemove', (e) => {
      // Top-bottom resize
      if (isResizingTopBottom) {
        const containerHeight = mainContainer.offsetHeight;
        const newTopHeight = (e.clientY - mainContainer.offsetTop) / containerHeight * 100;

        if (newTopHeight > 30 && newTopHeight < 80) {
          topRow.style.height = `${newTopHeight}%`;
        }
      }

      // Left-right resize (2사분면 - 1사분면)
      if (isResizingLeftRight) {
        const parentWidth = topRow.offsetWidth;
        const newWidth = (e.clientX - topRow.offsetLeft) / parentWidth * 100;

        if (newWidth > 20 && newWidth < 80) {
          leftPanel.style.width = `${newWidth}%`;
        }
      }

      // Subtitle list - text editor resize
      if (isResizingListEditor) {
        const parentHeight = leftPanel.offsetHeight;
        const clickY = e.clientY - leftPanel.offsetTop;
        const newListHeight = (clickY / parentHeight) * 100;

        if (newListHeight > 30 && newListHeight < 70) {
          subtitleList.style.flex = `0 0 ${newListHeight}%`;
        }
      }
    });

    document.addEventListener('mouseup', () => {
      isResizingTopBottom = false;
      isResizingLeftRight = false;
      isResizingListEditor = false;
      document.body.style.cursor = '';
    });
  }

  // Waveform control methods
  insertAtPlayPosition() {
    if (!this.videoPlayer) {
      alert('비디오를 먼저 로드하세요');
      return;
    }

    const currentTime = this.videoPlayer.getCurrentTime();
    const startTime = new TimeCode(currentTime * 1000);
    const endTime = new TimeCode((currentTime + 2) * 1000); // Default 2 seconds

    document.getElementById('startTime').value = startTime.toString();
    document.getElementById('endTime').value = endTime.toString();
    document.getElementById('duration').value = '2.000';
    document.getElementById('textArea').value = '';
    document.getElementById('textArea').focus();

    this.updateStatusBar('새 자막 삽입 준비 완료');
  }

  playFromTextStart() {
    if (!this.videoPlayer) {
      alert('비디오를 먼저 로드하세요');
      return;
    }

    if (this.selectedIndex < 0) {
      alert('자막을 선택하세요');
      return;
    }

    const para = this.subtitle.paragraphs[this.selectedIndex];
    const startTime = Math.max(0, para.startTime.totalSeconds - 0.5); // 0.5초 전부터
    this.videoPlayer.seek(startTime);
    this.videoPlayer.play();
  }

  goToSubtitle() {
    if (this.selectedIndex < 0) {
      alert('자막을 선택하세요');
      return;
    }

    const para = this.subtitle.paragraphs[this.selectedIndex];

    if (this.videoPlayer) {
      this.videoPlayer.seek(para.startTime.totalSeconds);
    }

    if (this.waveformViewer) {
      this.waveformViewer.setCurrentTime(para.startTime.totalSeconds);
    }

    this.updateStatusBar(`자막 #${para.number} 위치로 이동`);
  }

  setStartTime() {
    if (!this.videoPlayer) {
      alert('비디오를 먼저 로드하세요');
      return;
    }

    const currentTime = this.videoPlayer.getCurrentTime();
    const startTime = new TimeCode(currentTime * 1000);
    document.getElementById('startTime').value = startTime.toString();

    const endTimeStr = document.getElementById('endTime').value;
    if (endTimeStr) {
      const endTime = TimeCode.parse(endTimeStr);
      const duration = (endTime.totalMilliseconds - startTime.totalMilliseconds) / 1000;
      document.getElementById('duration').value = duration.toFixed(3);
    }

    this.updateStatusBar('시작 시간 설정됨');
  }

  setEndTime() {
    if (!this.videoPlayer) {
      alert('비디오를 먼저 로드하세요');
      return;
    }

    const currentTime = this.videoPlayer.getCurrentTime();
    const endTime = new TimeCode(currentTime * 1000);
    document.getElementById('endTime').value = endTime.toString();

    const startTimeStr = document.getElementById('startTime').value;
    if (startTimeStr) {
      const startTime = TimeCode.parse(startTimeStr);
      const duration = (endTime.totalMilliseconds - startTime.totalMilliseconds) / 1000;
      document.getElementById('duration').value = duration.toFixed(3);
    }

    this.updateStatusBar('종료 시간 설정됨');
  }

  adjustTime(direction) {
    const adjustValue = parseFloat(document.getElementById('timeAdjustValue').value) || 0.5;
    const adjustment = adjustValue * direction;

    const startTimeStr = document.getElementById('startTime').value;
    const endTimeStr = document.getElementById('endTime').value;

    if (startTimeStr) {
      const startTime = TimeCode.parse(startTimeStr);
      const newStartTime = new TimeCode(Math.max(0, startTime.totalMilliseconds + adjustment * 1000));
      document.getElementById('startTime').value = newStartTime.toString();
    }

    if (endTimeStr) {
      const endTime = TimeCode.parse(endTimeStr);
      const newEndTime = new TimeCode(Math.max(0, endTime.totalMilliseconds + adjustment * 1000));
      document.getElementById('endTime').value = newEndTime.toString();
    }

    // Update duration
    const newStartTimeStr = document.getElementById('startTime').value;
    const newEndTimeStr = document.getElementById('endTime').value;
    if (newStartTimeStr && newEndTimeStr) {
      const start = TimeCode.parse(newStartTimeStr);
      const end = TimeCode.parse(newEndTimeStr);
      const duration = (end.totalMilliseconds - start.totalMilliseconds) / 1000;
      document.getElementById('duration').value = duration.toFixed(3);
    }
  }

  adjustZoom(direction) {
    const zoomLevelElement = document.getElementById('zoomLevel');
    let currentZoom = parseInt(zoomLevelElement.textContent) || 10000;

    // Adjust zoom step based on current level
    let step = 100;
    if (currentZoom >= 50000) {
      step = 10000; // Very large steps at extreme zoom
    } else if (currentZoom >= 20000) {
      step = 5000;
    } else if (currentZoom >= 10000) {
      step = 2000;
    } else if (currentZoom >= 5000) {
      step = 1000;
    } else if (currentZoom >= 2000) {
      step = 500;
    } else if (currentZoom >= 1000) {
      step = 200;
    }

    currentZoom += direction * step;
    currentZoom = Math.max(100, Math.min(100000, currentZoom)); // 100% ~ 100000%

    zoomLevelElement.textContent = currentZoom + '%';

    // Apply zoom to waveform if available
    if (this.waveformViewer) {
      const zoomFactor = currentZoom / 100; // Convert percentage to factor
      this.waveformViewer.setZoom(zoomFactor);
    }
  }

  togglePlayback() {
    if (!this.videoPlayer) {
      alert('비디오를 먼저 로드하세요');
      return;
    }

    const btn = document.getElementById('waveformPlayBtn');
    if (this.videoPlayer.isPlaying) {
      this.videoPlayer.pause();
      btn.textContent = '▶️ 재생';
    } else {
      this.videoPlayer.play();
      btn.textContent = '⏸️ 일시정지';
    }
  }

  stopPlayback() {
    if (!this.videoPlayer) {
      return;
    }

    this.videoPlayer.pause();
    this.videoPlayer.seek(0);
    const btn = document.getElementById('waveformPlayBtn');
    btn.textContent = '▶️ 재생';
  }

  // Toolbar action methods
  resetToDefault() {
    if (confirm('처음으로 돌아가시겠습니까? 저장하지 않은 변경 사항은 손실됩니다.')) {
      location.reload();
    }
  }

  showFindDialog() {
    const searchTerm = prompt('찾을 텍스트를 입력하세요:', this.lastSearchTerm);
    if (!searchTerm) return;

    this.lastSearchTerm = searchTerm;
    this.lastSearchIndex = -1;

    let found = false;
    this.subtitle.paragraphs.forEach((para, index) => {
      if (para.text.includes(searchTerm)) {
        if (!found) {
          this.selectSubtitle(index);
          this.lastSearchIndex = index;
          found = true;
        }
      }
    });

    if (!found) {
      alert(`"${searchTerm}"을(를) 찾을 수 없습니다.`);
    } else {
      this.updateStatusBar(`"${searchTerm}"을(를) 찾았습니다`);
    }
  }

  showReplaceDialog() {
    // Create modal dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 1px solid #ccc;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      padding: 20px;
      z-index: 10000;
      min-width: 400px;
    `;

    dialog.innerHTML = `
      <h3 style="margin-top: 0;">찾기 및 바꾸기</h3>
      <div style="margin-bottom: 10px;">
        <label for="findText">찾을 텍스트:</label><br>
        <input type="text" id="findText" style="width: 100%; padding: 5px; margin-top: 5px;" />
      </div>
      <div style="margin-bottom: 20px;">
        <label for="replaceText">바꿀 텍스트:</label><br>
        <input type="text" id="replaceText" style="width: 100%; padding: 5px; margin-top: 5px;" />
      </div>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="replaceOneBtn" style="padding: 5px 15px;">다음 찾기</button>
        <button id="replaceAllBtn" style="padding: 5px 15px;">모두 바꾸기</button>
        <button id="cancelBtn" style="padding: 5px 15px;">취소</button>
      </div>
    `;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 9999;
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(dialog);

    const close = () => {
      document.body.removeChild(overlay);
      document.body.removeChild(dialog);
    };

    dialog.querySelector('#cancelBtn').addEventListener('click', close);

    dialog.querySelector('#replaceOneBtn').addEventListener('click', () => {
      const findText = dialog.querySelector('#findText').value;
      const replaceText = dialog.querySelector('#replaceText').value;

      if (!findText) {
        alert('찾을 텍스트를 입력하세요');
        return;
      }

      let found = false;
      for (let i = 0; i < this.subtitle.paragraphs.length; i++) {
        if (this.subtitle.paragraphs[i].text.includes(findText)) {
          this.selectSubtitle(i);
          found = true;
          break;
        }
      }

      if (!found) {
        alert(`"${findText}"을(를) 찾을 수 없습니다.`);
      }
    });

    dialog.querySelector('#replaceAllBtn').addEventListener('click', () => {
      const findText = dialog.querySelector('#findText').value;
      const replaceText = dialog.querySelector('#replaceText').value;

      if (!findText) {
        alert('찾을 텍스트를 입력하세요');
        return;
      }

      let count = 0;
      this.subtitle.paragraphs.forEach(para => {
        if (para.text.includes(findText)) {
          para.text = para.text.replaceAll(findText, replaceText);
          count++;
        }
      });

      this.renderSubtitles();

      if (this.waveformViewer) {
        this.waveformViewer.setSubtitles(this.subtitle.paragraphs);
      }

      if (this.videoPlayer) {
        this.videoPlayer.setSubtitles(this.subtitle.paragraphs);
      }

      alert(`${count}개 항목을 바꿨습니다.`);
      close();
    });
  }

  async showSpellCheckDialog() {
    if (this.subtitle.paragraphs.length === 0) {
      alert('자막이 없습니다');
      return;
    }

    // Load dictionary first
    const loadingMsg = document.createElement('div');
    loadingMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border: 1px solid #999; box-shadow: 0 4px 20px rgba(0,0,0,0.3); z-index: 10001; border-radius: 5px;';
    loadingMsg.innerHTML = '<p style="margin: 0; font-size: 14px;">한국어 사전 로딩 중...</p><p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">최초 1회만 로딩됩니다 (13MB)</p>';
    document.body.appendChild(loadingMsg);

    const success = await spellChecker.loadDictionary();
    loadingMsg.remove();

    if (!success) {
      alert('사전 로딩에 실패했습니다.');
      return;
    }

    // Create spell check dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 1px solid #999;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10001;
      width: 700px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      font-family: 'Segoe UI', sans-serif;
    `;

    // State
    let currentWordIndex = 0;
    let words = [];
    let stats = { changed: 0, skipped: 0, added: 0 };

    // Extract all words from all subtitles and filter incorrect ones
    const extractWords = () => {
      words = [];
      this.subtitle.paragraphs.forEach((para, paraIndex) => {
        const text = para.text;
        const wordMatches = [...text.matchAll(/[\wㄱ-ㅎㅏ-ㅣ가-힣']+/g)];

        // Build all words array for context
        const allWords = wordMatches.map((match, idx) => ({
          word: match[0],
          position: match.index,
          index: idx
        }));

        // Check each word with full context
        wordMatches.forEach((match, wordIndex) => {
          const word = match[0];

          // Build context object
          const context = {
            fullText: text,
            wordIndex: wordIndex,
            allWords: allWords,
            prefix: wordIndex > 0 && match.index > 0 ? text[match.index - 1] : ''
          };

          // Check spelling with full Subtitle Edit logic
          const isCorrect = spellChecker.checkWithContext(word, context);

          // Only add incorrect words (like Subtitle Edit)
          if (!isCorrect) {
            words.push({
              word: word,
              paraIndex: paraIndex,
              position: match.index,
              wordIndex: wordIndex,
              allWords: allWords
            });
          }
        });
      });
    };

    extractWords();

    if (words.length === 0) {
      alert('맞춤법 오류가 없습니다!');
      return;
    }

    const updateDialog = () => {
      if (currentWordIndex >= words.length) {
        // Clear temporary skip list (like Subtitle Edit)
        userDictionary.clearSkipAll();

        dialog.innerHTML = `
          <div style="padding: 20px;">
            <h2 style="margin: 0 0 20px 0; font-size: 18px;">맞춤법 검사 완료</h2>
            <div style="margin-bottom: 15px;">
              <p style="margin: 5px 0;">✓ 변경됨: ${stats.changed}개</p>
              <p style="margin: 5px 0;">→ 건너뜀: ${stats.skipped}개</p>
              <p style="margin: 5px 0;">+ 사전에 추가: ${stats.added}개</p>
              <p style="margin: 5px 0; font-weight: bold;">총 검사: ${words.length}개 단어</p>
            </div>
            <button onclick="this.closest('div').parentElement.remove(); document.getElementById('spellCheckOverlay').remove();"
                    style="padding: 8px 20px; background: #0078d4; color: white; border: none; cursor: pointer; border-radius: 3px;">
              닫기
            </button>
          </div>
        `;
        return;
      }

      const currentWord = words[currentWordIndex];
      const para = this.subtitle.paragraphs[currentWord.paraIndex];
      const progress = Math.round((currentWordIndex / words.length) * 100);

      dialog.innerHTML = `
        <div style="background: #f0f0f0; padding: 10px 15px; border-bottom: 1px solid #ccc;">
          <h2 style="margin: 0; font-size: 16px;">맞춤법 검사</h2>
          <div style="margin-top: 5px; font-size: 12px; color: #666;">
            진행: ${currentWordIndex + 1} / ${words.length} (${progress}%)
          </div>
        </div>

        <div style="flex: 1; overflow-y: auto; padding: 15px;">
          <div style="margin-bottom: 15px;">
            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">검사 중인 단어:</div>
            <div style="background: #fff4cc; padding: 10px; border: 2px solid #ffd700; border-radius: 3px; font-size: 18px; font-weight: bold;">
              ${currentWord.word}
            </div>
          </div>

          <div style="margin-bottom: 15px;">
            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">전체 텍스트:</div>
            <div style="background: #f9f9f9; padding: 10px; border: 1px solid #ddd; border-radius: 3px; font-size: 14px; line-height: 1.6;">
              ${para.text.substring(0, currentWord.position)}<span style="background: #fff4cc; font-weight: bold;">${currentWord.word}</span>${para.text.substring(currentWord.position + currentWord.word.length)}
            </div>
            <div style="font-size: 11px; color: #999; margin-top: 3px;">
              자막 #${currentWord.paraIndex + 1} / ${para.startTime.toString()} → ${para.endTime.toString()}
            </div>
          </div>

          <div style="margin-bottom: 15px;">
            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">변경할 단어:</div>
            <input type="text" id="spellCheckChangeWord" value="${currentWord.word}"
                   style="width: 100%; padding: 8px; border: 1px solid #ccc; font-size: 14px; border-radius: 3px;" />
          </div>

          <div style="margin-bottom: 15px;">
            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">제안:</div>
            <div id="suggestionsList" style="display: flex; flex-wrap: wrap; gap: 5px;"></div>
          </div>
        </div>

        <div style="background: #f0f0f0; padding: 10px 15px; border-top: 1px solid #ccc; display: flex; gap: 8px; flex-wrap: wrap;">
          <button onclick="window.spellCheckChangeWord()"
                  style="padding: 8px 15px; background: #0078d4; color: white; border: none; cursor: pointer; border-radius: 3px; font-size: 13px;">
            변경
          </button>
          <button onclick="window.spellCheckChangeAll()"
                  style="padding: 8px 15px; background: #0078d4; color: white; border: none; cursor: pointer; border-radius: 3px; font-size: 13px;">
            모두 변경
          </button>
          <button onclick="window.spellCheckSkip()"
                  style="padding: 8px 15px; background: #666; color: white; border: none; cursor: pointer; border-radius: 3px; font-size: 13px;">
            건너뛰기
          </button>
          <button onclick="window.spellCheckSkipAll()"
                  style="padding: 8px 15px; background: #666; color: white; border: none; cursor: pointer; border-radius: 3px; font-size: 13px;">
            모두 건너뛰기
          </button>
          <button onclick="window.spellCheckAddToDictionary()"
                  style="padding: 8px 15px; background: #28a745; color: white; border: none; cursor: pointer; border-radius: 3px; font-size: 13px;">
            사전에 추가
          </button>
          <button onclick="window.spellCheckAbort()"
                  style="padding: 8px 15px; background: #dc3545; color: white; border: none; cursor: pointer; border-radius: 3px; font-size: 13px; margin-left: auto;">
            중단
          </button>
        </div>
      `;

      const suggestionsList = dialog.querySelector('#suggestionsList');

      // Get suggestions from Hunspell
      const suggestions = spellChecker.suggest(currentWord.word);

      if (suggestions.length === 0) {
        suggestionsList.innerHTML = '<span style="color: #999; font-size: 12px;">제안 없음</span>';
      } else {
        suggestions.forEach(suggestion => {
          const btn = document.createElement('button');
          btn.textContent = suggestion;
          btn.style.cssText = 'padding: 5px 12px; background: #e9ecef; border: 1px solid #adb5bd; cursor: pointer; border-radius: 3px; font-size: 13px;';
          btn.onclick = () => {
            document.getElementById('spellCheckChangeWord').value = suggestion;
          };
          suggestionsList.appendChild(btn);
        });
      }
    };

    window.spellCheckChangeWord = () => {
      const newWord = document.getElementById('spellCheckChangeWord').value;
      if (newWord && newWord !== words[currentWordIndex].word) {
        this.saveHistory();
        const wordInfo = words[currentWordIndex];
        const para = this.subtitle.paragraphs[wordInfo.paraIndex];
        para.text = para.text.substring(0, wordInfo.position) + newWord + para.text.substring(wordInfo.position + wordInfo.word.length);
        stats.changed++;
        this.renderSubtitles();
        if (this.waveformViewer) this.waveformViewer.setSubtitles(this.subtitle.paragraphs);
        if (this.videoPlayer) this.videoPlayer.setSubtitles(this.subtitle.paragraphs);
      }
      currentWordIndex++;
      updateDialog();
    };

    window.spellCheckChangeAll = () => {
      const newWord = document.getElementById('spellCheckChangeWord').value;
      const oldWord = words[currentWordIndex].word;
      if (newWord && newWord !== oldWord) {
        this.saveHistory();
        let changeCount = 0;
        this.subtitle.paragraphs.forEach(para => {
          const regex = new RegExp('\\b' + oldWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'g');
          const before = para.text;
          para.text = para.text.replace(regex, newWord);
          if (para.text !== before) changeCount++;
        });
        stats.changed += changeCount;
        this.renderSubtitles();
        if (this.waveformViewer) this.waveformViewer.setSubtitles(this.subtitle.paragraphs);
        if (this.videoPlayer) this.videoPlayer.setSubtitles(this.subtitle.paragraphs);
      }
      currentWordIndex++;
      updateDialog();
    };

    window.spellCheckSkip = () => {
      stats.skipped++;
      currentWordIndex++;
      updateDialog();
    };

    window.spellCheckSkipAll = () => {
      const skipWord = words[currentWordIndex].word;
      let skipCount = 0;
      for (let i = currentWordIndex; i < words.length; i++) {
        if (words[i].word === skipWord) {
          skipCount++;
        }
      }
      stats.skipped += skipCount;

      // Add to temporary skip list (like Subtitle Edit)
      userDictionary.addSkipAll(skipWord);

      // Remove all instances from words list
      words = words.filter(w => w.word !== skipWord);
      updateDialog();
    };

    window.spellCheckAddToDictionary = () => {
      stats.added++;
      const addWord = words[currentWordIndex].word;

      // Add to permanent user dictionary
      userDictionary.addUserWord(addWord);

      // Remove all instances from words list
      words = words.filter(w => w.word !== addWord);
      updateDialog();
    };

    window.spellCheckAbort = () => {
      if (confirm('맞춤법 검사를 중단하시겠습니까?')) {
        // Clear temporary skip list
        userDictionary.clearSkipAll();

        dialog.remove();
        overlay.remove();
        delete window.spellCheckChangeWord;
        delete window.spellCheckChangeAll;
        delete window.spellCheckSkip;
        delete window.spellCheckSkipAll;
        delete window.spellCheckAddToDictionary;
        delete window.spellCheckAbort;
      }
    };

    const overlay = document.createElement('div');
    overlay.id = 'spellCheckOverlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10000;
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
    updateDialog();
  }


  // Edit menu methods
  saveHistory() {
    const state = JSON.stringify(this.subtitle.paragraphs.map(p => ({
      text: p.text,
      startTime: p.startTime.totalMilliseconds,
      endTime: p.endTime.totalMilliseconds
    })));

    // Remove future history if we're not at the end
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    this.history.push(state);
    if (this.history.length > 100) {
      this.history.shift();
    } else {
      this.historyIndex++;
    }
  }

  undo() {
    if (this.historyIndex <= 0) {
      alert('실행 취소할 수 없습니다');
      return;
    }

    this.historyIndex--;
    const state = JSON.parse(this.history[this.historyIndex]);

    this.subtitle.paragraphs = state.map((p, i) => {
      const para = new Paragraph({
        text: p.text,
        startTime: new TimeCode(p.startTime),
        endTime: new TimeCode(p.endTime)
      });
      para.number = i + 1;
      return para;
    });

    this.renderSubtitles();
    this.updateStatusBar('실행 취소됨');
  }

  redo() {
    if (this.historyIndex >= this.history.length - 1) {
      alert('다시 실행할 수 없습니다');
      return;
    }

    this.historyIndex++;
    const state = JSON.parse(this.history[this.historyIndex]);

    this.subtitle.paragraphs = state.map((p, i) => {
      const para = new Paragraph({
        text: p.text,
        startTime: new TimeCode(p.startTime),
        endTime: new TimeCode(p.endTime)
      });
      para.number = i + 1;
      return para;
    });

    this.renderSubtitles();
    this.updateStatusBar('다시 실행됨');
  }

  findNext() {
    if (!this.lastSearchTerm) {
      this.showFindDialog();
      return;
    }

    for (let i = this.lastSearchIndex + 1; i < this.subtitle.paragraphs.length; i++) {
      if (this.subtitle.paragraphs[i].text.includes(this.lastSearchTerm)) {
        this.selectSubtitle(i);
        this.lastSearchIndex = i;
        this.updateStatusBar(`"${this.lastSearchTerm}"을(를) 찾았습니다 (${i + 1}/${this.subtitle.paragraphs.length})`);
        return;
      }
    }

    // Wrap around
    for (let i = 0; i <= this.lastSearchIndex; i++) {
      if (this.subtitle.paragraphs[i].text.includes(this.lastSearchTerm)) {
        this.selectSubtitle(i);
        this.lastSearchIndex = i;
        this.updateStatusBar(`"${this.lastSearchTerm}"을(를) 찾았습니다 (처음부터)`);
        return;
      }
    }

    alert(`더 이상 "${this.lastSearchTerm}"을(를) 찾을 수 없습니다.`);
  }

  showMultiReplaceDialog() {
    alert('다중 바꾸기 기능은 개발 중입니다.\n\n여러 찾기/바꾸기 규칙을 정의하여 일괄 적용할 수 있습니다.');
    // TODO: Implement multi-replace with rules
  }

  applyKtFormat() {
    if (this.subtitle.paragraphs.length === 0) {
      alert('자막이 없습니다');
      return;
    }

    const confirmed = confirm('kt향 후처리를 시행하시겠습니까?');
    if (!confirmed) return;

    this.saveHistory();

    let changedCount = 0;
    this.subtitle.paragraphs.forEach(para => {
      const originalText = para.text;
      para.text = para.text.replace(/[.!]/g, '');
      if (para.text !== originalText) {
        changedCount++;
      }
    });

    this.renderSubtitles();
    if (this.selectedIndex >= 0) {
      this.selectSubtitle(this.selectedIndex);
    }

    if (this.waveformViewer) {
      this.waveformViewer.setSubtitles(this.subtitle.paragraphs);
    }
    if (this.videoPlayer) {
      this.videoPlayer.setSubtitles(this.subtitle.paragraphs);
    }

    this.updateStatusBar(`KT 포맷 적용 완료: ${changedCount}개 자막 수정됨`);
    alert(`KT 포맷이 적용되었습니다.\n\n변경된 자막: ${changedCount}개`);
  }

  goToLine() {
    const lineNumber = prompt('이동할 자막 번호를 입력하세요:');
    if (!lineNumber) return;

    const num = parseInt(lineNumber);
    if (isNaN(num) || num < 1 || num > this.subtitle.paragraphs.length) {
      alert('유효한 자막 번호를 입력하세요');
      return;
    }

    this.selectSubtitle(num - 1);
    this.updateStatusBar(`자막 #${num}로 이동`);
  }

  replaceSelected() {
    if (this.selectedIndices.size === 0) {
      alert('먼저 자막을 선택하세요');
      return;
    }

    const findText = prompt('찾을 텍스트:');
    if (!findText) return;

    const replaceText = prompt('바꿀 텍스트:');
    if (replaceText === null) return;

    let count = 0;
    this.selectedIndices.forEach(index => {
      const para = this.subtitle.paragraphs[index];
      if (para.text.includes(findText)) {
        para.text = para.text.replaceAll(findText, replaceText);
        count++;
      }
    });

    this.saveHistory();
    this.renderSubtitles();
    alert(`선택한 자막 중 ${count}개 항목을 바꿨습니다.`);
  }

  invertSelection() {
    const newSelection = new Set();
    for (let i = 0; i < this.subtitle.paragraphs.length; i++) {
      if (!this.selectedIndices.has(i)) {
        newSelection.add(i);
      }
    }
    this.selectedIndices = newSelection;
    this.updateSelectionHighlight();
    this.updateStatusBar(`${this.selectedIndices.size}개 자막 선택됨`);
  }

  selectAll() {
    this.selectedIndices.clear();
    for (let i = 0; i < this.subtitle.paragraphs.length; i++) {
      this.selectedIndices.add(i);
    }
    this.updateSelectionHighlight();
    this.updateStatusBar(`모든 자막(${this.selectedIndices.size}개) 선택됨`);
  }

  updateSelectionHighlight() {
    document.querySelectorAll('.subtitle-grid tbody tr').forEach((row, i) => {
      if (this.selectedIndices.has(i)) {
        row.classList.add('selected');
      } else {
        row.classList.remove('selected');
      }
    });
  }

  // Context menu methods
  showContextMenu(x, y, index) {
    // Remove existing menu
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';

    const menuItems = [
      { label: '줄 삭제', action: () => this.deleteLine(index) },
      { separator: true },
      { label: '앞에 빈 줄 삽입', action: () => this.insertEmptyLineBefore(index) },
      { label: '뒤에 빈 줄 삽입', action: () => this.insertEmptyLineAfter(index) },
      { label: '뒤에 새 자막 삽입', action: () => this.insertNewSubtitleAfter(index) },
      { separator: true },
      { label: '줄 복사', action: () => this.copyLine(index) },
      { label: '문자열 편집', action: () => this.editString(index) },
      { separator: true },
      { label: '줄 분할', action: () => this.splitLine(index) },
      { label: '이전 줄과 병합', action: () => this.mergePrevious(index) },
      { label: '다음 줄과 병합', action: () => this.mergeNext(index) },
      { separator: true },
      { label: '이전 줄 쪽으로 길이 확장', action: () => this.extendToPrevious(index) },
      { label: '다음 줄 쪽으로 길이 확장', action: () => this.extendToNext(index) },
      { separator: true },
      { label: '서식 제거', action: () => this.removeFormatting(index) },
      { label: '굵게', action: () => this.applyBold(index) },
      { label: '기울임꼴', action: () => this.applyItalic(index) },
      { label: '밑줄', action: () => this.applyUnderline(index) },
      { label: '색상', action: () => this.applyColor(index) },
      { label: '글꼴', action: () => this.applyFont(index) }
    ];

    menuItems.forEach(item => {
      if (item.separator) {
        const sep = document.createElement('div');
        sep.className = 'context-menu-separator';
        menu.appendChild(sep);
      } else {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item';
        menuItem.textContent = item.label;
        menuItem.addEventListener('click', (e) => {
          e.stopPropagation();
          item.action();
          menu.remove();
        });
        menu.appendChild(menuItem);
      }
    });

    document.body.appendChild(menu);

    // Adjust position if menu goes off screen
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = (x - rect.width) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = (y - rect.height) + 'px';
    }
  }

  deleteLine(index) {
    if (confirm('이 자막을 삭제하시겠습니까?')) {
      this.saveHistory();
      this.subtitle.paragraphs.splice(index, 1);
      this.subtitle.renumber();
      this.renderSubtitles();
      this.updateStatusBar('자막이 삭제되었습니다');
    }
  }

  insertEmptyLineBefore(index) {
    this.saveHistory();
    const prevEnd = index > 0 ? this.subtitle.paragraphs[index - 1].endTime : new TimeCode(0);
    const currentStart = this.subtitle.paragraphs[index].startTime;
    const newStart = new TimeCode(prevEnd.totalMilliseconds + 100);
    const newEnd = new TimeCode(currentStart.totalMilliseconds - 100);

    const para = new Paragraph({ startTime: newStart, endTime: newEnd, text: '' });
    this.subtitle.paragraphs.splice(index, 0, para);
    this.subtitle.renumber();
    this.renderSubtitles();
    this.updateStatusBar('빈 줄이 삽입되었습니다');
  }

  insertEmptyLineAfter(index) {
    this.saveHistory();
    const currentEnd = this.subtitle.paragraphs[index].endTime;
    const nextStart = index < this.subtitle.paragraphs.length - 1
      ? this.subtitle.paragraphs[index + 1].startTime
      : new TimeCode(currentEnd.totalMilliseconds + 2000);
    const newStart = new TimeCode(currentEnd.totalMilliseconds + 100);
    const newEnd = new TimeCode(nextStart.totalMilliseconds - 100);

    const para = new Paragraph({ startTime: newStart, endTime: newEnd, text: '' });
    this.subtitle.paragraphs.splice(index + 1, 0, para);
    this.subtitle.renumber();
    this.renderSubtitles();
    this.updateStatusBar('빈 줄이 삽입되었습니다');
  }

  insertNewSubtitleAfter(index) {
    const currentEnd = this.subtitle.paragraphs[index].endTime;
    const newStart = new TimeCode(currentEnd.totalMilliseconds + 100);
    const newEnd = new TimeCode(newStart.totalMilliseconds + 2000);

    document.getElementById('startTime').value = newStart.toString();
    document.getElementById('endTime').value = newEnd.toString();
    document.getElementById('duration').value = '2.000';
    document.getElementById('textArea').value = '';
    document.getElementById('textArea').focus();
    this.updateStatusBar('새 자막 정보가 설정되었습니다. 텍스트를 입력하고 삽입 버튼을 누르세요.');
  }

  copyLine(index) {
    const para = this.subtitle.paragraphs[index];
    const text = `${para.startTime.toString()} --> ${para.endTime.toString()}\n${para.text}`;
    navigator.clipboard.writeText(text).then(() => {
      this.updateStatusBar('자막이 클립보드에 복사되었습니다');
    });
  }

  editString(index) {
    this.selectSubtitle(index);
    document.getElementById('textArea').focus();
    document.getElementById('textArea').select();
  }

  splitLine(index) {
    const para = this.subtitle.paragraphs[index];
    const text = para.text;
    const midPoint = Math.floor(text.length / 2);

    const text1 = text.substring(0, midPoint).trim();
    const text2 = text.substring(midPoint).trim();

    if (!text1 || !text2) {
      alert('줄 분할에 실패했습니다. 텍스트가 너무 짧습니다.');
      return;
    }

    this.saveHistory();
    const duration = para.endTime.totalMilliseconds - para.startTime.totalMilliseconds;
    const midTime = new TimeCode(para.startTime.totalMilliseconds + duration / 2);

    para.text = text1;
    para.endTime = midTime;

    const newPara = new Paragraph({
      startTime: midTime,
      endTime: new TimeCode(para.startTime.totalMilliseconds + duration),
      text: text2
    });

    this.subtitle.paragraphs.splice(index + 1, 0, newPara);
    this.subtitle.renumber();
    this.renderSubtitles();
    this.updateStatusBar('줄이 분할되었습니다');
  }

  mergePrevious(index) {
    if (index === 0) {
      alert('이전 줄이 없습니다');
      return;
    }

    this.saveHistory();
    const prev = this.subtitle.paragraphs[index - 1];
    const current = this.subtitle.paragraphs[index];

    prev.text = prev.text + '\n' + current.text;
    prev.endTime = current.endTime;

    this.subtitle.paragraphs.splice(index, 1);
    this.subtitle.renumber();
    this.renderSubtitles();
    this.updateStatusBar('이전 줄과 병합되었습니다');
  }

  mergeNext(index) {
    if (index >= this.subtitle.paragraphs.length - 1) {
      alert('다음 줄이 없습니다');
      return;
    }

    this.saveHistory();
    const current = this.subtitle.paragraphs[index];
    const next = this.subtitle.paragraphs[index + 1];

    current.text = current.text + '\n' + next.text;
    current.endTime = next.endTime;

    this.subtitle.paragraphs.splice(index + 1, 1);
    this.subtitle.renumber();
    this.renderSubtitles();
    this.updateStatusBar('다음 줄과 병합되었습니다');
  }

  extendToPrevious(index) {
    if (index === 0) {
      alert('이전 줄이 없습니다');
      return;
    }

    this.saveHistory();
    const prev = this.subtitle.paragraphs[index - 1];
    const current = this.subtitle.paragraphs[index];

    current.startTime = prev.endTime;
    this.renderSubtitles();
    this.updateStatusBar('이전 줄 쪽으로 확장되었습니다');
  }

  extendToNext(index) {
    if (index >= this.subtitle.paragraphs.length - 1) {
      alert('다음 줄이 없습니다');
      return;
    }

    this.saveHistory();
    const current = this.subtitle.paragraphs[index];
    const next = this.subtitle.paragraphs[index + 1];

    current.endTime = next.startTime;
    this.renderSubtitles();
    this.updateStatusBar('다음 줄 쪽으로 확장되었습니다');
  }

  removeFormatting(index) {
    this.saveHistory();
    const para = this.subtitle.paragraphs[index];
    // Remove HTML tags and formatting
    para.text = para.text.replace(/<[^>]*>/g, '').replace(/\{[^}]*\}/g, '');
    this.renderSubtitles();
    this.updateStatusBar('서식이 제거되었습니다');
  }

  applyBold(index) {
    this.saveHistory();
    const para = this.subtitle.paragraphs[index];
    para.text = `<b>${para.text}</b>`;
    this.renderSubtitles();
    this.updateStatusBar('굵게 적용됨');
  }

  applyItalic(index) {
    this.saveHistory();
    const para = this.subtitle.paragraphs[index];
    para.text = `<i>${para.text}</i>`;
    this.renderSubtitles();
    this.updateStatusBar('기울임꼴 적용됨');
  }

  applyUnderline(index) {
    this.saveHistory();
    const para = this.subtitle.paragraphs[index];
    para.text = `<u>${para.text}</u>`;
    this.renderSubtitles();
    this.updateStatusBar('밑줄 적용됨');
  }

  applyColor(index) {
    const color = prompt('색상을 입력하세요 (예: #FF0000, red):', '#FFFFFF');
    if (!color) return;

    this.saveHistory();
    const para = this.subtitle.paragraphs[index];
    para.text = `<font color="${color}">${para.text}</font>`;
    this.renderSubtitles();
    this.updateStatusBar('색상이 적용되었습니다');
  }

  applyFont(index) {
    const font = prompt('글꼴을 입력하세요 (예: Arial, 맑은 고딕):', 'Arial');
    if (!font) return;

    this.saveHistory();
    const para = this.subtitle.paragraphs[index];
    para.text = `<font face="${font}">${para.text}</font>`;
    this.renderSubtitles();
    this.updateStatusBar('글꼴이 적용되었습니다');
  }

  // Navigation methods
  prevSubtitle() {
    if (this.selectedIndex > 0) {
      this.selectSubtitle(this.selectedIndex - 1);
    }
  }

  nextSubtitle() {
    if (this.selectedIndex < this.subtitle.paragraphs.length - 1) {
      this.selectSubtitle(this.selectedIndex + 1);
    }
  }

  // Apply edit button handler
  applyEdit() {
    if (this.selectedIndex < 0) {
      alert('자막을 선택하세요');
      return;
    }

    const para = this.subtitle.paragraphs[this.selectedIndex];
    if (!para) return;

    const newText = document.getElementById('textArea').value;
    const newStartTime = document.getElementById('startTime').value;
    const newDuration = parseFloat(document.getElementById('duration').value) || 0;

    this.showDebug(`적용 버튼 클릭<br>텍스트: ${newText.substring(0, 20)}...`);

    // Check if anything actually changed
    const textChanged = newText !== para.text;
    const startTimeChanged = newStartTime !== para.startTime.toString();
    const durationChanged = Math.abs(newDuration - para.duration.totalSeconds) > 0.001;

    if (!textChanged && !startTimeChanged && !durationChanged) {
      this.updateStatusBar('변경 사항이 없습니다');
      this.showDebug('변경 사항 없음');
      return;
    }

    this.saveHistory();

    // Update paragraph
    const oldText = para.text;
    para.text = newText;
    if (newStartTime) {
      para.startTime = TimeCode.parse(newStartTime);
      para.endTime = new TimeCode(para.startTime.totalMilliseconds + (newDuration * 1000));
    }

    this.showDebug(`자막 업데이트됨<br>이전: ${oldText.substring(0, 20)}<br>이후: ${para.text.substring(0, 20)}`);

    // Re-render without clearing selection
    this.renderSubtitles();
    this.highlightRow(this.selectedIndex);

    // Update waveform and video
    if (this.waveformViewer) {
      this.waveformViewer.setSubtitles(this.subtitle.paragraphs);
    }
    if (this.videoPlayer) {
      this.videoPlayer.setSubtitles(this.subtitle.paragraphs);
    }

    this.updateStatusBar('자막이 수정되었습니다');
    this.showDebug('✓ 자막 리스트 갱신 완료');
  }

  // Unbreak lines - remove line breaks (Subtitle Edit compatible)
  unbreakLines() {
    const textArea = document.getElementById('textArea');
    if (!textArea) return;

    let text = textArea.value;
    if (!text || !text.includes('\n')) return;

    // Remove line breaks and join with space
    text = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join(' ');

    // Clean up multiple spaces
    text = text.replace(/\s+/g, ' ').trim();

    textArea.value = text;
    this.updateStats();

    // Auto-apply the change
    this.applyEdit();
  }

  // Auto break lines - add line breaks at optimal positions (Subtitle Edit compatible)
  autoBreakLines() {
    const textArea = document.getElementById('textArea');
    if (!textArea) return;

    let text = textArea.value;
    if (!text) return;

    // First unbreak to single line
    text = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Settings (Subtitle Edit default: 42 chars max per line)
    const maxLineLength = 42;
    const words = text.split(' ');

    if (words.length === 0) return;

    // Build two lines with optimal balance
    let line1 = '';
    let line2 = '';
    let bestBalance = Infinity;
    let bestLine1 = '';
    let bestLine2 = '';

    // Try all possible split points
    for (let i = 1; i < words.length; i++) {
      line1 = words.slice(0, i).join(' ');
      line2 = words.slice(i).join(' ');

      // Check if both lines are within limit
      if (line1.length <= maxLineLength && line2.length <= maxLineLength) {
        // Calculate balance (prefer more even distribution)
        const balance = Math.abs(line1.length - line2.length);
        if (balance < bestBalance) {
          bestBalance = balance;
          bestLine1 = line1;
          bestLine2 = line2;
        }
      }
    }

    // Apply best split if found, otherwise keep as is
    if (bestLine1 && bestLine2) {
      textArea.value = bestLine1 + '\n' + bestLine2;
    } else if (text.length <= maxLineLength) {
      // Single line is fine
      textArea.value = text;
    } else {
      // Too long for 2 lines, just do simple split
      textArea.value = bestLine1 || text;
    }

    this.updateStats();

    // Auto-apply the change
    this.applyEdit();
  }

  // Update current subtitle based on video time
  updateCurrentSubtitle(time) {
    if (!this.subtitle || this.subtitle.paragraphs.length === 0) return;

    // Find subtitle that matches current time
    const timeMs = time * 1000;
    const currentIndex = this.subtitle.paragraphs.findIndex(para =>
      timeMs >= para.startTime.totalMilliseconds &&
      timeMs <= para.endTime.totalMilliseconds
    );

    // Only update if different from current selection
    if (currentIndex >= 0 && currentIndex !== this.selectedIndex) {
      this.selectedIndex = currentIndex;
      const para = this.subtitle.paragraphs[currentIndex];

      // Update text editor fields
      const startTimeInput = document.getElementById('startTime');
      const durationInput = document.getElementById('duration');
      const textAreaInput = document.getElementById('textArea');

      if (startTimeInput && durationInput && textAreaInput) {
        startTimeInput.value = para.startTime.toString();
        durationInput.value = para.duration.totalSeconds.toFixed(3);
        textAreaInput.value = para.text;
      }

      // Highlight and scroll to row
      this.highlightRow(currentIndex);
    }
  }

  showDebug(message) {
    const debugDiv = document.getElementById('debugInfo');
    if (debugDiv) {
      debugDiv.style.display = 'block';
      debugDiv.innerHTML += message + '<br>';
      // Auto-scroll to bottom
      debugDiv.scrollTop = debugDiv.scrollHeight;
      // Clear after 5 seconds
      setTimeout(() => {
        debugDiv.innerHTML = '';
        debugDiv.style.display = 'none';
      }, 5000);
    }
  }

  showWaveformRegionMenu(x, y, region) {
    // Remove existing menu
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) existingMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';

    const menuItems = [
      { label: '여기에 텍스트 추가', action: () => this.addTextAtRegion(region) },
      { separator: true },
      { label: '이전 자막으로 이동', action: () => this.goToPreviousSubtitle() },
      { label: '다음 자막으로 이동', action: () => this.goToNextSubtitle() },
      { separator: true },
      { label: '선택한 영역 재생하기', action: () => this.playSelectedRegion(region) },
      { separator: true },
      { label: '타임코드 알아내기', action: () => this.showTimecode(region) }
    ];

    menuItems.forEach(item => {
      if (item.separator) {
        const sep = document.createElement('div');
        sep.className = 'context-menu-separator';
        menu.appendChild(sep);
      } else {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item';
        menuItem.textContent = item.label;
        menuItem.addEventListener('click', (e) => {
          e.stopPropagation();
          item.action();
          menu.remove();
        });
        menu.appendChild(menuItem);
      }
    });

    document.body.appendChild(menu);

    // Adjust position if menu goes off screen
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      menu.style.left = (x - rect.width) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
      menu.style.top = (y - rect.height) + 'px';
    }
  }

  addTextAtRegion(region) {
    const text = prompt('자막 텍스트를 입력하세요:');
    if (!text) return;

    this.saveHistory();

    const newPara = new Paragraph();
    newPara.startTime = new TimeCode(region.startTime * 1000);
    newPara.endTime = new TimeCode(region.endTime * 1000);
    newPara.text = text;

    // Insert at correct position
    const insertIndex = this.subtitle.paragraphs.findIndex(p => p.startTime.totalSeconds > region.startTime);
    if (insertIndex >= 0) {
      this.subtitle.paragraphs.splice(insertIndex, 0, newPara);
    } else {
      this.subtitle.paragraphs.push(newPara);
    }

    this.subtitle.renumber();
    this.renderSubtitles();

    // Update waveform
    if (this.waveformViewer) {
      this.waveformViewer.setSubtitles(this.subtitle.paragraphs);
      this.waveformViewer.selectedRegion = null;
      this.waveformViewer.render();
    }

    this.updateStatusBar('새 자막이 추가되었습니다');
  }

  goToPreviousSubtitle() {
    // Find subtitle before the selected region
    if (!this.waveformViewer || !this.waveformViewer.selectedRegion) {
      // No region selected, use current index
      if (this.selectedIndex > 0) {
        this.selectSubtitle(this.selectedIndex - 1);
      }
      return;
    }

    const regionStartTime = this.waveformViewer.selectedRegion.startTime;

    // Find last subtitle that ends before region start
    for (let i = this.subtitle.paragraphs.length - 1; i >= 0; i--) {
      if (this.subtitle.paragraphs[i].endTime.totalSeconds <= regionStartTime) {
        this.selectSubtitle(i);
        return;
      }
    }

    // No subtitle found before region
    this.updateStatusBar('이전 자막이 없습니다');
  }

  goToNextSubtitle() {
    // Find subtitle after the selected region
    if (!this.waveformViewer || !this.waveformViewer.selectedRegion) {
      // No region selected, use current index
      if (this.selectedIndex < this.subtitle.paragraphs.length - 1) {
        this.selectSubtitle(this.selectedIndex + 1);
      }
      return;
    }

    const regionEndTime = this.waveformViewer.selectedRegion.endTime;

    // Find first subtitle that starts after region end
    for (let i = 0; i < this.subtitle.paragraphs.length; i++) {
      if (this.subtitle.paragraphs[i].startTime.totalSeconds >= regionEndTime) {
        this.selectSubtitle(i);
        return;
      }
    }

    // No subtitle found after region
    this.updateStatusBar('다음 자막이 없습니다');
  }

  playSelectedRegion(region) {
    if (!this.videoPlayer) {
      alert('비디오를 먼저 로드하세요');
      return;
    }

    this.videoPlayer.seek(region.startTime);
    this.videoPlayer.play();

    // Stop at end of region
    const checkTime = setInterval(() => {
      if (this.videoPlayer.getCurrentTime() >= region.endTime) {
        this.videoPlayer.pause();
        clearInterval(checkTime);
      }
    }, 100);
  }

  showTimecode(region) {
    const startStr = new TimeCode(region.startTime * 1000).toString();
    const endStr = new TimeCode(region.endTime * 1000).toString();
    const duration = (region.endTime - region.startTime).toFixed(3);

    alert(`선택한 영역 타임코드:\n\n시작: ${startStr}\n종료: ${endStr}\n길이: ${duration}초`);
  }

  async loadDefaultFiles() {
    try {
      // Load default subtitle file
      const subtitleResponse = await fetch('/samples/default.srt');
      if (subtitleResponse.ok) {
        const text = await subtitleResponse.text();
        const lines = text.split(/\r?\n/);

        const format = formatRegistry.detectFormat(lines, 'default.srt');
        if (format) {
          this.subtitle = new Subtitle();
          format.loadSubtitle(this.subtitle, lines, 'default.srt');
          this.currentFormat = format;
          this.fileName = 'c.srt';

          this.renderSubtitles();
          this.saveHistory(); // Save initial state
          this.updateStatusBar(`${this.subtitle.paragraphs.length}개 자막을 불러왔습니다 (기본 파일)`);
          console.log('Default subtitle loaded:', this.subtitle.paragraphs.length);
        } else {
          console.error('Failed to detect subtitle format');
        }
      } else {
        console.error('Failed to fetch subtitle file:', subtitleResponse.status);
      }

      // Load default video file from URL (no fetch for large files)
      const videoUrl = '/samples/default.mp4';
      console.log('Loading video from:', videoUrl);

      // Remove placeholder content
      const container = document.getElementById('videoPlayerContainer');
      container.innerHTML = ''; // Clear placeholder
      container.classList.remove('video-placeholder');

      // Initialize video player
      if (!this.videoPlayer) {
        console.log('Video container:', container);
        this.videoPlayer = new VideoPlayer(container);
        this.videoPlayer.onTimeUpdate = (time) => {
          // Update waveform
          if (this.waveformViewer) {
            this.waveformViewer.setCurrentTime(time);
          }

          // Auto-select current subtitle during playback
          this.updateCurrentSubtitle(time);
        };
      }

      console.log('Loading video from URL...');
      const videoElement = this.videoPlayer.loadVideoFromUrl(videoUrl);

      // Wait for video metadata to load
      await new Promise((resolve) => {
        if (videoElement.readyState >= 1) {
          resolve();
        } else {
          videoElement.addEventListener('loadedmetadata', resolve, { once: true });
        }
      });

      console.log('Video metadata loaded, duration:', videoElement.duration);
      this.videoPlayer.setSubtitles(this.subtitle.paragraphs);

      // Initialize waveform viewer
      if (!this.waveformViewer) {
        const container = document.getElementById('waveformContainer');
        this.waveformViewer = new WaveformViewer(container);

        // Seek callback - when clicking on waveform
        this.waveformViewer.onSeek = (time) => {
          if (this.videoPlayer) {
            this.videoPlayer.seek(time);
          }
        };

        // Subtitle changed callback - when dragging subtitle block edges
        this.waveformViewer.onSubtitleChanged = (index) => {
          // Update subtitle in main list
          this.saveHistory();
          this.renderSubtitles();

          // Update text editor fields with new values
          const para = this.subtitle.paragraphs[index];
          if (para) {
            document.getElementById('startTime').value = para.startTime.toString();
            document.getElementById('duration').value = para.duration.totalSeconds.toFixed(3);
          }

          this.updateStatusBar(`자막 #${index + 1} 시간 조정됨`);
        };

        // Subtitle selected callback - when clicking on subtitle block
        this.waveformViewer.onSubtitleSelected = (index) => {
          this.selectSubtitle(index);
        };

        // Region context menu callback - when right-clicking on selected region
        this.waveformViewer.onRegionContextMenu = (x, y, region) => {
          this.showWaveformRegionMenu(x, y, region);
        };
      }

      // Load waveform data
      console.log('Loading waveform from video...');

      // Load pre-generated waveform data
      try {
        const loaded = await this.waveformViewer.loadAudioFromUrl(videoUrl);
        if (loaded) {
          console.log('✅ Waveform audio data loaded');
        } else {
          console.warn('⚠️ Could not load waveform audio data, using video element duration only');
          await this.waveformViewer.loadAudioFromVideo(videoElement);
        }
      } catch (error) {
        console.error('❌ Waveform loading error:', error);
        await this.waveformViewer.loadAudioFromVideo(videoElement);
      }

      this.waveformViewer.setSubtitles(this.subtitle.paragraphs);

      console.log('Video and subtitle loaded successfully');
      console.log('VideoPlayer initialized:', !!this.videoPlayer);
      console.log('WaveformViewer initialized:', !!this.waveformViewer);
      console.log('Video duration:', this.videoPlayer.getDuration());
      console.log('Waveform duration:', this.waveformViewer.duration);
      this.updateStatusBar('비디오 및 자막 파일이 로드되었습니다');

    } catch (error) {
      console.error('Failed to load default files:', error);
      this.updateStatusBar('기본 파일을 불러올 수 없습니다');
    }
  }
}

// Initialize
new SubtitleEdit();
