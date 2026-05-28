import { describe, it, expect, beforeEach } from 'vitest';
import { SubRip } from '../../src/core/formats/SubRip.js';
import { Subtitle } from '../../src/core/common/Subtitle.js';
import { Paragraph } from '../../src/core/common/Paragraph.js';
import { TimeCode } from '../../src/core/common/TimeCode.js';

describe('SubRip', () => {
  let format;

  beforeEach(() => {
    format = new SubRip();
  });

  describe('format properties', () => {
    it('should have correct extension', () => {
      expect(format.extension).toBe('.srt');
    });

    it('should have correct name', () => {
      expect(format.name).toBe('SubRip');
    });

    it('should support .wsrt extension', () => {
      expect(format.alternateExtensions).toContain('.wsrt');
    });
  });

  describe('isMine', () => {
    it('should recognize valid SubRip format', () => {
      const lines = [
        '1',
        '00:00:01,000 --> 00:00:03,000',
        'First subtitle',
        '',
        '2',
        '00:00:05,000 --> 00:00:07,000',
        'Second subtitle',
      ];

      expect(format.isMine(lines, 'test.srt')).toBe(true);
    });

    it('should reject WebVTT format', () => {
      const lines = [
        'WEBVTT',
        '',
        '1',
        '00:00:01.000 --> 00:00:03.000',
        'Test',
      ];

      expect(format.isMine(lines, 'test.vtt')).toBe(false);
    });

    it('should reject invalid format', () => {
      const lines = [
        'Not a subtitle',
        'Random text',
      ];

      expect(format.isMine(lines, 'test.txt')).toBe(false);
    });
  });

  describe('loadSubtitle', () => {
    it('should parse basic SubRip file', () => {
      const lines = [
        '1',
        '00:00:01,000 --> 00:00:03,000',
        'First subtitle',
        '',
        '2',
        '00:00:05,000 --> 00:00:07,000',
        'Second subtitle',
        '',
      ];

      const subtitle = new Subtitle();
      format.loadSubtitle(subtitle, lines, 'test.srt');

      expect(subtitle.paragraphs.length).toBe(2);
      expect(subtitle.paragraphs[0].number).toBe(1);
      expect(subtitle.paragraphs[0].text).toBe('First subtitle');
      expect(subtitle.paragraphs[0].startTime.totalMilliseconds).toBe(1000);
      expect(subtitle.paragraphs[0].endTime.totalMilliseconds).toBe(3000);

      expect(subtitle.paragraphs[1].number).toBe(2);
      expect(subtitle.paragraphs[1].text).toBe('Second subtitle');
    });

    it('should parse multi-line text', () => {
      const lines = [
        '1',
        '00:00:01,000 --> 00:00:03,000',
        'Line one',
        'Line two',
        'Line three',
        '',
      ];

      const subtitle = new Subtitle();
      format.loadSubtitle(subtitle, lines, 'test.srt');

      expect(subtitle.paragraphs.length).toBe(1);
      expect(subtitle.paragraphs[0].text).toBe('Line one\nLine two\nLine three');
    });

    it('should handle missing subtitle numbers', () => {
      const lines = [
        '00:00:01,000 --> 00:00:03,000',
        'First subtitle',
        '',
        '00:00:05,000 --> 00:00:07,000',
        'Second subtitle',
        '',
      ];

      const subtitle = new Subtitle();
      format.loadSubtitle(subtitle, lines, 'test.srt');

      expect(subtitle.paragraphs.length).toBe(2);
      expect(subtitle.paragraphs[0].number).toBe(1);
      expect(subtitle.paragraphs[1].number).toBe(2);
    });

    it('should handle missing blank lines between subtitles', () => {
      const lines = [
        '1',
        '00:00:01,000 --> 00:00:03,000',
        'First subtitle',
        '2',
        '00:00:05,000 --> 00:00:07,000',
        'Second subtitle',
      ];

      const subtitle = new Subtitle();
      format.loadSubtitle(subtitle, lines, 'test.srt');

      expect(subtitle.paragraphs.length).toBe(2);
    });

    it('should handle different timecode formats', () => {
      const lines = [
        '1',
        '00:00:01.000 --> 00:00:03.000',
        'Using dot separator',
        '',
        '2',
        '00:00:05,000 --> 00:00:07,000',
        'Using comma separator',
        '',
      ];

      const subtitle = new Subtitle();
      format.loadSubtitle(subtitle, lines, 'test.srt');

      expect(subtitle.paragraphs.length).toBe(2);
      expect(subtitle.paragraphs[0].startTime.totalMilliseconds).toBe(1000);
      expect(subtitle.paragraphs[1].startTime.totalMilliseconds).toBe(5000);
    });

    it('should handle short timecode format MM:SS,MS', () => {
      const lines = [
        '1',
        '01:30,000 --> 01:33,000',
        'Short format',
        '',
      ];

      const subtitle = new Subtitle();
      format.loadSubtitle(subtitle, lines, 'test.srt');

      expect(subtitle.paragraphs.length).toBe(1);
      expect(subtitle.paragraphs[0].startTime.totalMilliseconds).toBe(90000); // 1:30 = 90 seconds
    });

    it('should trim trailing whitespace from text', () => {
      const lines = [
        '1',
        '00:00:01,000 --> 00:00:03,000',
        '  Text with spaces  ',
        '',
      ];

      const subtitle = new Subtitle();
      format.loadSubtitle(subtitle, lines, 'test.srt');

      // Should trim trailing but not leading whitespace
      expect(subtitle.paragraphs[0].text).toBe('  Text with spaces');
    });

    it('should handle empty file', () => {
      const subtitle = new Subtitle();
      format.loadSubtitle(subtitle, [], 'test.srt');

      expect(subtitle.paragraphs.length).toBe(0);
    });

    it('should handle position info after timecode', () => {
      const lines = [
        '1',
        '00:00:01,000 --> 00:00:03,000 X1:100 X2:200 Y1:50 Y2:100',
        'With position info',
        '',
      ];

      const subtitle = new Subtitle();
      format.loadSubtitle(subtitle, lines, 'test.srt');

      expect(subtitle.paragraphs.length).toBe(1);
      expect(subtitle.paragraphs[0].text).toBe('With position info');
    });
  });

  describe('toText', () => {
    it('should format subtitle to SubRip text', () => {
      const subtitle = new Subtitle();
      const p1 = new Paragraph();
      p1.number = 1;
      p1.startTime = new TimeCode(1000);
      p1.endTime = new TimeCode(3000);
      p1.text = 'First subtitle';
      subtitle.addParagraph(p1);

      const p2 = new Paragraph();
      p2.number = 2;
      p2.startTime = new TimeCode(5000);
      p2.endTime = new TimeCode(7000);
      p2.text = 'Second subtitle';
      subtitle.addParagraph(p2);

      const text = format.toText(subtitle);

      expect(text).toContain('1\n');
      expect(text).toContain('00:00:01,000 --> 00:00:03,000');
      expect(text).toContain('First subtitle');
      expect(text).toContain('2\n');
      expect(text).toContain('00:00:05,000 --> 00:00:07,000');
      expect(text).toContain('Second subtitle');
    });

    it('should handle multi-line text', () => {
      const subtitle = new Subtitle();
      const p = new Paragraph();
      p.number = 1;
      p.startTime = new TimeCode(1000);
      p.endTime = new TimeCode(3000);
      p.text = 'Line one\nLine two';
      subtitle.addParagraph(p);

      const text = format.toText(subtitle);

      expect(text).toContain('Line one\nLine two');
    });

    it('should end with double newline', () => {
      const subtitle = new Subtitle();
      const p = new Paragraph();
      p.number = 1;
      p.startTime = new TimeCode(1000);
      p.endTime = new TimeCode(3000);
      p.text = 'Test';
      subtitle.addParagraph(p);

      const text = format.toText(subtitle);

      expect(text.endsWith('\n\n')).toBe(true);
    });
  });

  describe('round-trip', () => {
    it('should preserve content through load and save', () => {
      const originalLines = [
        '1',
        '00:00:01,000 --> 00:00:03,000',
        'First subtitle',
        '',
        '2',
        '00:00:05,500 --> 00:00:07,800',
        'Second subtitle',
        'with multiple lines',
        '',
      ];

      const subtitle = new Subtitle();
      format.loadSubtitle(subtitle, originalLines, 'test.srt');

      const text = format.toText(subtitle);
      const newLines = text.split('\n');

      const subtitle2 = new Subtitle();
      format.loadSubtitle(subtitle2, newLines, 'test.srt');

      expect(subtitle2.paragraphs.length).toBe(subtitle.paragraphs.length);
      expect(subtitle2.paragraphs[0].text).toBe(subtitle.paragraphs[0].text);
      expect(subtitle2.paragraphs[0].startTime.totalMilliseconds).toBe(
        subtitle.paragraphs[0].startTime.totalMilliseconds
      );
      expect(subtitle2.paragraphs[1].text).toBe(subtitle.paragraphs[1].text);
    });
  });
});
