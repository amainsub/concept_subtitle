/**
 * SubtitleFormat - Abstract base class for all subtitle format parsers
 * Ported from C# SubtitleEdit SubtitleFormat.cs
 */
import { TimeCode } from '../common/TimeCode.js';

export class SubtitleFormat {
  static DEFAULT_FRAME_RATE = 25.0;

  constructor() {
    this._errorCount = 0;
    this.batchMode = false;
    this.batchSourceFrameRate = null;
  }

  /**
   * Get format extension (e.g., ".srt")
   * @abstract
   * @returns {string}
   */
  get extension() {
    throw new Error('extension getter must be implemented by subclass');
  }

  /**
   * Get format name (e.g., "SubRip")
   * @abstract
   * @returns {string}
   */
  get name() {
    throw new Error('name getter must be implemented by subclass');
  }

  /**
   * Is this format time-based (vs frame-based)?
   * @returns {boolean}
   */
  get isTimeBased() {
    return true;
  }

  /**
   * Is this format frame-based?
   * @returns {boolean}
   */
  get isFrameBased() {
    return !this.isTimeBased;
  }

  /**
   * Friendly display name
   * @returns {string}
   */
  get friendlyName() {
    return `${this.name} (${this.extension})`;
  }

  /**
   * Does this format support styling?
   * @returns {boolean}
   */
  get hasStyleSupport() {
    return false;
  }

  /**
   * Is this a text-based format?
   * @returns {boolean}
   */
  get isTextBased() {
    return true;
  }

  /**
   * Get error count from last parse
   * @returns {number}
   */
  get errorCount() {
    return this._errorCount;
  }

  /**
   * Get alternate file extensions for this format
   * @returns {Array<string>}
   */
  get alternateExtensions() {
    return [];
  }

  /**
   * Check if this format matches the given content
   * @abstract
   * @param {Array<string>} lines
   * @param {string} fileName
   * @returns {boolean}
   */
  isMine(lines, fileName) {
    // Default implementation: try to load and check if we got more valid paragraphs than errors
    const testSubtitle = { paragraphs: [] };
    const oldErrorCount = this._errorCount;
    this._errorCount = 0;

    try {
      this.loadSubtitle(testSubtitle, lines, fileName);
      const isValid = testSubtitle.paragraphs.length > this._errorCount;
      this._errorCount = oldErrorCount;
      return isValid;
    } catch (e) {
      this._errorCount = oldErrorCount;
      return false;
    }
  }

  /**
   * Load subtitle from lines
   * @abstract
   * @param {Subtitle} subtitle
   * @param {Array<string>} lines
   * @param {string} fileName
   */
  loadSubtitle(subtitle, lines, fileName) {
    throw new Error('loadSubtitle must be implemented by subclass');
  }

  /**
   * Convert subtitle to text format
   * @abstract
   * @param {Subtitle} subtitle
   * @param {string} title
   * @returns {string}
   */
  toText(subtitle, title = '') {
    throw new Error('toText must be implemented by subclass');
  }

  /**
   * Remove format-specific styling when converting
   * @param {Subtitle} subtitle
   * @param {SubtitleFormat} newFormat
   */
  removeNativeFormatting(subtitle, newFormat) {
    // Override in subclass if needed
  }

  // --- Frame rate conversion utilities ---

  /**
   * Get frame rate adjusted for calculation (handles 23.976, 29.97, etc.)
   * @param {number} frameRate
   * @returns {number}
   */
  static getFrameForCalculation(frameRate) {
    if (Math.abs(frameRate - 23.976) < 0.001) {
      return 24000.0 / 1001.0;
    }
    if (Math.abs(frameRate - 29.97) < 0.001) {
      return 30000.0 / 1001.0;
    }
    if (Math.abs(frameRate - 59.94) < 0.001) {
      return 60000.0 / 1001.0;
    }
    return frameRate;
  }

  /**
   * Convert milliseconds to frames
   * @param {number} milliseconds
   * @param {number} frameRate
   * @returns {number}
   */
  static millisecondsToFrames(milliseconds, frameRate = SubtitleFormat.DEFAULT_FRAME_RATE) {
    return Math.round(milliseconds / (TimeCode.BASE_UNIT / SubtitleFormat.getFrameForCalculation(frameRate)));
  }

