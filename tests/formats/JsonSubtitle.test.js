import { describe, it, expect } from 'vitest';
import { JsonSubtitle } from '../../src/core/formats/JsonSubtitle.js';
import { TimeCode } from '../../src/core/common/TimeCode.js';

describe('JsonSubtitle', () => {
  const format = new JsonSubtitle();

  it('should identify JSON subtitle format', () => {
    const lines = [
      '[',
      '  {"start_time": 1.0, "end_time": 3.0, "text": "Test"}',
      ']'
    ];

    expect(format.isMine(lines)).toBe(true);
  });

  it('should not identify non-JSON format', () => {
    const lines = [
      '1',
      '00:00:01,000 --> 00:00:03,000',
      'Test subtitle'
    ];

    expect(format.isMine(lines)).toBe(false);
  });

  it('should parse JSON subtitle array', () => {
    const lines = [
      '[',
      '  {"start_time": 1.0, "end_time": 3.5, "text": "First subtitle"},',
      '  {"start_time": 4.0, "end_time": 6.0, "text": "Second subtitle"}',
      ']'
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

  it('should parse JSON with alternative field names', () => {
    const lines = [
      '[',
      '  {"startTime": 1.0, "endTime": 3.0, "content": "Test 1"},',
      '  {"start": 4.0, "end": 6.0, "text": "Test 2"}',
      ']'
    ];

    const result = format.loadSubtitle(lines);

    expect(result.paragraphs).toHaveLength(2);
    expect(result.paragraphs[0].text).toBe('Test 1');
    expect(result.paragraphs[1].text).toBe('Test 2');
  });

  it('should parse wrapped JSON format', () => {
    const lines = [
      '{',
      '  "subtitles": [',
      '    {"start_time": 1.0, "end_time": 3.0, "text": "Test"}',
      '  ]',
      '}'
    ];

    const result = format.loadSubtitle(lines);

    expect(result.paragraphs).toHaveLength(1);
    expect(result.paragraphs[0].text).toBe('Test');
  });

  it('should parse JSON with metadata', () => {
    const lines = [
      '[',
      '  {',
      '    "start_time": 1.0,',
      '    "end_time": 3.0,',
      '    "text": "Test",',
      '    "style": "bold",',
      '    "speaker": "John",',
      '    "region": "top"',
      '  }',
      ']'
    ];

    const result = format.loadSubtitle(lines);

    expect(result.paragraphs).toHaveLength(1);
    expect(result.paragraphs[0].text).toBe('Test');
    expect(result.paragraphs[0].style).toBe('bold');
    expect(result.paragraphs[0].actor).toBe('John');
    expect(result.paragraphs[0].region).toBe('top');
  });

  it('should convert to JSON format', () => {
    const subtitle = {
      paragraphs: [
        {
          text: 'First line',
          startTime: new TimeCode(1000),
          endTime: new TimeCode(3000)
        },
        {
          text: 'Second line',
          startTime: new TimeCode(4500),
          endTime: new TimeCode(6200),
          style: 'bold',
          actor: 'Speaker'
        }
      ]
    };

    const result = format.toText(subtitle);
    const parsed = JSON.parse(result);

    expect(parsed).toHaveLength(2);

    expect(parsed[0].start_time).toBe(1.0);
    expect(parsed[0].end_time).toBe(3.0);
    expect(parsed[0].text).toBe('First line');

    expect(parsed[1].start_time).toBe(4.5);
    expect(parsed[1].end_time).toBe(6.2);
    expect(parsed[1].text).toBe('Second line');
    expect(parsed[1].style).toBe('bold');
    expect(parsed[1].speaker).toBe('Speaker');
  });

  it('should handle empty array', () => {
    const lines = ['[]'];

    const result = format.loadSubtitle(lines);

    expect(result.paragraphs).toHaveLength(0);
  });

  it('should handle invalid JSON gracefully', () => {
    const lines = [
      '[',
      '  {invalid json}',
      ']'
    ];

    const result = format.loadSubtitle(lines);

    expect(result.paragraphs).toHaveLength(0);
  });

  it('should skip items with missing fields', () => {
    const lines = [
      '[',
      '  {"start_time": 1.0, "end_time": 3.0, "text": "Valid"},',
      '  {"start_time": 4.0, "text": "Missing end_time"},',
      '  {"end_time": 6.0, "text": "Missing start_time"},',
      '  {"start_time": 7.0, "end_time": 9.0, "text": "Also valid"}',
      ']'
    ];

    const result = format.loadSubtitle(lines);

    expect(result.paragraphs).toHaveLength(2);
    expect(result.paragraphs[0].text).toBe('Valid');
    expect(result.paragraphs[1].text).toBe('Also valid');
  });
});
