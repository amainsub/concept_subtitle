import { describe, it, expect, beforeEach } from 'vitest';
import { Subtitle } from '../../src/core/common/Subtitle.js';
import { Paragraph } from '../../src/core/common/Paragraph.js';
import { TimeCode } from '../../src/core/common/TimeCode.js';

describe('Subtitle', () => {
  let subtitle;

  beforeEach(() => {
    subtitle = new Subtitle();
  });

  describe('constructor', () => {
    it('should create empty subtitle', () => {
      expect(subtitle.paragraphs).toEqual([]);
      expect(subtitle.header).toBe('');
      expect(subtitle.footer).toBe('');
      expect(subtitle.fileName).toBe('Untitled');
      expect(subtitle.originalEncoding).toBe('utf-8');
    });

    it('should create from paragraphs array', () => {
      const paragraphs = [
        new Paragraph(new TimeCode(1000), new TimeCode(2000), 'First'),
        new Paragraph(new TimeCode(3000), new TimeCode(4000), 'Second'),
      ];

      const sub = new Subtitle(paragraphs);
      expect(sub.paragraphs.length).toBe(2);
      expect(sub.paragraphs[0].text).toBe('First');
    });

    it('should copy from another subtitle', () => {
      const original = new Subtitle();
      original.addParagraph(new Paragraph(new TimeCode(1000), new TimeCode(2000), 'Test'));
      original.header = 'Header';
      original.footer = 'Footer';
      original.fileName = 'test.srt';

      const copy = new Subtitle(original);

      expect(copy.paragraphs.length).toBe(1);
      expect(copy.paragraphs[0].text).toBe('Test');
      expect(copy.header).toBe('Header');
      expect(copy.footer).toBe('Footer');
      expect(copy.fileName).toBe('test.srt');
      expect(copy.historyItems.length).toBe(0); // History not copied
    });
  });

  describe('paragraph management', () => {
    it('should add paragraph', () => {
      const para = new Paragraph(new TimeCode(1000), new TimeCode(2000), 'Test');
      subtitle.addParagraph(para);

      expect(subtitle.paragraphs.length).toBe(1);
      expect(subtitle.paragraphs[0]).toBe(para);
    });

    it('should insert paragraph at index', () => {
      subtitle.addParagraph(new Paragraph(new TimeCode(1000), new TimeCode(2000), 'First'));
      subtitle.addParagraph(new Paragraph(new TimeCode(5000), new TimeCode(6000), 'Third'));

      subtitle.insertParagraph(1, new Paragraph(new TimeCode(3000), new TimeCode(4000), 'Second'));

      expect(subtitle.paragraphs.length).toBe(3);
      expect(subtitle.paragraphs[1].text).toBe('Second');
    });

    it('should remove paragraph at index', () => {
      subtitle.addParagraph(new Paragraph(new TimeCode(1000), new TimeCode(2000), 'First'));
      subtitle.addParagraph(new Paragraph(new TimeCode(3000), new TimeCode(4000), 'Second'));

      subtitle.removeParagraphAt(0);

      expect(subtitle.paragraphs.length).toBe(1);
      expect(subtitle.paragraphs[0].text).toBe('Second');
    });

    it('should remove paragraph by reference', () => {
      const para = new Paragraph(new TimeCode(1000), new TimeCode(2000), 'Test');
      subtitle.addParagraph(para);
      subtitle.addParagraph(new Paragraph(new TimeCode(3000), new TimeCode(4000), 'Keep'));

      subtitle.removeParagraph(para);

      expect(subtitle.paragraphs.length).toBe(1);
      expect(subtitle.paragraphs[0].text).toBe('Keep');
    });

    it('should clear all paragraphs', () => {
      subtitle.addParagraph(new Paragraph(new TimeCode(1000), new TimeCode(2000), 'First'));
      subtitle.addParagraph(new Paragraph(new TimeCode(3000), new TimeCode(4000), 'Second'));

      subtitle.clear();

      expect(subtitle.paragraphs.length).toBe(0);
    });

    it('should get length', () => {
      expect(subtitle.length).toBe(0);

      subtitle.addParagraph(new Paragraph(new TimeCode(1000), new TimeCode(2000), 'Test'));
      expect(subtitle.length).toBe(1);
    });
  });

  describe('getParagraphOrDefault', () => {
    beforeEach(() => {
      subtitle.addParagraph(new Paragraph(new TimeCode(1000), new TimeCode(2000), 'First'));
      subtitle.addParagraph(new Paragraph(new TimeCode(3000), new TimeCode(4000), 'Second'));
    });

    it('should get paragraph by valid index', () => {
      const para = subtitle.getParagraphOrDefault(0);
      expect(para.text).toBe('First');
    });

    it('should return null for negative index', () => {
      const para = subtitle.getParagraphOrDefault(-1);
      expect(para).toBeNull();
    });

    it('should return null for index out of bounds', () => {
      const para = subtitle.getParagraphOrDefault(10);
      expect(para).toBeNull();
    });
  });

  describe('getParagraphOrDefaultById', () => {
    it('should get paragraph by ID', () => {
      const para = new Paragraph(new TimeCode(1000), new TimeCode(2000), 'Test');
      const id = para.id;
      subtitle.addParagraph(para);

      const found = subtitle.getParagraphOrDefaultById(id);
      expect(found).toBe(para);
    });

    it('should return null for non-existent ID', () => {
      const found = subtitle.getParagraphOrDefaultById('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('renumber', () => {
    it('should renumber from 1', () => {
      subtitle.addParagraph(new Paragraph(new TimeCode(1000), new TimeCode(2000), 'First'));
      subtitle.addParagraph(new Paragraph(new TimeCode(3000), new TimeCode(4000), 'Second'));
      subtitle.addParagraph(new Paragraph(new TimeCode(5000), new TimeCode(6000), 'Third'));

      subtitle.renumber();

      expect(subtitle.paragraphs[0].number).toBe(1);
      expect(subtitle.paragraphs[1].number).toBe(2);
      expect(subtitle.paragraphs[2].number).toBe(3);
    });

    it('should renumber from custom start', () => {
      subtitle.addParagraph(new Paragraph(new TimeCode(1000), new TimeCode(2000), 'First'));
      subtitle.addParagraph(new Paragraph(new TimeCode(3000), new TimeCode(4000), 'Second'));

      subtitle.renumber(10);

      expect(subtitle.paragraphs[0].number).toBe(10);
      expect(subtitle.paragraphs[1].number).toBe(11);
    });
  });

  describe('sort', () => {
    it('should sort paragraphs by start time', () => {
      subtitle.addParagraph(new Paragraph(new TimeCode(5000), new TimeCode(6000), 'Third'));
      subtitle.addParagraph(new Paragraph(new TimeCode(1000), new TimeCode(2000), 'First'));
      subtitle.addParagraph(new Paragraph(new TimeCode(3000), new TimeCode(4000), 'Second'));

      subtitle.sort();

      expect(subtitle.paragraphs[0].text).toBe('First');
      expect(subtitle.paragraphs[1].text).toBe('Second');
      expect(subtitle.paragraphs[2].text).toBe('Third');
    });
  });

  describe('timing adjustments', () => {
    beforeEach(() => {
      subtitle.addParagraph(new Paragraph(new TimeCode(1000), new TimeCode(2000), 'First'));
      subtitle.addParagraph(new Paragraph(new TimeCode(3000), new TimeCode(4000), 'Second'));
    });

    it('should add time to all paragraphs', () => {
      subtitle.addTimeToAllParagraphs(500);

      expect(subtitle.paragraphs[0].startTime.totalMilliseconds).toBe(1500);
      expect(subtitle.paragraphs[0].endTime.totalMilliseconds).toBe(2500);
      expect(subtitle.paragraphs[1].startTime.totalMilliseconds).toBe(3500);
    });

    it('should adjust all times with factor and offset', () => {
      subtitle.adjustAllTimes(2, 1); // Double speed and add 1 second

      expect(subtitle.paragraphs[0].startTime.totalMilliseconds).toBe(1000 * 2 + 1000);
      expect(subtitle.paragraphs[0].endTime.totalMilliseconds).toBe(2000 * 2 + 1000);
    });

    it('should change frame rate', () => {
      subtitle.changeFrameRate(25, 30);

      // 25 fps to 30 fps => factor = 25/30 = 0.8333...
      expect(subtitle.paragraphs[0].startTime.totalMilliseconds).toBeCloseTo(833.33, 1);
      expect(subtitle.paragraphs[1].startTime.totalMilliseconds).toBeCloseTo(2500, 1);
    });
  });

  describe('history', () => {
    it('should save to history', () => {
      subtitle.addParagraph(new Paragraph(new TimeCode(1000), new TimeCode(2000), 'Original'));

      subtitle.saveToHistory('Initial state');

      expect(subtitle.historyItems.length).toBe(1);
      expect(subtitle.canUndo).toBe(true);
    });

    it('should undo', () => {
      subtitle.addParagraph(new Paragraph(new TimeCode(1000), new TimeCode(2000), 'Original'));
      subtitle.saveToHistory('Initial');

      subtitle.paragraphs[0].text = 'Modified';
      const modified = subtitle.paragraphs[0].text;

      const success = subtitle.undo();

      expect(success).toBe(true);
      expect(subtitle.paragraphs[0].text).toBe('Original');
    });

    it('should not undo when no history', () => {
      const success = subtitle.undo();
      expect(success).toBe(false);
    });

    it('should limit history items', () => {
      for (let i = 0; i < 150; i++) {
        subtitle.saveToHistory(`Action ${i}`);
      }

      expect(subtitle.historyItems.length).toBe(Subtitle.MAXIMUM_HISTORY_ITEMS);
    });

    it('should clear history', () => {
      subtitle.saveToHistory('Test');
      subtitle.clearHistory();

      expect(subtitle.historyItems.length).toBe(0);
      expect(subtitle.canUndo).toBe(false);
    });
  });

  describe('getTotalDuration', () => {
    it('should return 0 for empty subtitle', () => {
      expect(subtitle.getTotalDuration()).toBe(0);
    });

    it('should return end time of last paragraph', () => {
      subtitle.addParagraph(new Paragraph(new TimeCode(1000), new TimeCode(2000), 'First'));
      subtitle.addParagraph(new Paragraph(new TimeCode(3000), new TimeCode(5000), 'Second'));

      expect(subtitle.getTotalDuration()).toBe(5000);
    });
  });

  describe('getStatistics', () => {
    it('should return zero stats for empty subtitle', () => {
      const stats = subtitle.getStatistics();

      expect(stats.numberOfLines).toBe(0);
      expect(stats.numberOfWords).toBe(0);
      expect(stats.numberOfCharacters).toBe(0);
      expect(stats.totalDuration).toBe(0);
    });

    it('should calculate statistics', () => {
      subtitle.addParagraph(new Paragraph(new TimeCode(0), new TimeCode(1000), 'Hello world'));
      subtitle.addParagraph(new Paragraph(new TimeCode(1000), new TimeCode(3000), 'Test test'));

      const stats = subtitle.getStatistics();

      expect(stats.numberOfLines).toBe(2);
      expect(stats.numberOfWords).toBe(4); // "Hello world" + "Test test"
      expect(stats.totalDuration).toBe(3000);
    });
  });

  describe('clone', () => {
    it('should clone subtitle', () => {
      subtitle.addParagraph(new Paragraph(new TimeCode(1000), new TimeCode(2000), 'Test'));
      subtitle.header = 'Header';

      const clone = subtitle.clone();

      expect(clone.paragraphs.length).toBe(1);
      expect(clone.paragraphs[0].text).toBe('Test');
      expect(clone.header).toBe('Header');
      expect(clone.paragraphs[0].id).not.toBe(subtitle.paragraphs[0].id); // New IDs
    });

    it('should clone with same IDs if requested', () => {
      subtitle.addParagraph(new Paragraph(new TimeCode(1000), new TimeCode(2000), 'Test'));
      const originalId = subtitle.paragraphs[0].id;

      const clone = subtitle.clone(false);

      expect(clone.paragraphs[0].id).toBe(originalId);
    });
  });

  describe('JSON serialization', () => {
    it('should serialize to JSON', () => {
      subtitle.addParagraph(new Paragraph(new TimeCode(1000), new TimeCode(2000), 'Test'));
      subtitle.header = 'Header';
      subtitle.footer = 'Footer';
      subtitle.fileName = 'test.srt';

      const json = subtitle.toJSON();

      expect(json.paragraphs.length).toBe(1);
      expect(json.header).toBe('Header');
      expect(json.footer).toBe('Footer');
      expect(json.fileName).toBe('test.srt');
    });

    it('should deserialize from JSON', () => {
      const json = {
        paragraphs: [
          { text: 'Test', startTime: 1000, endTime: 2000, number: 1, id: 'test-id' },
        ],
        header: 'Header',
        footer: 'Footer',
        fileName: 'test.srt',
      };

      const sub = Subtitle.fromJSON(json);

      expect(sub.paragraphs.length).toBe(1);
      expect(sub.paragraphs[0].text).toBe('Test');
      expect(sub.header).toBe('Header');
      expect(sub.footer).toBe('Footer');
      expect(sub.fileName).toBe('test.srt');
    });
  });
});
