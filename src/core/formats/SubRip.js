/**
 * SubRip format (.srt) - Most popular subtitle format
 * Ported from C# SubtitleEdit SubRip.cs
 *
 * Format:
 * 1
 * 00:00:01,000 --> 00:00:03,000
 * This is the first subtitle
 *
 * 2
 * 00:00:05,000 --> 00:00:07,000
 * This is the second subtitle
 */
import { SubtitleFormat } from './SubtitleFormat.js';
import { Paragraph } from '../common/Paragraph.js';
import { TimeCode } from '../common/TimeCode.js';

const ExpectingLine = {
  NUMBER: 'number',
  TIMECODES: 'timecodes',
  TEXT: 'text',
};

export class SubRip extends SubtitleFormat {
  constructor() {
    super();
    this.errors = '';
    this._errorMessages = [];
    this._lineNumber = 0;
    this._paragraph = null;
    this._lastParagraph = null;
    this._expecting = ExpectingLine.NUMBER;
  }

  get extension() {
    return '.srt';
  }

  get name() {
    return 'SubRip';
  }

  get alternateExtensions() {
    return ['.wsrt'];
  }

  /**
   * Check if this format matches the content
   * @param {Array<string>} lines
   * @param {string} fileName
   * @returns {boolean}
   */
  isMine(lines, fileName) {
    // WebVTT files might look similar, exclude them
    if (lines.length > 0 && lines[0].toUpperCase().startsWith('WEBVTT')) {
      return false;
    }

    // Try to parse
    const subtitle = { paragraphs: [] };
    this.loadSubtitle(subtitle, lines, fileName);
    this.errors = '';

    return subtitle.paragraphs.length > this._errorCount;
  }

  /**
   * Convert subtitle to SubRip text format
   * @param {Subtitle} subtitle
   * @param {string} title
   * @returns {string}
   */
  toText(subtitle, title = '') {
    const lines = [];

    for (const p of subtitle.paragraphs) {
      lines.push(p.number.toString());

      // Handle both TimeCode objects and plain objects
      const startStr = p.startTime.toSubRipString ?
        p.startTime.toSubRipString() :
        new TimeCode(p.startTime.totalMilliseconds).toSubRipString();
      const endStr = p.endTime.toSubRipString ?
        p.endTime.toSubRipString() :
        new TimeCode(p.endTime.totalMilliseconds).toSubRipString();

      lines.push(`${startStr} --> ${endStr}`);
      lines.push(p.text);
      lines.push(''); // Empty line between subtitles
    }

    return lines.join('\n').trim() + '\n\n';
  }

  /**
   * Load subtitle from lines
   * @param {Subtitle} subtitle
   * @param {Array<string>} lines
   * @param {string} fileName
   */
  loadSubtitle(subtitle, lines, fileName) {
    let doRenumber = false;
    this._errorMessages = [];
    this._lineNumber = 0;
    this._paragraph = new Paragraph();
    this._lastParagraph = null;
    this._expecting = ExpectingLine.NUMBER;
    this._errorCount = 0;

    subtitle.paragraphs = [];

    let line = '';
    let next = lines.length > 0 ? lines[0].trimEnd() : '';
    let nextNext = lines.length > 1 ? lines[1].trimEnd() : '';

    for (let i = 0; i < lines.length; i++) {
      this._lineNumber++;
      line = next;
      next = nextNext;
      nextNext = (i + 2 < lines.length) ? lines[i + 2].trimEnd() : '';

      // Check if we're missing a separator between paragraphs (buggy file)
      if (this._expecting === ExpectingLine.TEXT &&
          i + 1 < lines.length &&
          this._paragraph?.text &&
          this._isInteger(line) &&
          this._tryReadTimeCodesLine(next, null)) {

        if (this._paragraph.text) {
          subtitle.paragraphs.push(this._paragraph);
          this._lastParagraph = this._paragraph;
          this._paragraph = new Paragraph();
        }
        this._expecting = ExpectingLine.NUMBER;
      }

      // Sometimes number line is missing
      if (this._expecting === ExpectingLine.NUMBER && this._tryReadTimeCodesLine(line, null)) {
        this._expecting = ExpectingLine.TIMECODES;
        doRenumber = true;
      } else if (this._paragraph?.text &&
                 this._expecting === ExpectingLine.TEXT &&
                 this._tryReadTimeCodesLine(line, null)) {
        subtitle.paragraphs.push(this._paragraph);
        this._lastParagraph = this._paragraph;
        this._paragraph = new Paragraph();
        this._expecting = ExpectingLine.TIMECODES;
        doRenumber = true;
      }

      this._readLine(subtitle, line, next, nextNext);
    }

    // Add last paragraph if valid
    if (this._paragraph && !this._paragraph.isDefault) {
      subtitle.paragraphs.push(this._paragraph);
    }

    // Renumber if needed
    if (doRenumber) {
      let num = 1;
      for (const p of subtitle.paragraphs) {
        p.number = num++;
      }
    }

    // Clean up text - trim only trailing whitespace
    for (const p of subtitle.paragraphs) {
      if (p.text) {
        p.text = p.text.trimEnd();
      }
    }

    this.errors = this._errorMessages.join('\n');
  }

