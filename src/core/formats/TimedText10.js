/**
 * Timed Text Markup Language (TTML) 1.0 / DFXP
 * W3C Standard format
 */
import { SubtitleFormat } from './SubtitleFormat.js';
import { TimeCode } from '../common/TimeCode.js';
import { Paragraph } from '../common/Paragraph.js';

export class TimedText10 extends SubtitleFormat {
  get name() {
    return 'Timed Text 1.0';
  }

  get extension() {
    return '.xml';
  }

  /**
   * Check if content is TTML format
   */
  isMine(lines) {
    const content = lines.join('\n');
    return content.includes('http://www.w3.org/ns/ttml') &&
           (content.includes('<p ') || content.includes('<p>'));
  }

  /**
   * Parse TTML content
   */
  loadSubtitle(lines) {
    const content = lines.join('\n');
    const paragraphs = [];

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(content, 'text/xml');

      // Check for parse errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        throw new Error('Invalid XML');
      }

      // Get all <p> elements (paragraph elements)
      const pElements = xmlDoc.querySelectorAll('p');

      for (const pElement of pElements) {
        try {
          const begin = pElement.getAttribute('begin');
          const end = pElement.getAttribute('end');
          const dur = pElement.getAttribute('dur');

          if (!begin) continue;

          const startTime = this.parseTTMLTime(begin);
          let endTime;

          if (end) {
            endTime = this.parseTTMLTime(end);
          } else if (dur) {
            const duration = this.parseTTMLTime(dur);
            endTime = new TimeCode(startTime.totalMilliseconds + duration.totalMilliseconds);
          } else {
            continue; // Skip if no end time
          }

          // Extract text content, preserving line breaks
          let text = this.extractTextWithLineBreaks(pElement);

          const paragraph = new Paragraph({
            startTime,
            endTime,
            text
          });

          // Store region attribute if present
          const region = pElement.getAttribute('region');
          if (region) {
            paragraph.region = region;
          }

          // Store style attribute if present
          const style = pElement.getAttribute('style');
          if (style) {
            paragraph.style = style;
          }

          paragraphs.push(paragraph);
        } catch (error) {
          console.warn('Failed to parse TTML paragraph:', error);
        }
      }

      // Store the entire XML as header for round-trip preservation
      const header = content.substring(0, content.indexOf('<body'));

