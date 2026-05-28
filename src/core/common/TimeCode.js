/**
 * TimeCode class - represents a time position with millisecond precision
 * Ported from C# SubtitleEdit TimeCode.cs
 */
export class TimeCode {
  static BASE_UNIT = 1000.0; // Base unit of time (milliseconds)
  static MAX_TIME_TOTAL_MILLISECONDS = 359999999; // 99:59:59.999
  static TIME_SPLIT_CHARS = [':', ',', '.'];

  /**
   * @param {number|object} value - Total milliseconds, or object with hours, minutes, seconds, milliseconds
   */
  constructor(value = 0) {
    if (typeof value === 'object') {
      const { hours = 0, minutes = 0, seconds = 0, milliseconds = 0 } = value;
      this.totalMilliseconds =
        hours * 60 * 60 * TimeCode.BASE_UNIT +
        minutes * 60 * TimeCode.BASE_UNIT +
        seconds * TimeCode.BASE_UNIT +
        milliseconds;
    } else {
      this.totalMilliseconds = value;
    }
  }

  /**
   * Create TimeCode from seconds
   * @param {number} seconds
   * @returns {TimeCode}
   */
  static fromSeconds(seconds) {
    return new TimeCode(seconds * TimeCode.BASE_UNIT);
  }

  /**
   * Parse time string to TimeCode object
   * @param {string} text
   * @returns {TimeCode}
   */
  static parse(text) {
    const milliseconds = TimeCode.parseToMilliseconds(text);
    return new TimeCode(milliseconds);
  }

