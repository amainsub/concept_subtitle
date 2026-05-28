import { describe, it, expect } from 'vitest';
import { TimedText10 } from '../../src/core/formats/TimedText10.js';
import { TimeCode } from '../../src/core/common/TimeCode.js';

describe('TimedText10', () => {
  const format = new TimedText10();

  it('should identify TTML format', () => {
    const lines = [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<tt xmlns="http://www.w3.org/ns/ttml">',
      '  <body>',
      '    <div>',
      '      <p begin="00:00:01.000" end="00:00:03.000">Test</p>',
      '    </div>',
      '  </body>',
      '</tt>'
    ];

    expect(format.isMine(lines)).toBe(true);
  });

  it('should not identify non-TTML format', () => {
    const lines = [
      '1',
      '00:00:01,000 --> 00:00:03,000',
      'Test subtitle'
    ];

    expect(format.isMine(lines)).toBe(false);
  });

  it('should parse TTML content', () => {
    const lines = [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<tt xmlns="http://www.w3.org/ns/ttml">',
      '  <body>',
      '    <div>',
      '      <p begin="00:00:01.000" end="00:00:03.500">First subtitle</p>',
      '      <p begin="00:00:04.000" end="00:00:06.000">Second subtitle</p>',
      '    </div>',
      '  </body>',
      '</tt>'
    ];

    const result = format.loadSubtitle(lines);

    expect(result.paragraphs).toHaveLength(2);
    expect(result.paragraphs[0].text).toBe('First subtitle');
    expect(result.paragraphs[0].startTime.totalMilliseconds).toBe(1000);
    expect(result.paragraphs[0].endTime.totalMilliseconds).toBe(3500);

    expect(result.paragraphs[1].text).toBe('Second subtitle');
    expect(result.paragraphs[1].startTime.totalMilliseconds).toBe(4000);
    expect(result.paragraphs[1].endTime.totalMilliseconds).toBe(6000);
  });

  it('should parse TTML with line breaks', () => {
    const lines = [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<tt xmlns="http://www.w3.org/ns/ttml">',
      '  <body>',
      '    <div>',
      '      <p begin="00:00:01.000" end="00:00:03.000">First line<br/>Second line</p>',
      '    </div>',
      '  </body>',
      '</tt>'
    ];

    const result = format.loadSubtitle(lines);

    expect(result.paragraphs).toHaveLength(1);
    expect(result.paragraphs[0].text).toBe('First line\nSecond line');
  });

  it('should parse various TTML time formats', () => {
    // HH:MM:SS.mmm
    const time1 = format.parseTTMLTime('00:01:23.456');
    expect(time1.totalMilliseconds).toBe(83456);

    // Seconds
    const time2 = format.parseTTMLTime('12.345s');
    expect(time2.totalMilliseconds).toBe(12345);

    // Milliseconds
    const time3 = format.parseTTMLTime('5000ms');
    expect(time3.totalMilliseconds).toBe(5000);
  });

  it('should format TTML time correctly', () => {
    const time = new TimeCode({ hours: 1, minutes: 23, seconds: 45, milliseconds: 678 });

    expect(format.formatTTMLTime(time, 'hh:mm:ss.ms')).toBe('01:23:45.678');
    expect(format.formatTTMLTime(time, 'seconds')).toMatch(/5025\.678/);
    expect(format.formatTTMLTime(time, 'milliseconds')).toBe('5025678ms');
  });

  it('should convert to TTML format', () => {
    const subtitle = {
      title: 'Test Movie',
      paragraphs: [
        {
          text: 'First line',
          startTime: new TimeCode(1000),
          endTime: new TimeCode(3000)
        },
        {
          text: 'Second line\nWith break',
          startTime: new TimeCode(4000),
          endTime: new TimeCode(6000)
        }
      ]
    };

    const result = format.toText(subtitle);

    expect(result).toContain('<?xml version="1.0"');
    expect(result).toContain('http://www.w3.org/ns/ttml');
    expect(result).toContain('<p begin="00:00:01.000" end="00:00:03.000"');
    expect(result).toContain('First line</p>');
    expect(result).toContain('Second line<br/>With break</p>');
  });

  it('should parse TTML with duration instead of end time', () => {
    const lines = [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<tt xmlns="http://www.w3.org/ns/ttml">',
      '  <body>',
      '    <div>',
      '      <p begin="00:00:01.000" dur="00:00:02.500">Test subtitle</p>',
      '    </div>',
      '  </body>',
      '</tt>'
    ];

    const result = format.loadSubtitle(lines);

    expect(result.paragraphs).toHaveLength(1);
    expect(result.paragraphs[0].startTime.totalMilliseconds).toBe(1000);
    expect(result.paragraphs[0].endTime.totalMilliseconds).toBe(3500); // 1000 + 2500
  });

  it('should escape XML special characters', () => {
    const text = 'Text with <tags> & "quotes"';
    const escaped = format.escapeXml(text);

    expect(escaped).toBe('Text with &lt;tags&gt; &amp; &quot;quotes&quot;');
  });
});
