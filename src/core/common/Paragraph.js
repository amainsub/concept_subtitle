/**
 * Paragraph class - represents a single subtitle entry
 * Ported from C# SubtitleEdit Paragraph.cs
 */
import { TimeCode } from './TimeCode.js';
import { v4 as uuidv4 } from '../../utils/uuid.js';

export class Paragraph {
  /**
   * @param {TimeCode|object} startTimeOrOptions
   * @param {TimeCode} endTime
   * @param {string} text
   */
  constructor(startTimeOrOptions, endTime, text) {
    // Support multiple constructor signatures
    if (startTimeOrOptions instanceof Paragraph) {
      // Copy constructor
      const generateNewId = endTime !== false; // Default true, unless explicitly false
      this._copyFrom(startTimeOrOptions, generateNewId);
    } else if (typeof startTimeOrOptions === 'object' && !(startTimeOrOptions instanceof TimeCode)) {
      // Object initialization
      const options = startTimeOrOptions;
      this.number = options.number || 0;
      this.text = options.text || '';
      this.startTime = options.startTime || new TimeCode();
      this.endTime = options.endTime || new TimeCode();
      this.forced = options.forced || false;
      this.extra = options.extra || '';
      this.isComment = options.isComment || false;
      this.actor = options.actor || '';
      this.region = options.region || '';
      this.marginL = options.marginL || '';
      this.marginR = options.marginR || '';
      this.marginV = options.marginV || '';
      this.effect = options.effect || '';
      this.layer = options.layer || 0;
      this.id = options.id || this._generateId();
      this.language = options.language || '';
      this.style = options.style || '';
      this.newSection = options.newSection || false;
      this.bookmark = options.bookmark || '';
    } else {
      // Standard constructor
      this.number = 0;
      this.text = text || '';
      this.startTime = startTimeOrOptions || new TimeCode();
      this.endTime = endTime || new TimeCode();
      this.forced = false;
      this.extra = '';
      this.isComment = false;
      this.actor = '';
      this.region = '';
      this.marginL = '';
      this.marginR = '';
      this.marginV = '';
      this.effect = '';
      this.layer = 0;
      this.id = this._generateId();
      this.language = '';
      this.style = '';
      this.newSection = false;
      this.bookmark = '';
    }
  }

  /**
   * Copy from another paragraph
   * @private
   */
  _copyFrom(paragraph, generateNewId = true) {
    this.number = paragraph.number;
    this.text = paragraph.text;
    this.startTime = new TimeCode(paragraph.startTime.totalMilliseconds);
    this.endTime = new TimeCode(paragraph.endTime.totalMilliseconds);
    this.forced = paragraph.forced;
    this.extra = paragraph.extra;
    this.isComment = paragraph.isComment;
    this.actor = paragraph.actor;
    this.region = paragraph.region;
    this.marginL = paragraph.marginL;
    this.marginR = paragraph.marginR;
    this.marginV = paragraph.marginV;
    this.effect = paragraph.effect;
    this.layer = paragraph.layer;
    this.id = generateNewId ? this._generateId() : paragraph.id;
    this.language = paragraph.language;
    this.style = paragraph.style;
    this.newSection = paragraph.newSection;
    this.bookmark = paragraph.bookmark;
  }

  /**
   * Generate unique ID
   * @private
   * @returns {string}
   */
  _generateId() {
    return uuidv4();
  }

  /**
   * Get duration as TimeCode
   * @returns {TimeCode}
   */
  get duration() {
    return new TimeCode(this.endTime.totalMilliseconds - this.startTime.totalMilliseconds);
  }

  /**
   * Get duration in milliseconds
   * @returns {number}
   */
  get durationTotalMilliseconds() {
    return this.endTime.totalMilliseconds - this.startTime.totalMilliseconds;
  }

  /**
   * Get duration in seconds
   * @returns {number}
   */
  get durationTotalSeconds() {
    return (this.endTime.totalMilliseconds - this.startTime.totalMilliseconds) / TimeCode.BASE_UNIT;
  }

  /**
   * Check if this is a default/empty paragraph
   * @returns {boolean}
   */
  get isDefault() {
    return (
      Math.abs(this.startTime.totalMilliseconds) < 0.01 &&
      Math.abs(this.endTime.totalMilliseconds) < 0.01 &&
      (!this.text || this.text.trim() === '')
    );
  }

