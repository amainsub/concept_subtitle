/**
 * JSON Subtitle Format
 * Generic JSON format with start_time, end_time, text
 */
import { SubtitleFormat } from './SubtitleFormat.js';
import { TimeCode } from '../common/TimeCode.js';
import { Paragraph } from '../common/Paragraph.js';

export class JsonSubtitle extends SubtitleFormat {
  get name() {
    return 'JSON Subtitle';
  }

  get extension() {
    return '.json';
  }

  /**
   * Check if content is JSON subtitle format
   */
  isMine(lines) {
    const content = lines.join('').trim();

    // Must start with [ or {
    if (!content.startsWith('[') && !content.startsWith('{')) {
      return false;
    }

    // Try to parse as JSON
    try {
      const data = JSON.parse(content);

      // Check if it's an array
      if (Array.isArray(data)) {
        // Check first few items for subtitle structure
        for (let i = 0; i < Math.min(3, data.length); i++) {
          const item = data[i];
          if (this.isValidSubtitleObject(item)) {
            return true;
          }
        }
      }
      // Check if it's a single object with subtitles array
      else if (typeof data === 'object') {
        if (Array.isArray(data.subtitles) || Array.isArray(data.captions)) {
          return true;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if object has subtitle fields
   */
  isValidSubtitleObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    // Common field combinations
    const hasStartEnd = (
      (obj.start_time !== undefined || obj.startTime !== undefined || obj.start !== undefined) &&
      (obj.end_time !== undefined || obj.endTime !== undefined || obj.end !== undefined) &&
      (obj.text !== undefined || obj.content !== undefined)
    );

    return hasStartEnd;
  }

  /**
   * Parse JSON content
   */
  loadSubtitle(lines) {
    const content = lines.join('');
    const paragraphs = [];

    try {
      let data = JSON.parse(content);

      // Handle wrapped formats
      if (!Array.isArray(data)) {
        if (Array.isArray(data.subtitles)) {
          data = data.subtitles;
        } else if (Array.isArray(data.captions)) {
          data = data.captions;
        } else {
          return { paragraphs: [], header: '' };
        }
      }

      for (const item of data) {
        try {
          // Extract start time (various field names)
          let startSeconds = null;
          if (item.start_time !== undefined) {
            startSeconds = parseFloat(item.start_time);
          } else if (item.startTime !== undefined) {
            startSeconds = parseFloat(item.startTime);
          } else if (item.start !== undefined) {
            startSeconds = parseFloat(item.start);
          }

          // Extract end time
          let endSeconds = null;
          if (item.end_time !== undefined) {
            endSeconds = parseFloat(item.end_time);
          } else if (item.endTime !== undefined) {
            endSeconds = parseFloat(item.endTime);
          } else if (item.end !== undefined) {
            endSeconds = parseFloat(item.end);
          }

          // Extract text
          let text = '';
          if (item.text !== undefined) {
            text = item.text;
          } else if (item.content !== undefined) {
            text = item.content;
          }

          // Validate and create paragraph
          if (startSeconds !== null && endSeconds !== null && text !== null) {
            const startTime = new TimeCode(startSeconds * 1000);
            const endTime = new TimeCode(endSeconds * 1000);

            const paragraph = new Paragraph({
              startTime,
              endTime,
              text: String(text)
            });

            // Preserve any additional metadata
            if (item.style) paragraph.style = item.style;
            if (item.speaker) paragraph.actor = item.speaker;
            if (item.region) paragraph.region = item.region;

            paragraphs.push(paragraph);
          }
        } catch (error) {
          console.warn('Failed to parse JSON subtitle item:', error);
        }
      }

      return { paragraphs, header: '' };
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      return { paragraphs: [], header: '' };
    }
  }

  /**
   * Convert subtitle to JSON format
   */
  toText(subtitle) {
    const data = [];

    for (const para of subtitle.paragraphs) {
      const startTime = para.startTime instanceof TimeCode
        ? para.startTime
        : new TimeCode(para.startTime.totalMilliseconds || 0);
      const endTime = para.endTime instanceof TimeCode
        ? para.endTime
        : new TimeCode(para.endTime.totalMilliseconds || 0);

      const item = {
        start_time: parseFloat(startTime.totalSeconds.toFixed(3)),
        end_time: parseFloat(endTime.totalSeconds.toFixed(3)),
        text: para.text
      };

      // Add optional fields if present
      if (para.style) item.style = para.style;
      if (para.actor) item.speaker = para.actor;
      if (para.region) item.region = para.region;

      data.push(item);
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Escape JSON text
   */
  escapeJson(text) {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  }
}
