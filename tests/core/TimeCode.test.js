import { describe, it, expect } from 'vitest';
import { TimeCode } from '../../src/core/common/TimeCode.js';

describe('TimeCode', () => {
  describe('constructor', () => {
    it('should create from total milliseconds', () => {
      const tc = new TimeCode(83456);
      expect(tc.totalMilliseconds).toBe(83456);
    });

    it('should create from components', () => {
      const tc = new TimeCode({ hours: 1, minutes: 23, seconds: 45, milliseconds: 678 });
      expect(tc.hours).toBe(1);
      expect(tc.minutes).toBe(23);
      expect(tc.seconds).toBe(45);
      expect(tc.milliseconds).toBe(678);
    });

    it('should default to zero', () => {
      const tc = new TimeCode();
      expect(tc.totalMilliseconds).toBe(0);
    });
  });

  describe('fromSeconds', () => {
    it('should create from seconds', () => {
      const tc = TimeCode.fromSeconds(123.456);
      expect(tc.totalMilliseconds).toBe(123456);
    });
  });

  describe('parseToMilliseconds', () => {
    it('should parse HH:MM:SS,MS format', () => {
      const ms = TimeCode.parseToMilliseconds('01:23:45,678');
      expect(ms).toBe(1 * 3600000 + 23 * 60000 + 45 * 1000 + 678);
    });

    it('should parse HH:MM:SS.MS format', () => {
      const ms = TimeCode.parseToMilliseconds('01:23:45.678');
      expect(ms).toBe(1 * 3600000 + 23 * 60000 + 45 * 1000 + 678);
    });

    it('should parse MM:SS,MS format', () => {
      const ms = TimeCode.parseToMilliseconds('23:45,678');
      expect(ms).toBe(23 * 60000 + 45 * 1000 + 678);
    });

    it('should pad milliseconds to 3 digits', () => {
      const ms = TimeCode.parseToMilliseconds('01:23:45,67');
      expect(ms).toBe(1 * 3600000 + 23 * 60000 + 45 * 1000 + 670);
    });

    it('should handle single digit milliseconds', () => {
      const ms = TimeCode.parseToMilliseconds('01:23:45,6');
      expect(ms).toBe(1 * 3600000 + 23 * 60000 + 45 * 1000 + 600);
    });

    it('should return 0 for invalid input', () => {
      expect(TimeCode.parseToMilliseconds('')).toBe(0);
      expect(TimeCode.parseToMilliseconds('invalid')).toBe(0);
      expect(TimeCode.parseToMilliseconds(null)).toBe(0);
    });
  });

  describe('parseHHMMSSFFToMilliseconds', () => {
    it('should parse frame-based timecode at 25fps', () => {
      const ms = TimeCode.parseHHMMSSFFToMilliseconds('01:23:45:12', 25);
      const expected = 1 * 3600000 + 23 * 60000 + 45 * 1000 + Math.round((12 * 1000) / 25);
      expect(ms).toBe(expected);
    });

    it('should parse frame-based timecode at 30fps', () => {
      const ms = TimeCode.parseHHMMSSFFToMilliseconds('01:23:45:15', 30);
      const expected = 1 * 3600000 + 23 * 60000 + 45 * 1000 + Math.round((15 * 1000) / 30);
      expect(ms).toBe(expected);
    });
  });

  describe('components', () => {
    it('should get hours, minutes, seconds, milliseconds', () => {
      const tc = new TimeCode({ hours: 2, minutes: 30, seconds: 45, milliseconds: 123 });
      expect(tc.hours).toBe(2);
      expect(tc.minutes).toBe(30);
      expect(tc.seconds).toBe(45);
      expect(tc.milliseconds).toBe(123);
    });

    it('should set hours', () => {
      const tc = new TimeCode({ hours: 1, minutes: 30, seconds: 45, milliseconds: 123 });
      tc.hours = 3;
      expect(tc.hours).toBe(3);
      expect(tc.minutes).toBe(30);
      expect(tc.seconds).toBe(45);
      expect(tc.milliseconds).toBe(123);
    });

    it('should set minutes', () => {
      const tc = new TimeCode({ hours: 1, minutes: 30, seconds: 45, milliseconds: 123 });
      tc.minutes = 15;
      expect(tc.hours).toBe(1);
      expect(tc.minutes).toBe(15);
      expect(tc.seconds).toBe(45);
      expect(tc.milliseconds).toBe(123);
    });
  });

  describe('toString', () => {
    it('should format as HH:MM:SS,MS', () => {
      const tc = new TimeCode({ hours: 1, minutes: 23, seconds: 45, milliseconds: 678 });
      expect(tc.toString()).toBe('01:23:45,678');
    });

    it('should format with localized separator', () => {
      const tc = new TimeCode({ hours: 1, minutes: 23, seconds: 45, milliseconds: 678 });
      expect(tc.toString(true)).toBe('01:23:45.678');
    });

    it('should handle zero time', () => {
      const tc = new TimeCode(0);
      expect(tc.toString()).toBe('00:00:00,000');
    });

    it('should handle large hours', () => {
      const tc = new TimeCode({ hours: 99, minutes: 59, seconds: 59, milliseconds: 999 });
      expect(tc.toString()).toBe('99:59:59,999');
    });
  });

  describe('toShortString', () => {
    it('should omit hours if zero', () => {
      const tc = new TimeCode({ hours: 0, minutes: 5, seconds: 30, milliseconds: 500 });
      expect(tc.toShortString()).toBe('5:30,500');
    });

    it('should omit hours and minutes if both zero', () => {
      const tc = new TimeCode({ hours: 0, minutes: 0, seconds: 30, milliseconds: 500 });
      expect(tc.toShortString()).toBe('30,500');
    });

    it('should show full format if hours present', () => {
      const tc = new TimeCode({ hours: 1, minutes: 5, seconds: 30, milliseconds: 500 });
      expect(tc.toShortString()).toBe('1:05:30,500');
    });
  });

  describe('toSubRipString', () => {
    it('should format for SubRip', () => {
      const tc = new TimeCode({ hours: 1, minutes: 23, seconds: 45, milliseconds: 678 });
      expect(tc.toSubRipString()).toBe('01:23:45,678');
    });
  });

  describe('toSMPTEString', () => {
    it('should format as HH:MM:SS:FF at 25fps', () => {
      const tc = new TimeCode({ hours: 1, minutes: 23, seconds: 45, milliseconds: 480 });
      const expected = '01:23:45:12'; // 480ms * 25fps / 1000 = 12 frames
      expect(tc.toSMPTEString(25)).toBe(expected);
    });
  });

  describe('arithmetic operations', () => {
    it('should add milliseconds', () => {
      const tc = new TimeCode(1000);
      const result = tc.add(500);
      expect(result.totalMilliseconds).toBe(1500);
      expect(tc.totalMilliseconds).toBe(1000); // original unchanged
    });

    it('should subtract milliseconds', () => {
      const tc = new TimeCode(1000);
      const result = tc.subtract(500);
      expect(result.totalMilliseconds).toBe(500);
      expect(tc.totalMilliseconds).toBe(1000); // original unchanged
    });

    it('should clone', () => {
      const tc = new TimeCode(12345);
      const clone = tc.clone();
      expect(clone.totalMilliseconds).toBe(12345);
      expect(clone).not.toBe(tc); // different instance
    });
  });

  describe('totalSeconds', () => {
    it('should get total seconds', () => {
      const tc = new TimeCode(5000);
      expect(tc.totalSeconds).toBe(5);
    });

    it('should set total seconds', () => {
      const tc = new TimeCode();
      tc.totalSeconds = 10;
      expect(tc.totalMilliseconds).toBe(10000);
    });
  });

  describe('isMaxTime', () => {
    it('should detect max time', () => {
      const tc = new TimeCode(TimeCode.MAX_TIME_TOTAL_MILLISECONDS);
      expect(tc.isMaxTime).toBe(true);
    });

    it('should not detect regular time as max', () => {
      const tc = new TimeCode(1000);
      expect(tc.isMaxTime).toBe(false);
    });
  });

  describe('maintain millisecond precision', () => {
    it('should preserve decimal milliseconds', () => {
      const tc = new TimeCode(83456.789);
      expect(tc.totalMilliseconds).toBe(83456.789);
    });
  });
});
