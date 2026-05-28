/**
 * Advanced SubStation Alpha (.ass) - Simplified version
 * Full ASS support is complex (2800+ lines in C#), this is a basic implementation
 */
import { SubtitleFormat } from './SubtitleFormat.js';
import { Paragraph } from '../common/Paragraph.js';
import { TimeCode } from '../common/TimeCode.js';

export class AdvancedSubStationAlpha extends SubtitleFormat {
  constructor() {
    super();
  }

  get extension() {
    return '.ass';
  }

  get name() {
    return 'Advanced SubStation Alpha';
  }

  get hasStyleSupport() {
    return true;
  }

  isMine(lines, fileName) {
    return lines.some(line =>
      line.trim().toUpperCase() === '[SCRIPT INFO]' ||
      line.trim().toUpperCase() === '[V4+ STYLES]' ||
      line.trim().toUpperCase() === '[EVENTS]'
    );
  }

  toText(subtitle, title = '') {
    const lines = [];

    // Script Info
    lines.push('[Script Info]');
    lines.push('Title: ' + (title || subtitle.fileName || 'Untitled'));
    lines.push('ScriptType: v4.00+');
    lines.push('');

    // V4+ Styles (basic default style)
    lines.push('[V4+ Styles]');
    lines.push('Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding');
    lines.push('Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,2,2,10,10,10,1');
    lines.push('');

    // Events
    lines.push('[Events]');
    lines.push('Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text');

    for (const p of subtitle.paragraphs) {
      const start = this._formatAssTime(p.startTime);
      const end = this._formatAssTime(p.endTime);
      const style = p.style || 'Default';
      const text = p.text.replace(/\n/g, '\\N'); // ASS uses \N for line breaks

      lines.push(`Dialogue: 0,${start},${end},${style},,0,0,0,,${text}`);
    }

    return lines.join('\n');
  }

  loadSubtitle(subtitle, lines, fileName) {
    this._errorCount = 0;
    subtitle.paragraphs = [];

    let inEvents = false;
    let formatLine = '';

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.toUpperCase() === '[EVENTS]') {
        inEvents = true;
        continue;
      }

      if (trimmed.startsWith('[') && trimmed !== '[Events]') {
        inEvents = false;
        continue;
      }

      if (inEvents) {
        if (trimmed.startsWith('Format:')) {
          formatLine = trimmed.substring(7).trim();
        } else if (trimmed.startsWith('Dialogue:')) {
          const para = this._parseDialogue(trimmed, formatLine);
          if (para) {
            subtitle.paragraphs.push(para);
          } else {
            this._errorCount++;
          }
        }
      }
    }

    // Renumber
    let num = 1;
    for (const p of subtitle.paragraphs) {
      p.number = num++;
    }
  }

  _parseDialogue(line, formatLine) {
    // Remove "Dialogue: " prefix
    const content = line.substring(9).trim();

    // Split by comma, but preserve commas in text field
    const parts = this._smartSplit(content);

    if (parts.length < 10) {
      return null;
    }

    const para = new Paragraph();

    // Parse based on format (simplified - assumes standard format)
    // Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
    para.layer = parseInt(parts[0]) || 0;
    para.startTime = this._parseAssTime(parts[1]);
    para.endTime = this._parseAssTime(parts[2]);
    para.style = parts[3];
    para.actor = parts[4];
    para.marginL = parts[5];
    para.marginR = parts[6];
    para.marginV = parts[7];
    para.effect = parts[8];

    // Text is everything after the 9th comma
    para.text = parts.slice(9).join(',').replace(/\\N/g, '\n'); // Convert \N to actual newlines

    return para;
  }

  _smartSplit(str) {
    // Split by comma, but only first 9 commas (text field can contain commas)
    const parts = [];
    let current = '';
    let commaCount = 0;

    for (let i = 0; i < str.length; i++) {
      if (str[i] === ',' && commaCount < 9) {
        parts.push(current);
        current = '';
        commaCount++;
      } else {
        current += str[i];
      }
    }

    parts.push(current); // Add remaining as text
    return parts;
  }

  _parseAssTime(timeStr) {
    // ASS format: H:MM:SS.cc (centiseconds)
    const match = timeStr.match(/(\d+):(\d+):(\d+)\.(\d+)/);
    if (!match) {
      return new TimeCode(0);
    }

    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const seconds = parseInt(match[3]);
    const centiseconds = parseInt(match[4]);
    const milliseconds = centiseconds * 10;

    return new TimeCode({ hours, minutes, seconds, milliseconds });
  }

  _formatAssTime(timeCode) {
    // ASS format: H:MM:SS.cc
    const h = timeCode.hours;
    const m = timeCode.minutes;
    const s = timeCode.seconds;
    const cs = Math.floor(timeCode.milliseconds / 10);

    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
  }
}
