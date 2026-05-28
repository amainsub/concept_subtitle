/**
 * Encoding detection and conversion utilities
 */
import jschardet from 'jschardet';

/**
 * Detect encoding of text
 * @param {ArrayBuffer|string} data
 * @returns {object} { encoding: string, confidence: number }
 */
export function detectEncoding(data) {
  try {
    let buffer;

    if (data instanceof ArrayBuffer) {
      const uint8Array = new Uint8Array(data);
      buffer = uint8Array;
    } else if (typeof data === 'string') {
      // Convert string to bytes
      const encoder = new TextEncoder();
      buffer = encoder.encode(data);
    } else {
      buffer = data;
    }

    const result = jschardet.detect(buffer);

    return {
      encoding: result.encoding || 'UTF-8',
      confidence: result.confidence || 0,
    };
  } catch (error) {
    console.error('Encoding detection error:', error);
    return {
      encoding: 'UTF-8',
      confidence: 0,
    };
  }
}

/**
 * Read file with detected encoding
 * @param {File} file
 * @returns {Promise<{text: string, encoding: string}>}
 */
export async function readFileWithEncoding(file) {
  const arrayBuffer = await file.arrayBuffer();
  const detection = detectEncoding(arrayBuffer);

  let text;
  try {
    const decoder = new TextDecoder(detection.encoding);
    text = decoder.decode(arrayBuffer);
  } catch (error) {
    // Fallback to UTF-8
    console.warn(`Failed to decode with ${detection.encoding}, using UTF-8`);
    const decoder = new TextDecoder('UTF-8');
    text = decoder.decode(arrayBuffer);
    detection.encoding = 'UTF-8';
  }

  return {
    text,
    encoding: detection.encoding,
    confidence: detection.confidence,
  };
}

/**
 * Common encoding names mapping
 */
export const ENCODING_NAMES = {
  'UTF-8': 'UTF-8 (유니코드)',
  'EUC-KR': 'EUC-KR (한국어)',
  'CP949': 'CP949 (한국어 확장)',
  'ISO-8859-1': 'ISO-8859-1 (서유럽)',
  'WINDOWS-1252': 'Windows-1252 (서유럽)',
  'SHIFT_JIS': 'Shift-JIS (일본어)',
  'GB2312': 'GB2312 (중국어 간체)',
  'BIG5': 'Big5 (중국어 번체)',
};

/**
 * Get friendly encoding name
 */
export function getFriendlyEncodingName(encoding) {
  return ENCODING_NAMES[encoding] || encoding;
}
