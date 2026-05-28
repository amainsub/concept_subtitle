/**
 * WebVTT format (.vtt) - HTML5 standard subtitle format
 * https://w3c.github.io/webvtt/
 *
 * Format:
 * WEBVTT
 *
 * 00:00:01.000 --> 00:00:03.000
 * First subtitle
 *
 * 00:00:05.000 --> 00:00:07.000
 * Second subtitle
 */
import { SubtitleFormat } from './SubtitleFormat.js';
import { Paragraph } from '../common/Paragraph.js';
import { TimeCode } from '../common/TimeCode.js';

export class WebVTT extends SubtitleFormat {
  constructor() {
    super();
    this._header = '';
  }

  get extension() {
    return '.vtt';
  }

  get name() {
    return 'WebVTT';
  }

  get alternateExtensions() {
    return ['.webvtt'];
  }

  /**
   * Check if this format matches the content
   */
  isMine(lines, fileName) {
    if (lines.length > 0 && lines[0].toUpperCase().startsWith('WEBVTT')) {
      return true;
    }
    return false;
  }

  /**
   * Convert subtitle to WebVTT text format
   */
  toText(subtitle, title = '') {
    const lines = [];

    // Header
    if (subtitle.header && subtitle.header.toUpperCase().startsWith('WEBVTT')) {
      lines.push(subtitle.header.trim());
    } else {
      lines.push('WEBVTT');
    }
    lines.push('');

    // Cues
    for (const p of subtitle.paragraphs) {
      const start = this._formatTime(p.startTime);
      const end = this._formatTime(p.endTime);

      // Optional cue identifier
      if (p.extra) {
        lines.push(p.extra);
      }

      // Timecode and settings
      let timeLine = `${start} --> ${end}`;
      if (p.region) {
        timeLine += ` region:${p.region}`;
      }
      lines.push(timeLine);

      // Text
      lines.push(p.text);
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Load subtitle from lines
   */
  loadSubtitle(subtitle, lines, fileName) {
    this._errorCount = 0;
    subtitle.paragraphs = [];
    this._header = '';

    if (lines.length === 0) {
      return;
    }

    // Read header
    let i = 0;
    if (lines[i].toUpperCase().startsWith('WEBVTT')) {
      this._header = lines[i];
      subtitle.header = lines[i];
      i++;
    }

    // Skip blank lines after header
    while (i < lines.length && lines[i].trim() === '') {
      i++;
    }

    // Parse cues
    while (i < lines.length) {
      const paragraph = new Paragraph();
      let cueId = '';

      // Check if this line is a cue identifier (not a timecode)
      if (i < lines.length && !this._isTimecode(lines[i]) && lines[i].trim() !== '') {
        cueId = lines[i].trim();
        paragraph.extra = cueId;
        i++;
      }

      // Read timecode line
      if (i < lines.length && this._isTimecode(lines[i])) {
        const timeLine = lines[i];
        if (this._parseTimecode(timeLine, paragraph)) {
          i++;

          // Read text lines until blank line or next cue
          const textLines = [];
          while (i < lines.length && lines[i].trim() !== '' && !this._isTimecode(lines[i])) {
            textLines.push(lines[i]);
            i++;
          }

          paragraph.text = textLines.join('\n');
          subtitle.paragraphs.push(paragraph);
        } else {
          this._errorCount++;
          i++;
        }
      } else if (lines[i].trim() !== '') {
        // Not a valid cue, skip
        this._errorCount++;
        i++;
      } else {
        i++;
      }

      // Skip blank lines
      while (i < lines.length && lines[i].trim() === '') {
        i++;
      }
    }

    // Renumber
    let num = 1;
    for (const p of subtitle.paragraphs) {
      p.number = num++;
    }
  }

  /**
   * Check if line contains WebVTT timecode
   */
  _isTimecode(line) {
    return line.includes('-->');
  }

  /**
   * Parse timecode line
   */
  _parseTimecode(line, paragraph) {
    if (!line.includes('-->')) {
      return false;
    }

    const parts = line.split('-->');
    if (parts.length < 2) {
      return false;
    }

    const startStr = parts[0].trim();
    const endParts = parts[1].trim().split(/\s+/);
    const endStr = endParts[0];

    try {
      // WebVTT uses dot as millisecond separator
      const startMs = this._parseWebVTTTime(startStr);
      const endMs = this._parseWebVTTTime(endStr);

      paragraph.startTime = new TimeCode(startMs);
      paragraph.endTime = new TimeCode(endMs);

      // Parse settings (region, position, etc.)
      if (endParts.length > 1) {
        const settings = endParts.slice(1).join(' ');
        const regionMatch = settings.match(/region:(\S+)/);
        if (regionMatch) {
          paragraph.region = regionMatch[1];
        }
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Parse WebVTT time format (HH:MM:SS.mmm or MM:SS.mmm)
   */
  _parseWebVTTTime(timeStr) {
    // WebVTT uses dot for milliseconds
    const normalized = timeStr.replace('.', ',');
    return TimeCode.parseToMilliseconds(normalized);
  }

  /**
   * Format time for WebVTT (HH:MM:SS.mmm)
   */
  _formatTime(timeCode) {
    const h = timeCode.hours;
    const m = timeCode.minutes;
    const s = timeCode.seconds;
    const ms = timeCode.milliseconds;

    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }
}