  /**
   * Parse time string to milliseconds
   * Formats: HH:MM:SS.MSec or MM:SS.MSec or HH:MM:SS,MSec
   * @param {string} text
   * @returns {number} Total milliseconds
   */
  static parseToMilliseconds(text) {
    if (!text) return 0;

    const parts = text.split(new RegExp(`[${TimeCode.TIME_SPLIT_CHARS.join('')}]`))
      .filter(p => p.length > 0);

    if (parts.length === 4) {
      // HH:MM:SS.MS
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const seconds = parseInt(parts[2], 10);
      const msString = parts[3].padEnd(3, '0').substring(0, 3);
      const milliseconds = parseInt(msString, 10);

      if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds) && !isNaN(milliseconds)) {
        return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
      }
    }

    if (parts.length === 3) {
      // MM:SS.MS
      const minutes = parseInt(parts[0], 10);
      const seconds = parseInt(parts[1], 10);
      const msString = parts[2].padEnd(3, '0').substring(0, 3);
      const milliseconds = parseInt(msString, 10);

      if (!isNaN(minutes) && !isNaN(seconds) && !isNaN(milliseconds)) {
        return minutes * 60000 + seconds * 1000 + milliseconds;
      }
    }

    return 0;
  }

  /**
   * Parse HH:MM:SS:FF (frame-based) to milliseconds
   * @param {string} text
   * @param {number} frameRate - Frames per second (default 25)
   * @returns {number}
   */
  static parseHHMMSSFFToMilliseconds(text, frameRate = 25) {
    if (!text) return 0;

    const parts = text.split(new RegExp(`[${TimeCode.TIME_SPLIT_CHARS.join('')}]`))
      .filter(p => p.length > 0);

    if (parts.length === 4) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const seconds = parseInt(parts[2], 10);
      const frames = parseInt(parts[3], 10);

      if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds) && !isNaN(frames)) {
        const milliseconds = Math.round((frames * 1000.0) / frameRate);
        return hours * 3600000 + minutes * 60000 + seconds * 1000 + milliseconds;
      }
    }

    return 0;
  }

  /**
   * Parse HH:MM:SS to milliseconds
   * @param {string} text
   * @returns {number}
   */
  static parseHHMMSSToMilliseconds(text) {
    if (!text) return 0;

    const parts = text.split(new RegExp(`[${TimeCode.TIME_SPLIT_CHARS.join('')}]`))
      .filter(p => p.length > 0);

    if (parts.length === 3) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const seconds = parseInt(parts[2], 10);

      if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
        return hours * 3600000 + minutes * 60000 + seconds * 1000;
      }
    }

    return 0;
  }

  /**
   * Check if this is the maximum time value
   * @returns {boolean}
   */
  get isMaxTime() {
    return Math.abs(this.totalMilliseconds - TimeCode.MAX_TIME_TOTAL_MILLISECONDS) < 0.01;
  }

  /**
   * Get hours component
   * @returns {number}
   */
  get hours() {
    return Math.floor(this.totalMilliseconds / 3600000);
  }

  set hours(value) {
    const current = this.totalMilliseconds;
    const oldHours = this.hours;
    this.totalMilliseconds = current - (oldHours * 3600000) + (value * 3600000);
  }

  /**
   * Get minutes component (0-59)
   * @returns {number}
   */
  get minutes() {
    return Math.floor((this.totalMilliseconds % 3600000) / 60000);
  }

  set minutes(value) {
    const hours = this.hours;
    const seconds = this.seconds;
    const milliseconds = this.milliseconds;
    this.totalMilliseconds = hours * 3600000 + value * 60000 + seconds * 1000 + milliseconds;
  }

  /**
   * Get seconds component (0-59)
   * @returns {number}
   */
  get seconds() {
    return Math.floor((this.totalMilliseconds % 60000) / 1000);
  }

  set seconds(value) {
    const hours = this.hours;
    const minutes = this.minutes;
    const milliseconds = this.milliseconds;
    this.totalMilliseconds = hours * 3600000 + minutes * 60000 + value * 1000 + milliseconds;
  }

  /**
   * Get milliseconds component (0-999)
   * @returns {number}
   */
  get milliseconds() {
    return Math.floor(this.totalMilliseconds % 1000);
  }

  set milliseconds(value) {
    const hours = this.hours;
    const minutes = this.minutes;
    const seconds = this.seconds;
    this.totalMilliseconds = hours * 3600000 + minutes * 60000 + seconds * 1000 + value;
  }

  /**
   * Get total seconds
   * @returns {number}
   */
  get totalSeconds() {
    return this.totalMilliseconds / TimeCode.BASE_UNIT;
  }

  set totalSeconds(value) {
    this.totalMilliseconds = value * TimeCode.BASE_UNIT;
  }

  /**
   * Format as HH:MM:SS,MS
   * @param {boolean} localize - Use local decimal separator (default: false, use comma)
   * @returns {string}
   */
  toString(localize = false) {
    const decimalSeparator = localize ? '.' : ',';
    const h = this.hours;
    const m = this.minutes;
    const s = this.seconds;
    const ms = this.milliseconds;

    const sign = this.totalMilliseconds < 0 ? '-' : '';
    const absH = Math.abs(h);
    const absM = Math.abs(m);
    const absS = Math.abs(s);
    const absMS = Math.abs(ms);

    return `${sign}${absH.toString().padStart(2, '0')}:${absM.toString().padStart(2, '0')}:${absS.toString().padStart(2, '0')}${decimalSeparator}${absMS.toString().padStart(3, '0')}`;
  }

  /**
   * Format as short string (omit leading zeros)
   * @param {boolean} localize
   * @returns {string}
   */
  toShortString(localize = false) {
    const decimalSeparator = localize ? '.' : ',';
    const h = this.hours;
    const m = this.minutes;
    const s = this.seconds;
    const ms = this.milliseconds;

    const sign = this.totalMilliseconds < 0 ? '-' : '';
    const absH = Math.abs(h);
    const absM = Math.abs(m);
    const absS = Math.abs(s);
    const absMS = Math.abs(ms);

    if (absH === 0 && absM === 0) {
      return `${sign}${absS}${decimalSeparator}${absMS.toString().padStart(3, '0')}`;
    } else if (absH === 0) {
      return `${sign}${absM}:${absS.toString().padStart(2, '0')}${decimalSeparator}${absMS.toString().padStart(3, '0')}`;
    } else {
      return `${sign}${absH}:${absM.toString().padStart(2, '0')}:${absS.toString().padStart(2, '0')}${decimalSeparator}${absMS.toString().padStart(3, '0')}`;
    }
  }

  /**
   * Format for display in SubRip format (HH:MM:SS,MS)
   * @returns {string}
   */
  toSubRipString() {
    return this.toString(false);
  }

  /**
   * Format for display in SMPTE format (HH:MM:SS:FF)
   * @param {number} frameRate
   * @returns {string}
   */
  toSMPTEString(frameRate = 25) {
    const h = this.hours;
    const m = this.minutes;
    const s = this.seconds;
    const frames = Math.round((this.milliseconds * frameRate) / 1000.0);

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  }

  /**
   * Clone this TimeCode
   * @returns {TimeCode}
   */
  clone() {
    return new TimeCode(this.totalMilliseconds);
  }

  /**
   * Add time
   * @param {number} milliseconds
   * @returns {TimeCode} New TimeCode instance
   */
  add(milliseconds) {
    return new TimeCode(this.totalMilliseconds + milliseconds);
  }

  /**
   * Subtract time
   * @param {number} milliseconds
   * @returns {TimeCode} New TimeCode instance
   */
  subtract(milliseconds) {
    return new TimeCode(this.totalMilliseconds - milliseconds);
  }
}
