import { describe, it, expect } from 'vitest';
import { Paragraph } from '../../src/core/common/Paragraph.js';
import { TimeCode } from '../../src/core/common/TimeCode.js';

describe('Paragraph', () => {
  describe('constructor', () => {
    it('should create with start time, end time, and text', () => {
      const start = new TimeCode(1000);
      const end = new TimeCode(3000);
      const para = new Paragraph(start, end, 'Hello world');

      expect(para.text).toBe('Hello world');
      expect(para.startTime.totalMilliseconds).toBe(1000);
      expect(para.endTime.totalMilliseconds).toBe(3000);
      expect(para.id).toBeTruthy();
    });

    it('should create with default values', () => {
      const para = new Paragraph();

      expect(para.text).toBe('');
      expect(para.startTime.totalMilliseconds).toBe(0);
      expect(para.endTime.totalMilliseconds).toBe(0);
      expect(para.number).toBe(0);
      expect(para.forced).toBe(false);
    });

    it('should create from options object', () => {
      const para = new Paragraph({
        number: 1,
        text: 'Test',
        startTime: new TimeCode(1000),
        endTime: new TimeCode(2000),
        actor: 'John',
        style: 'Default',
      });

      expect(para.number).toBe(1);
      expect(para.text).toBe('Test');
      expect(para.actor).toBe('John');
      expect(para.style).toBe('Default');
    });

    it('should copy from another paragraph', () => {
      const original = new Paragraph(new TimeCode(1000), new TimeCode(2000), 'Original');
      original.number = 5;
      original.actor = 'Alice';

      const copy = new Paragraph(original);

      expect(copy.text).toBe('Original');
      expect(copy.number).toBe(5);
      expect(copy.actor).toBe('Alice');
      expect(copy.id).not.toBe(original.id); // New ID by default
    });

    it('should copy paragraph without generating new ID', () => {
      const original = new Paragraph(new TimeCode(1000), new TimeCode(2000), 'Original');
      const originalId = original.id;

      const copy = new Paragraph(original, false); // Don't generate new ID

      expect(copy.id).toBe(originalId);
    });
  });

  describe('duration', () => {
    it('should calculate duration', () => {
      const para = new Paragraph(new TimeCode(1000), new TimeCode(3500), 'Text');

      expect(para.durationTotalMilliseconds).toBe(2500);
      expect(para.durationTotalSeconds).toBe(2.5);
      expect(para.duration.totalMilliseconds).toBe(2500);
    });
  });

  describe('isDefault', () => {
    it('should detect default paragraph', () => {
      const para = new Paragraph();
      expect(para.isDefault).toBe(true);
    });

    it('should not detect non-default paragraph', () => {
      const para = new Paragraph(new TimeCode(1000), new TimeCode(2000), 'Text');
      expect(para.isDefault).toBe(false);
    });

    it('should detect paragraph with text as non-default', () => {
      const para = new Paragraph(new TimeCode(0), new TimeCode(0), 'Some text');
      expect(para.isDefault).toBe(false);
    });
  });

  describe('numberOfLines', () => {
    it('should count single line', () => {
      const para = new Paragraph(new TimeCode(1000), new TimeCode(2000), 'One line');
      expect(para.numberOfLines).toBe(1);
    });

    it('should count multiple lines', () => {
      const para = new Paragraph(new TimeCode(1000), new TimeCode(2000), 'Line 1\nLine 2\nLine 3');
      expect(para.numberOfLines).toBe(3);
    });

    it('should handle empty text', () => {
      const para = new Paragraph();
      expect(para.numberOfLines).toBe(0);
    });
  });

  describe('wordsPerMinute', () => {
    it('should calculate WPM', () => {
      // 10 words in 6 seconds = 100 WPM
      const para = new Paragraph(new TimeCode(0), new TimeCode(6000), 'One two three four five six seven eight nine ten');
      expect(para.wordsPerMinute).toBe(100);
    });

    it('should return 0 for empty text', () => {
      const para = new Paragraph(new TimeCode(0), new TimeCode(2000), '');
      expect(para.wordsPerMinute).toBe(0);
    });

    it('should return 0 for zero duration', () => {
      const para = new Paragraph(new TimeCode(0), new TimeCode(0), 'Some text');
      expect(para.wordsPerMinute).toBe(0);
    });

    it('should handle HTML tags in word count', () => {
      const para = new Paragraph(new TimeCode(0), new TimeCode(6000), '<i>One two</i> <b>three four</b>');
      // Should count 4 words
      expect(para.wordsPerMinute).toBe(40); // 4 words in 6 seconds
    });
  });

  describe('getCharactersPerSecond', () => {
    it('should calculate CPS', () => {
      // "Hello" = 5 characters in 1 second = 5 CPS
      const para = new Paragraph(new TimeCode(0), new TimeCode(1000), 'Hello');
      expect(para.getCharactersPerSecond()).toBe(5);
    });

    it('should return 999 for very short duration', () => {
      const para = new Paragraph(new TimeCode(0), new TimeCode(0.5), 'Hello');
      expect(para.getCharactersPerSecond()).toBe(999);
    });

    it('should handle multi-line text', () => {
      // "Hi\nBye" = 5 characters (space for newline) in 2 seconds = 2.5 CPS
      const para = new Paragraph(new TimeCode(0), new TimeCode(2000), 'Hi\nBye');
      expect(para.getCharactersPerSecond()).toBeCloseTo(2.5, 1);
    });
  });

  describe('adjust', () => {
    it('should adjust timing with factor and offset', () => {
      const para = new Paragraph(new TimeCode(2000), new TimeCode(4000), 'Text');

      // Scale by 1.5 and add 1 second
      para.adjust(1.5, 1);

      expect(para.startTime.totalMilliseconds).toBe(2000 * 1.5 + 1000); // 4000
      expect(para.endTime.totalMilliseconds).toBe(4000 * 1.5 + 1000);   // 7000
    });

    it('should not adjust if start time is max time', () => {
      const para = new Paragraph(
        new TimeCode(TimeCode.MAX_TIME_TOTAL_MILLISECONDS),
        new TimeCode(TimeCode.MAX_TIME_TOTAL_MILLISECONDS),
        'Text'
      );

      const originalStart = para.startTime.totalMilliseconds;
      para.adjust(2, 1000);

      expect(para.startTime.totalMilliseconds).toBe(originalStart);
    });
  });

  describe('clone', () => {
    it('should clone paragraph with new ID', () => {
      const original = new Paragraph(new TimeCode(1000), new TimeCode(2000), 'Original');
      original.actor = 'Bob';
      original.style = 'Italic';

      const clone = original.clone();

      expect(clone.text).toBe(original.text);
      expect(clone.actor).toBe(original.actor);
      expect(clone.style).toBe(original.style);
      expect(clone.startTime.totalMilliseconds).toBe(original.startTime.totalMilliseconds);
      expect(clone.id).not.toBe(original.id); // Different ID
    });

    it('should clone paragraph with same ID if requested', () => {
      const original = new Paragraph(new TimeCode(1000), new TimeCode(2000), 'Original');
      const originalId = original.id;

      const clone = original.clone(false);

      expect(clone.id).toBe(originalId);
    });
  });

  describe('toString', () => {
    it('should format as string', () => {
      const para = new Paragraph(new TimeCode(1000), new TimeCode(2000), 'Hello');
      const str = para.toString();

      expect(str).toContain('00:00:01,000');
      expect(str).toContain('00:00:02,000');
      expect(str).toContain('Hello');
    });
  });

  describe('JSON serialization', () => {
    it('should serialize to JSON', () => {
      const para = new Paragraph(new TimeCode(1000), new TimeCode(2000), 'Test');
      para.number = 5;
      para.actor = 'Alice';
      para.style = 'Default';

      const json = para.toJSON();

      expect(json.text).toBe('Test');
      expect(json.startTime).toBe(1000);
      expect(json.endTime).toBe(2000);
      expect(json.number).toBe(5);
      expect(json.actor).toBe('Alice');
      expect(json.style).toBe('Default');
    });

    it('should deserialize from JSON', () => {
      const json = {
        number: 3,
        text: 'From JSON',
        startTime: 5000,
        endTime: 7000,
        actor: 'Bob',
        style: 'Italic',
        forced: true,
        id: 'test-id-123',
      };

      const para = Paragraph.fromJSON(json);

      expect(para.text).toBe('From JSON');
      expect(para.number).toBe(3);
      expect(para.startTime.totalMilliseconds).toBe(5000);
      expect(para.endTime.totalMilliseconds).toBe(7000);
      expect(para.actor).toBe('Bob');
      expect(para.style).toBe('Italic');
      expect(para.forced).toBe(true);
      expect(para.id).toBe('test-id-123');
    });

    it('should round-trip through JSON', () => {
      const original = new Paragraph(new TimeCode(1000), new TimeCode(3000), 'Round trip');
      original.number = 10;
      original.actor = 'Charlie';

      const json = original.toJSON();
      const restored = Paragraph.fromJSON(json);

      expect(restored.text).toBe(original.text);
      expect(restored.number).toBe(original.number);
      expect(restored.actor).toBe(original.actor);
      expect(restored.startTime.totalMilliseconds).toBe(original.startTime.totalMilliseconds);
    });
  });

  describe('properties', () => {
    it('should set and get all properties', () => {
      const para = new Paragraph();

      para.number = 42;
      para.text = 'Test text';
      para.forced = true;
      para.extra = 'Extra info';
      para.isComment = true;
      para.actor = 'John Doe';
      para.region = 'Top';
      para.marginL = '10';
      para.marginR = '20';
      para.marginV = '30';
      para.effect = 'Fade';
      para.layer = 2;
      para.language = 'en';
      para.style = 'Bold';
      para.newSection = true;
      para.bookmark = 'Important';

      expect(para.number).toBe(42);
      expect(para.text).toBe('Test text');
      expect(para.forced).toBe(true);
      expect(para.extra).toBe('Extra info');
      expect(para.isComment).toBe(true);
      expect(para.actor).toBe('John Doe');
      expect(para.region).toBe('Top');
      expect(para.marginL).toBe('10');
      expect(para.marginR).toBe('20');
      expect(para.marginV).toBe('30');
      expect(para.effect).toBe('Fade');
      expect(para.layer).toBe(2);
      expect(para.language).toBe('en');
      expect(para.style).toBe('Bold');
      expect(para.newSection).toBe(true);
      expect(para.bookmark).toBe('Important');
    });
  });
});
