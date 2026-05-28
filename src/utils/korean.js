/**
 * Korean language utilities
 */

/**
 * Count Korean characters properly
 * (Hangul syllables are counted as 1 character each)
 */
export function countKoreanCharacters(text) {
  if (!text) return 0;

  let count = 0;
  for (const char of text) {
    const code = char.charCodeAt(0);

    // Korean Hangul syllables: U+AC00 to U+D7A3
    // Korean Jamo: U+1100 to U+11FF, U+3130 to U+318F
    if (
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0x1100 && code <= 0x11ff) ||
      (code >= 0x3130 && code <= 0x318f)
    ) {
      count++;
    } else if (char !== ' ' && char !== '\n' && char !== '\r' && char !== '\t') {
      count++;
    }
  }

  return count;
}

/**
 * Check if text contains Korean
 */
export function hasKorean(text) {
  if (!text) return false;

  for (const char of text) {
    const code = char.charCodeAt(0);
    if (
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0x1100 && code <= 0x11ff) ||
      (code >= 0x3130 && code <= 0x318f)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate Korean reading speed (CPM - Characters Per Minute)
 * Korean standard: 200-300 CPM for comfortable reading
 */
export function getKoreanReadingSpeed(text, durationMs) {
  if (!text || durationMs <= 0) return 0;

  const charCount = countKoreanCharacters(text);
  const durationMin = durationMs / 60000;

  return Math.round(charCount / durationMin);
}

/**
 * Check if Korean reading speed is appropriate
 * @returns {object} { isAppropriate: boolean, cpm: number, recommendation: string }
 */
export function checkKoreanReadingSpeed(text, durationMs) {
  const cpm = getKoreanReadingSpeed(text, durationMs);

  let isAppropriate = true;
  let recommendation = '적절합니다';

  if (cpm < 150) {
    recommendation = '너무 느립니다 (권장: 200-300 CPM)';
  } else if (cpm > 350) {
    isAppropriate = false;
    recommendation = '너무 빠릅니다 (권장: 200-300 CPM)';
  } else if (cpm > 300) {
    recommendation = '조금 빠릅니다 (권장: 200-300 CPM)';
  }

  return {
    isAppropriate,
    cpm,
    recommendation,
  };
}

/**
 * Auto-break long Korean lines
 * Korean text typically breaks at 15-20 characters per line
 */
export function autoBreakKoreanLines(text, maxCharsPerLine = 18) {
  if (!text) return text;

  const lines = text.split('\n');
  const result = [];

  for (const line of lines) {
    if (countKoreanCharacters(line) <= maxCharsPerLine) {
      result.push(line);
      continue;
    }

    // Break long line
    const words = line.split(' ');
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? currentLine + ' ' + word : word;

      if (countKoreanCharacters(testLine) <= maxCharsPerLine) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          result.push(currentLine);
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      result.push(currentLine);
    }
  }

  return result.join('\n');
}

/**
 * Common Korean spell-check patterns (simple version)
 * Returns array of potential errors
 */
export function checkKoreanSpelling(text) {
  if (!text) return [];

  const errors = [];

  // Common Korean spelling mistakes
  const patterns = [
    { wrong: '되요', correct: '돼요', desc: '되 + 어 = 돼' },
    { wrong: '됬다', correct: '됐다', desc: '되 + 었 = 됐' },
    { wrong: '안돼요', correct: '안 돼요', desc: '안 돼요는 띄어쓰기' },
    { wrong: '않돼', correct: '안 돼', desc: '않이 아니라 안' },
    { wrong: '할려고', correct: '하려고', desc: '하 + 려고' },
    { wrong: '먹을려고', correct: '먹으려고', desc: '먹 + 으려고' },
    { wrong: '갈께', correct: '갈게', desc: '~ㄹ게가 맞음' },
    { wrong: '있을께', correct: '있을게', desc: '~ㄹ게가 맞음' },
  ];

  for (const pattern of patterns) {
    if (text.includes(pattern.wrong)) {
      errors.push({
        wrong: pattern.wrong,
        correct: pattern.correct,
        description: pattern.desc,
        line: text,
      });
    }
  }

  return errors;
}

/**
 * Format Korean punctuation
 */
export function formatKoreanPunctuation(text) {
  if (!text) return text;

  let result = text;

  // Add space after period, comma (Korean style)
  result = result.replace(/([.,])([가-힣])/g, '$1 $2');

  // Remove space before period, comma
  result = result.replace(/\s+([.,])/g, '$1');

  // Korean quotation marks
  result = result.replace(/"([^"]+)"/g, '"$1"');

  return result;
}
