/**
 * Subtitle class - represents a complete subtitle document
 * Ported from C# SubtitleEdit Subtitle.cs
 */
import { Paragraph } from './Paragraph.js';

export class Subtitle {
  static MAX_FILE_SIZE = 1024 * 1024 * 20; // 20 MB
  static MAXIMUM_HISTORY_ITEMS = 100;

  /**
   * @param {Array<Paragraph>|Subtitle} paragraphsOrSubtitle
   * @param {boolean} generateNewId - For copy constructor
   */
  constructor(paragraphsOrSubtitle, generateNewId = true) {
    if (paragraphsOrSubtitle instanceof Subtitle) {
      // Copy constructor
      this._copyFrom(paragraphsOrSubtitle, generateNewId);
    } else {
      // Standard constructor
      this.paragraphs = Array.isArray(paragraphsOrSubtitle) ? paragraphsOrSubtitle : [];
      this.header = '';
      this.footer = '';
      this.fileName = 'Untitled';
      this.originalFormat = null;
      this.originalEncoding = 'utf-8';
      this.historyItems = [];
    }
  }

  /**
   * Copy from another subtitle
   * @private
   */
  _copyFrom(subtitle, generateNewId) {
    this.paragraphs = subtitle.paragraphs.map(p => new Paragraph(p, generateNewId));
    this.header = subtitle.header;
    this.footer = subtitle.footer;
    this.fileName = subtitle.fileName;
    this.originalFormat = subtitle.originalFormat;
    this.originalEncoding = subtitle.originalEncoding;
    this.historyItems = []; // Don't copy history
  }

  /**
   * Get paragraph by index (safe)
   * @param {number} index
   * @returns {Paragraph|null}
   */
  getParagraphOrDefault(index) {
    if (!this.paragraphs || index < 0 || index >= this.paragraphs.length) {
      return null;
    }
    return this.paragraphs[index];
  }

  /**
   * Get paragraph by ID
   * @param {string} id
   * @returns {Paragraph|null}
   */
  getParagraphOrDefaultById(id) {
    return this.paragraphs.find(p => p.id === id) || null;
  }

  /**
   * Add paragraph
   * @param {Paragraph} paragraph
   */
  addParagraph(paragraph) {
    this.paragraphs.push(paragraph);
  }

  /**
   * Insert paragraph at index
   * @param {number} index
   * @param {Paragraph} paragraph
   */
  insertParagraph(index, paragraph) {
    this.paragraphs.splice(index, 0, paragraph);
  }

  /**
   * Remove paragraph at index
   * @param {number} index
   */
  removeParagraphAt(index) {
    if (index >= 0 && index < this.paragraphs.length) {
      this.paragraphs.splice(index, 1);
    }
  }

  /**
   * Remove paragraph
   * @param {Paragraph} paragraph
   */
  removeParagraph(paragraph) {
    const index = this.paragraphs.indexOf(paragraph);
    if (index >= 0) {
      this.paragraphs.splice(index, 1);
    }
  }

  /**
   * Clear all paragraphs
   */
  clear() {
    this.paragraphs = [];
  }

  /**
   * Get number of paragraphs
   * @returns {number}
   */
  get length() {
    return this.paragraphs.length;
  }

  /**
   * Renumber paragraphs sequentially
   * @param {number} startNumber - Starting number (default 1)
   */
  renumber(startNumber = 1) {
    let num = startNumber;
    for (const p of this.paragraphs) {
      p.number = num++;
    }
  }

  /**
   * Sort paragraphs by start time
   */
  sort() {
    this.paragraphs.sort((a, b) => a.startTime.totalMilliseconds - b.startTime.totalMilliseconds);
  }

  /**
   * Add time to all paragraphs
   * @param {number} milliseconds
   */
  addTimeToAllParagraphs(milliseconds) {
    for (const p of this.paragraphs) {
      if (!p.startTime.isMaxTime) {
        p.startTime.totalMilliseconds += milliseconds;
        p.endTime.totalMilliseconds += milliseconds;
      }
    }
  }

  /**
   * Adjust all times (scale and shift)
   * @param {number} factor - Scale factor
   * @param {number} adjustmentInSeconds - Shift in seconds
   */
  adjustAllTimes(factor, adjustmentInSeconds) {
    for (const p of this.paragraphs) {
      p.adjust(factor, adjustmentInSeconds);
    }
  }

  /**
   * Change frame rate
   * @param {number} oldFrameRate
   * @param {number} newFrameRate
   */
  changeFrameRate(oldFrameRate, newFrameRate) {
    if (oldFrameRate === 0 || newFrameRate === 0 || oldFrameRate === newFrameRate) {
      return;
    }

    const factor = oldFrameRate / newFrameRate;
    for (const p of this.paragraphs) {
      p.startTime.totalMilliseconds *= factor;
      p.endTime.totalMilliseconds *= factor;
    }
  }

