/**
 * MicroDVD format (.sub) - Frame-based format
 */
import { SubtitleFormat } from './SubtitleFormat.js';
import { Paragraph } from '../common/Paragraph.js';
import { TimeCode } from '../common/TimeCode.js';

export class MicroDVD extends SubtitleFormat {
  constructor() {
    super();
    this.frameRate = 25; // Default frame rate
  }

  get extension() {
    return '.sub';
  }

  get name() {
    return 'MicroDVD';
  }

  get isTimeBased() {
    return false; // Frame-based
  }

  isMine(lines, fileName) {
    // MicroDVD format: {start}{end}text
    const pattern = /^\{\d+\}\{\d+\}/;
    let matches = 0;

    for (const line of lines.slice(0, Math.min(20, lines.length))) {
      if (pattern.test(line.trim())) {
        matches++;
      }
    }

    return matches > 2;
  }

  toText(subtitle, title = '') {
    const lines = [];

    for (const p of subtitle.paragraphs) {
      const startFrame = SubtitleFormat.millisecondsToFrames(
        p.startTime.totalMilliseconds,
        this.frameRate
      );
      const endFrame = SubtitleFormat.millisecondsToFrames(
        p.endTime.totalMilliseconds,
        this.frameRate
      );
      const text = p.text.replace(/\n/g, '|'); // MicroDVD uses | for line breaks

      lines.push(`{${startFrame}}{${endFrame}}${text}`);
    }

    return lines.join('\n');
  }

  loadSubtitle(subtitle, lines, fileName) {
    this._errorCount = 0;
    subtitle.paragraphs = [];

    // Try to detect frame rate from first line
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      const match = firstLine.match(/^\{1\}\{1\}(\d+\.?\d*)/);
      if (match) {
        this.frameRate = parseFloat(match[1]);
        lines = lines.slice(1); // Skip first line
      }
    }

    const pattern = /^\{(\d+)\}\{(\d+)\}(.*)$/;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const match = trimmed.match(pattern);
      if (match) {
        const startFrame = parseInt(match[1]);
        const endFrame = parseInt(match[2]);
        const text = match[3].replace(/\|/g, '\n'); // Convert | to newlines

        const para = new Paragraph();
        para.startTime = new TimeCode(
          SubtitleFormat.framesToMilliseconds(startFrame, this.frameRate)
        );
        para.endTime = new TimeCode(
          SubtitleFormat.framesToMilliseconds(endFrame, this.frameRate)
        );
        para.text = text;

        subtitle.paragraphs.push(para);
      } else {
        this._errorCount++;
      }
    }

    // Renumber
    let num = 1;
    for (const p of subtitle.paragraphs) {
      p.number = num++;
    }
  }
}
