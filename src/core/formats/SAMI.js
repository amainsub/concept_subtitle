/**
 * SAMI format (.smi) - Microsoft Synchronized Accessible Media Interchange
 */
import { SubtitleFormat } from './SubtitleFormat.js';
import { Paragraph } from '../common/Paragraph.js';
import { TimeCode } from '../common/TimeCode.js';

export class SAMI extends SubtitleFormat {
  get extension() {
    return '.smi';
  }

  get name() {
    return 'SAMI';
  }

  get alternateExtensions() {
    return ['.sami'];
  }

  isMine(lines, fileName) {
    const text = lines.join('\n').toLowerCase();
    return text.includes('<sami>') && text.includes('<sync');
  }

  toText(subtitle, title = '') {
    const lines = [];

    lines.push('<SAMI>');
    lines.push('<HEAD>');
    lines.push('<TITLE>' + (title || subtitle.fileName || 'Untitled') + '</TITLE>');
    lines.push('<STYLE TYPE="text/css">');
    lines.push('<!--');
    lines.push('P { margin-left: 16pt; margin-right: 16pt; margin-bottom: 16pt; margin-top: 16pt;');
    lines.push('    text-align: center; font-size: 18pt; font-family: arial, sans-serif; font-weight: bold; color: white; }');
    lines.push('.LANG { Name: Korean; lang: ko-KR; SAMIType: CC; }');
    lines.push('-->');
    lines.push('</STYLE>');
    lines.push('</HEAD>');
    lines.push('<BODY>');

    for (const p of subtitle.paragraphs) {
      const startMs = Math.round(p.startTime.totalMilliseconds);
      const text = p.text.replace(/\n/g, '<br>');

      lines.push(`<SYNC Start=${startMs}>`);
      lines.push(`  <P Class=LANG>${text}`);

      // Add end sync
      const endMs = Math.round(p.endTime.totalMilliseconds);
      lines.push(`<SYNC Start=${endMs}>`);
      lines.push('  <P Class=LANG>&nbsp;');
    }

    lines.push('</BODY>');
    lines.push('</SAMI>');

    return lines.join('\n');
  }

  loadSubtitle(subtitle, lines, fileName) {
    this._errorCount = 0;
    subtitle.paragraphs = [];

    const text = lines.join('\n');
    const syncMatches = text.matchAll(/<sync\s+start\s*=\s*(\d+)\s*>([\s\S]*?)(?=<sync|$)/gi);

    const syncs = [];
    for (const match of syncMatches) {
      const startMs = parseInt(match[1]);
      const content = match[2];

      // Extract text from <P> tags
      const pMatch = content.match(/<p[^>]*>(.*?)(?=<\/p>|<sync|$)/is);
      if (pMatch) {
        let textContent = pMatch[1]
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<[^>]+>/g, '')
          .replace(/&nbsp;/gi, ' ')
          .trim();

        if (textContent && textContent !== ' ') {
          syncs.push({ startMs, text: textContent });
        }
      }
    }

    // Create paragraphs from syncs
    for (let i = 0; i < syncs.length; i++) {
      const sync = syncs[i];
      const nextSync = syncs[i + 1];

      if (sync.text) {
        const para = new Paragraph();
        para.number = i + 1;
        para.startTime = new TimeCode(sync.startMs);
        para.endTime = nextSync ? new TimeCode(nextSync.startMs) : new TimeCode(sync.startMs + 2000);
        para.text = sync.text;

        subtitle.paragraphs.push(para);
      }
    }
  }
}