  /**
   * Read a single line based on current state
   * @private
   */
  _readLine(subtitle, line, next, nextNext) {
    switch (this._expecting) {
      case ExpectingLine.NUMBER:
        const number = parseInt(line.trim(), 10);
        if (!isNaN(number) && line.trim() === number.toString()) {
          this._paragraph.number = number;
          this._expecting = ExpectingLine.TIMECODES;
        } else if (line.trim() !== '') {
          // If last paragraph exists and next line looks like a number,
          // this might be continuation of previous text
          if (this._lastParagraph && nextNext &&
              (this._lastParagraph.number + 1).toString() === nextNext.trim()) {
            this._lastParagraph.text = (this._lastParagraph.text + '\n' + line).trimEnd();
          } else {
            if (this._errorMessages.length < 100) {
              this._errorMessages.push(`Line ${this._lineNumber}: Expected number, got: ${line}`);
            }
            this._errorCount++;
          }
        }
        break;

      case ExpectingLine.TIMECODES:
        if (this._tryReadTimeCodesLine(line, this._paragraph)) {
          this._paragraph.text = '';
          this._expecting = ExpectingLine.TEXT;
        } else if (line.trim() !== '') {
          if (this._errorMessages.length < 100) {
            this._errorMessages.push(`Line ${this._lineNumber}: Error reading timecode: ${line}`);
          }
          this._errorCount++;
          this._expecting = ExpectingLine.NUMBER; // Skip to next paragraph
        }
        break;

      case ExpectingLine.TEXT:
        // Check if this looks like the start of next subtitle
        if (this._isInteger(line.trim()) &&
            (this._tryReadTimeCodesLine(next, null) ||
             (next.trim() === '' && this._tryReadTimeCodesLine(nextNext, null)))) {
          // End current paragraph
          subtitle.paragraphs.push(this._paragraph);
          this._lastParagraph = this._paragraph;
          this._paragraph = new Paragraph();
          this._expecting = ExpectingLine.NUMBER;

          const num = parseInt(line.trim(), 10);
          if (!isNaN(num)) {
            this._paragraph.number = num;
            this._expecting = ExpectingLine.TIMECODES;
          }
        } else if (line.trim() === '' && this._paragraph.text === '') {
          // Skip empty lines before text
        } else if (line.trim() === '' && this._paragraph.text !== '') {
          // Empty line after text - end of subtitle
          subtitle.paragraphs.push(this._paragraph);
          this._lastParagraph = this._paragraph;
          this._paragraph = new Paragraph();
          this._expecting = ExpectingLine.NUMBER;
        } else {
          // Add text line (preserve leading whitespace)
          if (this._paragraph.text) {
            this._paragraph.text += '\n' + line;
          } else {
            this._paragraph.text = line;
          }
        }
        break;
    }
  }

  /**
   * Try to read timecodes line (format: 00:00:01,000 --> 00:00:03,000)
   * @private
   * @param {string} line
   * @param {Paragraph|null} paragraph - If provided, set its times
   * @returns {boolean}
   */
  _tryReadTimeCodesLine(line, paragraph) {
    if (!line || !line.includes('-->')) {
      return false;
    }

    const parts = line.split('-->');
    if (parts.length !== 2) {
      return false;
    }

    const startString = parts[0].trim();
    const endString = parts[1].trim().split(/\s+/)[0]; // Remove any trailing position info

    try {
      const startMs = TimeCode.parseToMilliseconds(startString);
      const endMs = TimeCode.parseToMilliseconds(endString);

      if (startMs === 0 && endMs === 0 && startString !== '00:00:00,000') {
        return false; // Invalid parse
      }

      if (paragraph) {
        paragraph.startTime = new TimeCode(startMs);
        paragraph.endTime = new TimeCode(endMs);
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Check if string is integer
   * @private
   */
  _isInteger(str) {
    if (!str) return false;
    const num = parseInt(str.trim(), 10);
    return !isNaN(num) && num.toString() === str.trim();
  }
}
