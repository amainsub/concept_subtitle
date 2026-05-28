/**
 * SubStation Alpha (SSA) v4.00 format
 * Similar to ASS but older version
 */
import { SubtitleFormat } from './SubtitleFormat.js';
import { TimeCode } from '../common/TimeCode.js';
import { Paragraph } from '../common/Paragraph.js';

export class SubStationAlpha extends SubtitleFormat {
  get name() {
    return 'Sub Station Alpha';
  }

  get extension() {
    return '.ssa';
  }

  /**
   * Check if content is SSA format
   */
  isMine(lines) {
    let hasScriptInfo = false;
    let hasV4Styles = false;
    let hasEvents = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '[Script Info]') hasScriptInfo = true;
      if (trimmed === '[V4 Styles]') hasV4Styles = true;
      if (trimmed === '[Events]') hasEvents = true;
      if (trimmed.startsWith('Dialogue:') || trimmed.startsWith('Comment:')) {
        return hasScriptInfo && hasV4Styles && hasEvents;
      }
    }

    return hasScriptInfo && hasV4Styles;
  }

  /**
   * Parse SSA content
   */
  loadSubtitle(lines) {
    const paragraphs = [];
    let header = '';
    let inEvents = false;
    let formatIndices = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Store header (everything before Events)
      if (!inEvents) {
        header += lines[i] + '\n';
      }

      // Check for Events section
      if (line === '[Events]') {
        inEvents = true;
        continue;
      }

      // Parse Format line in Events
      if (inEvents && line.startsWith('Format:')) {
        const formatParts = line.substring(7).split(',').map(s => s.trim());
        formatIndices = {
          start: formatParts.indexOf('Start'),
          end: formatParts.indexOf('End'),
          text: formatParts.indexOf('Text'),
          style: formatParts.indexOf('Style'),
          name: formatParts.indexOf('Name'),
          marginL: formatParts.indexOf('MarginL'),
          marginR: formatParts.indexOf('MarginR'),
          marginV: formatParts.indexOf('MarginV')
        };
        continue;
      }

      // Parse Dialogue/Comment lines
      if (inEvents && (line.startsWith('Dialogue:') || line.startsWith('Comment:'))) {
        if (!formatIndices) continue;

        const isComment = line.startsWith('Comment:');
        const content = line.substring(isComment ? 8 : 9).trim();

        // SSA format: Marked={4},{0},{1},{3},{5},{6},{7},{8},{9},{2}
        // Split carefully - text may contain commas
        const parts = [];
        let current = '';
        let commaCount = 0;
        const maxCommas = formatIndices.text; // Text is last, so we stop splitting after text index

        for (let j = 0; j < content.length; j++) {
          if (content[j] === ',' && commaCount < maxCommas) {
            parts.push(current.trim());
            current = '';
            commaCount++;
          } else {
            current += content[j];
          }
        }
        parts.push(current.trim()); // Add remaining as text

        if (parts.length <= formatIndices.text) continue;

        try {
          // Parse times (format: H:MM:SS.CC where CC is centiseconds)
          const startTime = this.parseSSATime(parts[formatIndices.start]);
          const endTime = this.parseSSATime(parts[formatIndices.end]);
          let text = parts[formatIndices.text] || '';

          // Convert SSA line breaks (\n or \N) to actual line breaks
          text = text.replace(/\\[nN]/g, '\n');

          const paragraph = new Paragraph({
            startTime,
            endTime,
            text,
            isComment
          });

          // Store additional SSA-specific properties
          if (formatIndices.style >= 0 && parts[formatIndices.style]) {
            paragraph.style = parts[formatIndices.style];
          }
          if (formatIndices.name >= 0 && parts[formatIndices.name]) {
            paragraph.actor = parts[formatIndices.name];
          }
          if (formatIndices.marginL >= 0 && parts[formatIndices.marginL]) {
            paragraph.marginL = parseInt(parts[formatIndices.marginL]) || 0;
          }
          if (formatIndices.marginR >= 0 && parts[formatIndices.marginR]) {
            paragraph.marginR = parseInt(parts[formatIndices.marginR]) || 0;
          }
          if (formatIndices.marginV >= 0 && parts[formatIndices.marginV]) {
            paragraph.marginV = parseInt(parts[formatIndices.marginV]) || 0;
          }

          paragraphs.push(paragraph);
        } catch (error) {
          // Skip invalid lines
          console.warn('Failed to parse SSA line:', line, error);
        }
      }
    }

    return { paragraphs, header: header.trim() };
  }

  /**
   * Parse SSA time format (H:MM:SS.CC where CC is centiseconds)
   */
  parseSSATime(timeString) {
    const parts = timeString.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid SSA time format');
    }

    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const secondsParts = parts[2].split('.');
    const seconds = parseInt(secondsParts[0]);
    const centiseconds = secondsParts.length > 1 ? parseInt(secondsParts[1].padEnd(2, '0').substring(0, 2)) : 0;

    return new TimeCode({
      hours,
      minutes,
      seconds,
      milliseconds: centiseconds * 10
    });
  }

  /**
   * Format SSA time (H:MM:SS.CC)
   */
  formatSSATime(timeCode) {
    const hours = Math.floor(timeCode.totalSeconds / 3600);
    const minutes = Math.floor((timeCode.totalSeconds % 3600) / 60);
    const seconds = Math.floor(timeCode.totalSeconds % 60);
    const centiseconds = Math.floor((timeCode.totalMilliseconds % 1000) / 10);

    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  }

  /**
   * Convert subtitle to SSA format
   */
  toText(subtitle) {
    let output = '';

    // Add header or create default
    if (subtitle.header && subtitle.header.includes('[V4 Styles]')) {
      output += subtitle.header + '\n\n';

      // Ensure Events section exists
      if (!subtitle.header.includes('[Events]')) {
        output += '[Events]\n';
        output += 'Format: Marked, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n';
      }
    } else {
      // Create default header
      output += `[Script Info]
; This is a Sub Station Alpha v4 script.
Title: Untitled
ScriptType: v4.00
Collisions: Normal
PlayDepth: 0

[V4 Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, TertiaryColour, BackColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, AlphaLevel, Encoding
Style: Default,Arial,20,16777215,65535,65535,0,0,0,1,2,0,2,10,10,10,0,1

[Events]
Format: Marked, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
    }

    // Add paragraphs
    for (const para of subtitle.paragraphs) {
      const startTime = para.startTime instanceof TimeCode
        ? para.startTime
        : new TimeCode(para.startTime.totalMilliseconds || 0);
      const endTime = para.endTime instanceof TimeCode
        ? para.endTime
        : new TimeCode(para.endTime.totalMilliseconds || 0);

      const startStr = this.formatSSATime(startTime);
      const endStr = this.formatSSATime(endTime);

      // Convert line breaks to SSA format
      let text = para.text.replace(/\r?\n/g, '\\N');

      const style = para.style || 'Default';
      const actor = para.actor || '';
      const marginL = para.marginL || 0;
      const marginR = para.marginR || 0;
      const marginV = para.marginV || 0;

      const lineType = para.isComment ? 'Comment' : 'Dialogue';

      output += `${lineType}: Marked=0,${startStr},${endStr},${style},${actor},${marginL},${marginR},${marginV},,${text}\n`;
    }

    return output;
  }
}
