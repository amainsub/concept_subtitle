import { describe, it, expect } from 'vitest';
import { SubStationAlpha } from '../../src/core/formats/SubStationAlpha.js';
import { TimeCode } from '../../src/core/common/TimeCode.js';

describe('SubStationAlpha', () => {
  const format = new SubStationAlpha();

  it('should identify SSA format', () => {
    const lines = [
      '[Script Info]',
      'Title: Test',
      '',
      '[V4 Styles]',
      'Format: Name, Fontname, Fontsize',
      'Style: Default,Arial,20',
      '',
      '[Events]',
      'Format: Marked, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
      'Dialogue: Marked=0,0:00:01.00,0:00:03.00,Default,,0,0,0,,Test subtitle'
    ];

    expect(format.isMine(lines)).toBe(true);
  });

  it('should not identify non-SSA format', () => {
    const lines = [
      '1',
      '00:00:01,000 --> 00:00:03,000',
      'Test subtitle'
    ];

    expect(format.isMine(lines)).toBe(false);
  });

  it('should parse SSA content', () => {
    const lines = [
      '[Script Info]',
      'Title: Test Movie',
      'ScriptType: v4.00',
      '',
      '[V4 Styles]',
      'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, TertiaryColour, BackColour, Bold, Italic, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, AlphaLevel, Encoding',
      'Style: Default,Arial,20,16777215,65535,65535,0,0,0,1,2,0,2,10,10,10,0,1',
      '',
      '[Events]',
      'Format: Marked, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
      'Dialogue: Marked=0,0:00:01.00,0:00:03.50,Default,,0,0,0,,First subtitle',
      'Dialogue: Marked=0,0:00:04.00,0:00:06.00,Default,Speaker,0,0,0,,Second subtitle\\NWith line break'
    ];

    const result = format.loadSubtitle(lines);

    expect(result.paragraphs).toHaveLength(2);

    // First subtitle
    expect(result.paragraphs[0].text).toBe('First subtitle');
    expect(result.paragraphs[0].startTime.totalMilliseconds).toBe(1000);
    expect(result.paragraphs[0].endTime.totalMilliseconds).toBe(3500);
    expect(result.paragraphs[0].style).toBe('Default');

    // Second subtitle with line break
    expect(result.paragraphs[1].text).toBe('Second subtitle\nWith line break');
    expect(result.paragraphs[1].startTime.totalMilliseconds).toBe(4000);
    expect(result.paragraphs[1].endTime.totalMilliseconds).toBe(6000);
    expect(result.paragraphs[1].actor).toBe('Speaker');
  });

  it('should parse SSA time correctly', () => {
    const time1 = format.parseSSATime('0:00:01.50');
    expect(time1.totalMilliseconds).toBe(1500);

    const time2 = format.parseSSATime('1:23:45.67');
    expect(time2.totalMilliseconds).toBe(5025670);
  });

  it('should format SSA time correctly', () => {
    const time = new TimeCode({ hours: 1, minutes: 23, seconds: 45, milliseconds: 670 });
    expect(format.formatSSATime(time)).toBe('1:23:45.67');
  });

  it('should convert to SSA format', () => {
    const subtitle = {
      header: '',
      paragraphs: [
        {
          text: 'First line',
          startTime: new TimeCode(1000),
          endTime: new TimeCode(3000),
          style: 'Default'
        },
        {
          text: 'Second line\nWith break',
          startTime: new TimeCode(4000),
          endTime: new TimeCode(6000),
          style: 'Default',
          actor: 'Speaker'
        }
      ]
    };

    const result = format.toText(subtitle);

    expect(result).toContain('[Script Info]');
    expect(result).toContain('[V4 Styles]');
    expect(result).toContain('[Events]');
    expect(result).toContain('Dialogue: Marked=0,0:00:01.00,0:00:03.00,Default,,0,0,0,,First line');
    expect(result).toContain('Dialogue: Marked=0,0:00:04.00,0:00:06.00,Default,Speaker,0,0,0,,Second line\\NWith break');
  });

  it('should handle comments', () => {
    const lines = [
      '[Script Info]',
      'Title: Test',
      '',
      '[V4 Styles]',
      'Format: Name, Fontname, Fontsize',
      'Style: Default,Arial,20',
      '',
      '[Events]',
      'Format: Marked, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
      'Comment: Marked=0,0:00:01.00,0:00:03.00,Default,,0,0,0,,This is a comment',
      'Dialogue: Marked=0,0:00:04.00,0:00:06.00,Default,,0,0,0,,This is dialogue'
    ];

    const result = format.loadSubtitle(lines);

    expect(result.paragraphs).toHaveLength(2);
    expect(result.paragraphs[0].isComment).toBe(true);
    expect(result.paragraphs[1].isComment).toBe(false);
  });
});