      return { paragraphs, header };
    } catch (error) {
      console.error('Failed to parse TTML:', error);
      return { paragraphs: [], header: '' };
    }
  }

  /**
   * Extract text from element, converting <br/> to line breaks
   */
  extractTextWithLineBreaks(element) {
    const parts = [];

    const walk = (node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        parts.push(node.textContent);
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.nodeName.toLowerCase() === 'br') {
          parts.push('\n');
        } else if (node.nodeName.toLowerCase() === 'span') {
          // Process span contents
          for (const child of node.childNodes) {
            walk(child);
          }
        } else {
          for (const child of node.childNodes) {
            walk(child);
          }
        }
      }
    };

    for (const child of element.childNodes) {
      walk(child);
    }

    return parts.join('').trim();
  }

  /**
   * Parse TTML time format
   * Supports: HH:MM:SS.mmm, HH:MM:SS:FF (frames), SS.mmms, SSSms, ticks
   */
  parseTTMLTime(timeString) {
    timeString = timeString.trim();

    // Milliseconds (12345ms) - check BEFORE seconds!
    if (timeString.endsWith('ms')) {
      const milliseconds = parseFloat(timeString.slice(0, -2));
      return new TimeCode(milliseconds);
    }

    // Seconds with decimal (12.345s)
    if (timeString.endsWith('s')) {
      const seconds = parseFloat(timeString.slice(0, -1));
      return new TimeCode(seconds * 1000);
    }

    // Ticks (12345t) - 1 tick = 100 nanoseconds
    if (timeString.endsWith('t')) {
      const ticks = parseFloat(timeString.slice(0, -1));
      const milliseconds = (ticks / 10000); // Convert ticks to ms
      return new TimeCode(milliseconds);
    }

    // Time code format: HH:MM:SS.mmm or HH:MM:SS:FF
    const parts = timeString.split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);

      // Check if last part is frames or seconds
      const lastPart = parts[2];
      if (lastPart.includes('.')) {
        // HH:MM:SS.mmm format
        const secondsParts = lastPart.split('.');
        const seconds = parseInt(secondsParts[0]);
        const milliseconds = secondsParts.length > 1
          ? parseInt(secondsParts[1].padEnd(3, '0').substring(0, 3))
          : 0;

        return new TimeCode({ hours, minutes, seconds, milliseconds });
      } else {
        // HH:MM:SS:FF format (frames) - assume 25fps
        const seconds = parseInt(parts[2]);
        return new TimeCode({ hours, minutes, seconds, milliseconds: 0 });
      }
    }

    throw new Error('Invalid TTML time format: ' + timeString);
  }

  /**
   * Format time as TTML (HH:MM:SS.mmm)
   */
  formatTTMLTime(timeCode, format = 'hh:mm:ss.ms') {
    const hours = Math.floor(timeCode.totalSeconds / 3600);
    const minutes = Math.floor((timeCode.totalSeconds % 3600) / 60);
    const seconds = Math.floor(timeCode.totalSeconds % 60);
    const milliseconds = Math.floor(timeCode.totalMilliseconds % 1000);

    switch (format) {
      case 'seconds':
        return `${timeCode.totalSeconds.toFixed(3)}s`;
      case 'milliseconds':
        return `${timeCode.totalMilliseconds}ms`;
      case 'hh:mm:ss.ms':
      default:
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
    }
  }

  /**
   * Convert subtitle to TTML format
   */
  toText(subtitle) {
    // Create XML structure
    let xml = `<?xml version="1.0" encoding="utf-8"?>
<tt xmlns="http://www.w3.org/ns/ttml" xmlns:ttp="http://www.w3.org/ns/ttml#parameter" ttp:timeBase="media" xmlns:tts="http://www.w3.org/ns/ttml#styling" xml:lang="en" xmlns:ttm="http://www.w3.org/ns/ttml#metadata">
  <head>
    <metadata>
      <ttm:title>${this.escapeXml(subtitle.title || 'Untitled')}</ttm:title>
    </metadata>
    <styling>
      <style xml:id="s0" tts:backgroundColor="black" tts:fontStyle="normal" tts:fontSize="16px" tts:fontFamily="sansSerif" tts:color="white" />
    </styling>
    <layout>
      <region tts:extent="80% 40%" tts:origin="10% 50%" tts:displayAlign="after" tts:textAlign="center" xml:id="bottomCenter" />
    </layout>
  </head>
  <body style="s0">
    <div>
`;

    // Add paragraphs
    for (const para of subtitle.paragraphs) {
      const startTime = para.startTime instanceof TimeCode
        ? para.startTime
        : new TimeCode(para.startTime.totalMilliseconds || 0);
      const endTime = para.endTime instanceof TimeCode
        ? para.endTime
        : new TimeCode(para.endTime.totalMilliseconds || 0);

      const begin = this.formatTTMLTime(startTime);
      const end = this.formatTTMLTime(endTime);

      // Convert line breaks to <br/>
      const lines = para.text.split(/\r?\n/);
      const textContent = lines.map(line => this.escapeXml(line)).join('<br/>');

      const region = para.region || 'bottomCenter';
      const style = para.style ? ` style="${this.escapeXml(para.style)}"` : '';

      xml += `      <p begin="${begin}" end="${end}" region="${region}"${style}>${textContent}</p>\n`;
    }

    xml += `    </div>
  </body>
</tt>`;

    return xml;
  }

  /**
   * Escape XML special characters
   */
  escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