  /**
   * Check if can undo
   * @returns {boolean}
   */
  get canUndo() {
    return this.historyItems.length > 0;
  }

  /**
   * Save current state to history
   * @param {string} description - Description of the action
   */
  saveToHistory(description = '') {
    const historyItem = {
      description,
      timestamp: Date.now(),
      paragraphs: this.paragraphs.map(p => p.toJSON()),
      header: this.header,
      footer: this.footer,
    };

    this.historyItems.push(historyItem);

    // Limit history size
    if (this.historyItems.length > Subtitle.MAXIMUM_HISTORY_ITEMS) {
      this.historyItems.shift(); // Remove oldest
    }
  }

  /**
   * Undo last action
   * @returns {boolean} True if undo was performed
   */
  undo() {
    if (!this.canUndo) {
      return false;
    }

    const historyItem = this.historyItems.pop();
    this.paragraphs = historyItem.paragraphs.map(json => Paragraph.fromJSON(json));
    this.header = historyItem.header;
    this.footer = historyItem.footer;

    return true;
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.historyItems = [];
  }

  /**
   * Get total duration
   * @returns {number} Total milliseconds
   */
  getTotalDuration() {
    if (this.paragraphs.length === 0) {
      return 0;
    }

    const last = this.paragraphs[this.paragraphs.length - 1];
    return last.endTime.totalMilliseconds;
  }

  /**
   * Get statistics
   * @returns {object}
   */
  getStatistics() {
    if (this.paragraphs.length === 0) {
      return {
        numberOfLines: 0,
        numberOfWords: 0,
        numberOfCharacters: 0,
        totalDuration: 0,
        averageCPS: 0,
        averageWPM: 0,
      };
    }

    let totalWords = 0;
    let totalChars = 0;
    let totalDuration = 0;

    for (const p of this.paragraphs) {
      totalWords += p._countWords(p.text);
      totalChars += p._countCharacters(p.text, true);
      totalDuration += p.durationTotalMilliseconds;
    }

    const totalSeconds = totalDuration / 1000;
    const averageCPS = totalSeconds > 0 ? totalChars / totalSeconds : 0;
    const averageWPM = totalSeconds > 0 ? (totalWords / totalSeconds) * 60 : 0;

    return {
      numberOfLines: this.paragraphs.length,
      numberOfWords: totalWords,
      numberOfCharacters: totalChars,
      totalDuration: this.getTotalDuration(),
      averageCPS,
      averageWPM,
    };
  }

  /**
   * Clone this subtitle
   * @param {boolean} generateNewId
   * @returns {Subtitle}
   */
  clone(generateNewId = true) {
    return new Subtitle(this, generateNewId);
  }

  /**
   * Convert to text format
   * @param {SubtitleFormat} format - Format to export to
   * @returns {string}
   */
  toText(format) {
    if (!format) {
      throw new Error('Format is required');
    }
    return format.toText(this);
  }

  /**
   * Serialize to JSON
   * @returns {object}
   */
  toJSON() {
    return {
      paragraphs: this.paragraphs.map(p => p.toJSON()),
      header: this.header,
      footer: this.footer,
      fileName: this.fileName,
      originalFormat: this.originalFormat?.name || null,
      originalEncoding: this.originalEncoding,
    };
  }

  /**
   * Deserialize from JSON
   * @param {object} json
   * @returns {Subtitle}
   */
  static fromJSON(json) {
    const subtitle = new Subtitle();
    subtitle.paragraphs = (json.paragraphs || []).map(p => Paragraph.fromJSON(p));
    subtitle.header = json.header || '';
    subtitle.footer = json.footer || '';
    subtitle.fileName = json.fileName || 'Untitled';
    subtitle.originalEncoding = json.originalEncoding || 'utf-8';
    // originalFormat will need to be resolved separately
    return subtitle;
  }

  /**
   * Parse subtitle from text lines
   * @param {Array<string>} lines
   * @param {string} fileName
   * @param {Array<SubtitleFormat>} formats - Formats to try
   * @returns {Subtitle|null}
   */
  static parse(lines, fileName, formats = []) {
    const subtitle = new Subtitle();

    // Try provided formats first
    for (const format of formats) {
      if (format.isMine(lines, fileName)) {
        format.loadSubtitle(subtitle, lines, fileName);
        subtitle.originalFormat = format;
        return subtitle;
      }
    }

    // Try all registered formats
    // (This will be implemented when we add the format registry)

    return null;
  }

  /**
   * Load subtitle from string
   * @param {string} content
   * @param {string} fileName
   * @param {Array<SubtitleFormat>} formats
   * @returns {Subtitle|null}
   */
  static loadFromString(content, fileName, formats = []) {
    const lines = content.split(/\r?\n/);
    return Subtitle.parse(lines, fileName, formats);
  }
}
