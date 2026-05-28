/**
 * Subtitle Edit Web - Complete Implementation (Phase 1-4)
 */
import './style.css';
import { Subtitle } from './core/common/Subtitle.js';
import { Paragraph } from './core/common/Paragraph.js';
import { TimeCode } from './core/common/TimeCode.js';
import { formatRegistry } from './core/formats/index.js';
import { readFileWithEncoding, getFriendlyEncodingName } from './utils/encoding.js';
import {
  hasKorean,
  checkKoreanReadingSpeed,
  autoBreakKoreanLines,
  checkKoreanSpelling,
} from './utils/korean.js';

class SubtitleEditor {
  constructor() {
    this.subtitle = new Subtitle();
    this.currentFormat = null;
    this.fileName = 'untitled.srt';
    this.selectedIndex = undefined;
    this.encoding = 'UTF-8';
    this.history = [];

    this.initUI();
    this.attachEventListeners();
    this.updateStats();
  }

  initUI() {
    document.querySelector('#app').innerHTML = `
      <div class="container">
        <header>
          <h1>🎬 Subtitle Edit Web</h1>
          <p>웹 기반 자막 편집기 - Phase 1 Demo</p>
        </header>

        <div class="toolbar">
          <input type="file" id="fileInput" accept=".srt,.vtt,.webvtt,.ass,.ssa,.smi,.sub,.xml,.json" style="display: none">
          <button id="openBtn" class="btn btn-primary">📁 파일 열기</button>
          <button id="saveBtn" class="btn btn-success">💾 저장</button>
          <button id="addBtn" class="btn">➕ 자막 추가</button>
          <button id="deleteBtn" class="btn btn-danger">🗑️ 삭제</button>
          <select id="formatSelect" class="format-select">
            <option value="SubRip">SubRip (.srt)</option>
            <option value="WebVTT">WebVTT (.vtt)</option>
            <option value="Advanced SubStation Alpha">Advanced SubStation Alpha (.ass)</option>
            <option value="Sub Station Alpha">Sub Station Alpha (.ssa)</option>
            <option value="SAMI">SAMI (.smi)</option>
            <option value="MicroDVD">MicroDVD (.sub)</option>
            <option value="Timed Text 1.0">Timed Text 1.0 / DFXP (.xml)</option>
            <option value="JSON Subtitle">JSON Subtitle (.json)</option>
          </select>
        </div>

        <div class="stats">
          <span id="subtitleCount">0개 자막</span>
          <span id="fileName">파일: untitled.srt</span>
        </div>

        <div class="editor-container">
          <div class="subtitle-list">
            <table id="subtitleTable">
              <thead>
                <tr>
                  <th>#</th>
                  <th>시작 시간</th>
                  <th>종료 시간</th>
                  <th>텍스트</th>
                </tr>
              </thead>
              <tbody id="subtitleTableBody">
                <!-- Subtitles will be rendered here -->
              </tbody>
            </table>
          </div>

          <div class="text-editor" id="textEditor">
            <h3>텍스트 편집</h3>
            <div class="editor-controls">
              <input type="text" id="startTimeInput" placeholder="00:00:00,000">
              <span>→</span>
              <input type="text" id="endTimeInput" placeholder="00:00:03,000">
            </div>
            <textarea id="textInput" rows="5" placeholder="자막 텍스트를 입력하세요"></textarea>
            <button id="updateBtn" class="btn btn-primary">✓ 업데이트</button>
          </div>
        </div>

        <div class="drop-zone" id="dropZone">
          <p>📂 자막 파일을 여기에 드래그하세요</p>
          <p><small>.srt, .vtt 파일 지원</small></p>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // File operations
    document.getElementById('openBtn').addEventListener('click', () => {
      document.getElementById('fileInput').click();
    });

    document.getElementById('fileInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) this.loadFile(file);
    });

    document.getElementById('saveBtn').addEventListener('click', () => {
      this.saveFile();
    });

    // Subtitle operations
    document.getElementById('addBtn').addEventListener('click', () => {
      this.addSubtitle();
    });

    document.getElementById('deleteBtn').addEventListener('click', () => {
      this.deleteSelected();
    });

    document.getElementById('updateBtn').addEventListener('click', () => {
      this.updateCurrent();
    });

    // Drag and drop
    const dropZone = document.getElementById('dropZone');
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) this.loadFile(file);
    });

    // Table click
    document.getElementById('subtitleTableBody').addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      if (row) {
        const index = parseInt(row.dataset.index);
        this.selectSubtitle(index);
      }
    });
  }

  async loadFile(file) {
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/);

      // Detect format
      const format = formatRegistry.detectFormat(lines, file.name);

      if (!format) {
        alert('지원하지 않는 파일 형식입니다.');
        return;
      }

      // Load subtitle
      this.subtitle = new Subtitle();
      format.loadSubtitle(this.subtitle, lines, file.name);
      this.currentFormat = format;
      this.fileName = file.name;

      document.getElementById('formatSelect').value = format.name;
      this.renderSubtitles();
      this.updateStats();

      alert(`✓ ${this.subtitle.paragraphs.length}개 자막을 불러왔습니다.`);
    } catch (error) {
      console.error(error);
      alert('파일을 불러오는 중 오류가 발생했습니다: ' + error.message);
    }
  }

  saveFile() {
    try {
      const formatName = document.getElementById('formatSelect').value;
      const format = formatRegistry.getFormatByName(formatName);

      if (!format) {
        alert('형식을 선택해주세요.');
        return;
      }

      const text = format.toText(this.subtitle);
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = this.fileName.replace(/\.\w+$/, format.extension);
      a.click();

      URL.revokeObjectURL(url);

      alert('✓ 파일이 저장되었습니다.');
    } catch (error) {
      console.error(error);
      alert('저장 중 오류가 발생했습니다: ' + error.message);
    }
  }

  addSubtitle() {
    const lastPara = this.subtitle.paragraphs[this.subtitle.paragraphs.length - 1];
    const startMs = lastPara ? lastPara.endTime.totalMilliseconds + 1000 : 0;

    const para = new Paragraph();
    para.number = this.subtitle.paragraphs.length + 1;
    para.startTime = new TimeCode(startMs);
    para.endTime = new TimeCode(startMs + 3000);
    para.text = '새 자막';

    this.subtitle.addParagraph(para);
    this.renderSubtitles();
    this.updateStats();
    this.selectSubtitle(this.subtitle.paragraphs.length - 1);
  }

  deleteSelected() {
    if (this.selectedIndex !== undefined) {
      this.subtitle.removeParagraphAt(this.selectedIndex);
      this.subtitle.renumber();
      this.renderSubtitles();
      this.updateStats();
      this.selectedIndex = undefined;
    }
  }

  selectSubtitle(index) {
    this.selectedIndex = index;
    const para = this.subtitle.paragraphs[index];

    // Highlight row
    document.querySelectorAll('#subtitleTableBody tr').forEach((row, i) => {
      row.classList.toggle('selected', i === index);
    });

    // Fill editor
    document.getElementById('startTimeInput').value = para.startTime.toString();
    document.getElementById('endTimeInput').value = para.endTime.toString();
    document.getElementById('textInput').value = para.text;
  }

  updateCurrent() {
    if (this.selectedIndex === undefined) return;

    const para = this.subtitle.paragraphs[this.selectedIndex];
    const startStr = document.getElementById('startTimeInput').value;
    const endStr = document.getElementById('endTimeInput').value;
    const text = document.getElementById('textInput').value;

    para.startTime = new TimeCode(TimeCode.parseToMilliseconds(startStr));
    para.endTime = new TimeCode(TimeCode.parseToMilliseconds(endStr));
    para.text = text;

    this.renderSubtitles();
  }

  renderSubtitles() {
    const tbody = document.getElementById('subtitleTableBody');
    tbody.innerHTML = '';

    for (let i = 0; i < this.subtitle.paragraphs.length; i++) {
      const para = this.subtitle.paragraphs[i];
      const row = document.createElement('tr');
      row.dataset.index = i;
      row.innerHTML = `
        <td>${para.number}</td>
        <td>${para.startTime.toShortString()}</td>
        <td>${para.endTime.toShortString()}</td>
        <td class="text-cell">${this.escapeHtml(para.text)}</td>
      `;
      tbody.appendChild(row);
    }
  }

  updateStats() {
    document.getElementById('subtitleCount').textContent =
      `${this.subtitle.paragraphs.length}개 자막`;
    document.getElementById('fileName').textContent =
      `파일: ${this.fileName}`;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
  }
}

// Initialize app
new SubtitleEditor();