  /**
   * Get number of lines
   * @returns {number}
   */
  get numberOfLines() {
    if (!this.text) return 0;
    return (this.text.match(/\n/g) || []).length + 1;
  }

  /**
   * Get words per minute (reading speed)
   * @returns {number}
   */
  get wordsPerMinute() {
    if (!this.text || this.durationTotalSeconds === 0) {
      return 0;
    }
    const wordCount = this._countWords(this.text);
    return (60.0 / this.durationTotalSeconds) * wordCount;
  }

  /**
   * Count words in text
   * @private
   * @param {string} text
   * @returns {number}
   */
  _countWords(text) {
    if (!text) return 0;
    // Remove HTML tags
    const cleanText = text.replace(/<[^>]+>/g, '');
    // Split by whitespace and filter non-empty
    const words = cleanText.trim().split(/\s+/).filter(w => w.length > 0);
    return words.length;
  }

  /**
   * Count characters (excluding HTML tags and formatting)
   * @private
   * @param {string} text
   * @param {boolean} includeFormatting - Include formatting characters
   * @returns {number}
   */
  _countCharacters(text, includeFormatting = false) {
    if (!text) return 0;

    let cleanText = text;
    if (!includeFormatting) {
      // Remove HTML tags
      cleanText = cleanText.replace(/<[^>]+>/g, '');
      // Remove common formatting (italic markers, etc.)
      cleanText = cleanText.replace(/[<>{}\[\]]/g, '');
    }

    // Remove line breaks for character count (don't replace with space, just remove)
    cleanText = cleanText.replace(/\r?\n/g, '');

    return cleanText.length;
  }

  /**
   * Get characters per second (reading speed)
   * @returns {number}
   */
  getCharactersPerSecond() {
    if (this.durationTotalMilliseconds < 1) {
      return 999;
    }
    return this._countCharacters(this.text, true) / this.durationTotalSeconds;
  }

  /**
   * Adjust timing (scale and shift)
   * @param {number} factor - Scale factor
   * @param {number} adjustmentInSeconds - Shift amount in seconds
   */
  adjust(factor, adjustmentInSeconds) {
    if (this.startTime.isMaxTime) {
      return;
    }

    this.startTime.totalMilliseconds =
      this.startTime.totalMilliseconds * factor + adjustmentInSeconds * TimeCode.BASE_UNIT;
    this.endTime.totalMilliseconds =
      this.endTime.totalMilliseconds * factor + adjustmentInSeconds * TimeCode.BASE_UNIT;
  }

  /**
   * Clone this paragraph
   * @param {boolean} generateNewId
   * @returns {Paragraph}
   */
  clone(generateNewId = true) {
    return new Paragraph(this, generateNewId);
  }

  /**
   * Convert to string
   * @returns {string}
   */
  toString() {
    return `${this.startTime.toString()} --> ${this.endTime.toString()} ${this.text}`;
  }

  /**
   * Serialize to JSON
   * @returns {object}
   */
  toJSON() {
    return {
      number: this.number,
      text: this.text,
      startTime: this.startTime.totalMilliseconds,
      endTime: this.endTime.totalMilliseconds,
      forced: this.forced,
      extra: this.extra,
      isComment: this.isComment,
      actor: this.actor,
      region: this.region,
      marginL: this.marginL,
      marginR: this.marginR,
      marginV: this.marginV,
      effect: this.effect,
      layer: this.layer,
      id: this.id,
      language: this.language,
      style: this.style,
      newSection: this.newSection,
      bookmark: this.bookmark,
    };
  }

  /**
   * Deserialize from JSON
   * @param {object} json
   * @returns {Paragraph}
   */
  static fromJSON(json) {
    return new Paragraph({
      number: json.number,
      text: json.text,
      startTime: new TimeCode(json.startTime),
      endTime: new TimeCode(json.endTime),
      forced: json.forced,
      extra: json.extra,
      isComment: json.isComment,
      actor: json.actor,
      region: json.region,
      marginL: json.marginL,
      marginR: json.marginR,
      marginV: json.marginV,
      effect: json.effect,
      layer: json.layer,
      id: json.id,
      language: json.language,
      style: json.style,
      newSection: json.newSection,
      bookmark: json.bookmark,
    });
  }
}