  /**
   * Convert frames to milliseconds
   * @param {number} frames
   * @param {number} frameRate
   * @returns {number}
   */
  static framesToMilliseconds(frames, frameRate = SubtitleFormat.DEFAULT_FRAME_RATE) {
    return Math.round(frames * (TimeCode.BASE_UNIT / SubtitleFormat.getFrameForCalculation(frameRate)));
  }

  /**
   * Convert frames to milliseconds, capped at 999
   * @param {number} frames
   * @param {number} frameRate
   * @returns {number}
   */
  static framesToMillisecondsMax999(frames, frameRate = SubtitleFormat.DEFAULT_FRAME_RATE) {
    const ms = Math.round(frames * (TimeCode.BASE_UNIT / SubtitleFormat.getFrameForCalculation(frameRate)));
    return Math.min(ms, 999);
  }

  // --- Helper methods for parsing ---

  /**
   * Decode timecode from frames (MM:FF format)
   * @param {Array<string>} tokens
   * @param {number} frameRate
   * @returns {TimeCode}
   */
  static decodeTimeCodeFramesTwoParts(tokens, frameRate = SubtitleFormat.DEFAULT_FRAME_RATE) {
    if (!tokens || tokens.length !== 2) {
      return new TimeCode();
    }

    const minutes = parseInt(tokens[0], 10);
    const frames = parseInt(tokens[1], 10);

    if (isNaN(minutes) || isNaN(frames)) {
      return new TimeCode();
    }

    const milliseconds = SubtitleFormat.framesToMillisecondsMax999(frames, frameRate);
    return new TimeCode({ hours: 0, minutes, seconds: 0, milliseconds });
  }

  /**
   * Decode timecode from frames (HH:MM:SS:FF format)
   * @param {Array<string>} tokens
   * @param {number} frameRate
   * @returns {TimeCode}
   */
  static decodeTimeCodeFramesFourParts(tokens, frameRate = SubtitleFormat.DEFAULT_FRAME_RATE) {
    if (!tokens || tokens.length !== 4) {
      return new TimeCode();
    }

    const hours = parseInt(tokens[0], 10);
    const minutes = parseInt(tokens[1], 10);
    const seconds = parseInt(tokens[2], 10);
    const frames = parseInt(tokens[3], 10);

    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || isNaN(frames)) {
      return new TimeCode();
    }

    const milliseconds = SubtitleFormat.framesToMillisecondsMax999(frames, frameRate);
    return new TimeCode({ hours, minutes, seconds, milliseconds });
  }

  /**
   * Remove HTML tags from text
   * @param {string} text
   * @returns {string}
   */
  static removeHtmlTags(text) {
    if (!text) return '';
    return text.replace(/<[^>]+>/g, '');
  }

  /**
   * Check if line is empty or whitespace
   * @param {string} line
   * @returns {boolean}
   */
  static isEmptyLine(line) {
    return !line || line.trim() === '';
  }
}

/**
 * Format Registry - manages all available subtitle formats
 */
export class SubtitleFormatRegistry {
  constructor() {
    this._formats = [];
  }

  /**
   * Register a format
   * @param {SubtitleFormat} format
   */
  register(format) {
    if (!(format instanceof SubtitleFormat)) {
      throw new Error('Format must extend SubtitleFormat');
    }
    this._formats.push(format);
  }

  /**
   * Get all registered formats
   * @returns {Array<SubtitleFormat>}
   */
  getAllFormats() {
    return [...this._formats];
  }

  /**
   * Get format by name
   * @param {string} name
   * @returns {SubtitleFormat|null}
   */
  getFormatByName(name) {
    return this._formats.find(f => f.name === name) || null;
  }

  /**
   * Get format by extension
   * @param {string} extension - Including the dot, e.g., ".srt"
   * @returns {SubtitleFormat|null}
   */
  getFormatByExtension(extension) {
    const ext = extension.toLowerCase();
    return this._formats.find(f =>
      f.extension.toLowerCase() === ext ||
      f.alternateExtensions.some(alt => alt.toLowerCase() === ext)
    ) || null;
  }

  /**
   * Detect format from content
   * @param {Array<string>} lines
   * @param {string} fileName
   * @returns {SubtitleFormat|null}
   */
  detectFormat(lines, fileName) {
    // Try formats in order of registration (most common first)
    for (const format of this._formats) {
      if (format.isMine(lines, fileName)) {
        return format;
      }
    }
    return null;
  }
}

// Global registry instance
export const formatRegistry = new SubtitleFormatRegistry();
