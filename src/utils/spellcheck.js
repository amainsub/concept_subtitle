/**
 * Spell Check Utility using Typo.js (Hunspell port)
 * Compatible with Subtitle Edit's spell checking
 * Ported from SpellCheck.cs with all exception handling
 */
import Typo from 'typo-js';
import { userDictionary } from './user-dictionary.js';

class SpellChecker {
  constructor() {
    this.dictionary = null;
    this.isLoading = false;
    this.isLoaded = false;
    this.languageName = 'ko_KR';
  }

  /**
   * Load Korean dictionary
   */
  async loadDictionary() {
    if (this.isLoaded) return true;
    if (this.isLoading) {
      // Wait for loading to complete
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.isLoaded;
    }

    this.isLoading = true;

    try {
      console.log('Loading Korean dictionary...');

      // Load .aff file
      const affResponse = await fetch('/dictionaries/ko-KR.aff');
      const affData = await affResponse.text();

      // Load .dic file
      const dicResponse = await fetch('/dictionaries/ko-KR.dic');
      const dicData = await dicResponse.text();

      console.log('Dictionary files loaded, initializing Typo...');

      // Initialize Typo dictionary
      this.dictionary = new Typo('ko_KR', affData, dicData, {
        platform: 'web'
      });

      this.isLoaded = true;
      console.log('Korean dictionary loaded successfully');
      return true;

    } catch (error) {
      console.error('Failed to load dictionary:', error);
      this.isLoaded = false;
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Check if a word is spelled correctly (with full Subtitle Edit logic)
   * @param {string} word - The word to check
   * @param {Object} context - Context information
   * @param {string} context.fullText - Full paragraph text
   * @param {number} context.wordIndex - Index of this word
   * @param {Array} context.allWords - All words in paragraph
   * @param {string} context.prefix - Prefix character (like ')
   * @returns {boolean}
   */
  checkWithContext(word, context = {}) {
    if (!this.dictionary || !this.isLoaded) {
      return true;
    }

    // Skip empty or very short
    if (!word || word.length === 0) return true;
    if (/^\d+$/.test(word)) return true; // Pure numbers

    // Check user dictionary and skip list first
    if (userDictionary.hasUserWord(word)) return true;
    if (userDictionary.hasName(word)) return true;
    if (userDictionary.isSkipped(word)) return true;

    const { fullText = '', wordIndex = 0, allWords = [], prefix = '' } = context;
    let correct = false;

    // 1. Check with prefix (like 'word)
    if (prefix === "'" && word.length >= 1 && (this.doSpell(prefix + word) || userDictionary.hasUserWord(prefix + word))) {
      return true;
    }

    if (word.length === 1) {
      // Single character exceptions (language-specific)
      if (word === "'") return true;
      if (this.languageName.startsWith('en') && (word.toLowerCase() === 'a' || word === 'I')) return true;
      if (this.languageName.startsWith('da') && word.toLowerCase() === 'i') return true;
      if (this.languageName.startsWith('fr') && ['a', 'à', 'y'].includes(word.toLowerCase())) return true;
      if (this.languageName.startsWith('es') && ['a', 'y', 'o', 'u'].includes(word.toLowerCase())) return true;
      return false;
    }

    // 2. Basic spell check
    correct = this.doSpell(word);

    // 3. Try without trailing punctuation
    if (!correct && /[`']$/.test(word)) {
      correct = this.doSpell(word.replace(/[`']+$/g, ''));
    }

    // 4. Try without 's (possessive)
    if (!correct && word.endsWith("'s") && word.length > 4) {
      correct = this.doSpell(word.replace(/'s$/g, ''));
    }

    // 5. Try without trailing apostrophe
    if (!correct && word.endsWith("'")) {
      const trimmed = word.slice(0, -1);
      if (this.doSpell(trimmed)) {
        return true;
      }
    }

    // 6. Remove invisible unicode characters
    if (!correct) {
      const cleaned = word
        .replace(/​/g, '') // zero width space
        .replace(/⁠/g, '') // word joiner
        .replace(/﻿/g, ''); // zero width no-break space
      if (cleaned !== word) {
        correct = this.doSpell(cleaned);
      }
    }

    // 7. Check for URLs (www.google.com)
    if (!correct && wordIndex > 0 && wordIndex < allWords.length - 1) {
      const prevWord = allWords[wordIndex - 1]?.word?.toLowerCase();
      const nextWord = allWords[wordIndex + 1]?.word?.toLowerCase();
      if (prevWord === 'www' && ['com', 'org', 'net', 'edu', 'gov'].includes(nextWord)) {
        if (fullText.includes(`${prevWord}.${word}.${nextWord}`)) {
          return true; // It's a URL
        }
      }
    }

    // 8. Check hyphenated words with previous word
    if (!correct && wordIndex > 0 && allWords[wordIndex - 1]) {
      const prevWord = allWords[wordIndex - 1].word;
      const hyphenated = prevWord + '-' + word;
      if (this.doSpell(hyphenated) || userDictionary.hasUserWord(hyphenated)) {
        return true;
      }
      // Non-breaking hyphen
      const hyphenatedNb = prevWord + '‑' + word;
      if (this.doSpell(hyphenatedNb) || userDictionary.hasUserWord(hyphenatedNb)) {
        return true;
      }
      // Check user dictionary for -word
      if (userDictionary.hasUserWord('-' + word)) {
        return true;
      }
    }

    // 9. Check hyphenated words with next word
    if (!correct && wordIndex < allWords.length - 1 && allWords[wordIndex + 1]) {
      const nextWord = allWords[wordIndex + 1].word;
      const hyphenated = word + '-' + nextWord;
      if (this.doSpell(hyphenated) || userDictionary.hasUserWord(hyphenated) || userDictionary.hasName(hyphenated)) {
        return true;
      }
    }

    // 10. Check em dash at end
    if (!correct && word.endsWith('—')) {
      const trimmed = word.slice(0, -1);
      if (this.doSpell(trimmed) || userDictionary.hasUserWord(trimmed) || userDictionary.hasName(trimmed)) {
        return true;
      }
    }

    // 11. Check name concatenation with previous word
    if (!correct && wordIndex > 0 && allWords[wordIndex - 1]) {
      const prevWord = allWords[wordIndex - 1].word;
      const combined = prevWord + ' ' + word;
      if (userDictionary.hasName(combined)) {
        return true;
      }
    }

    return correct;
  }

  /**
   * Simple spell check (without context)
   * @param {string} word
   * @returns {boolean}
   */
  check(word) {
    return this.checkWithContext(word, {});
  }

  /**
   * Internal spell check using Hunspell
   * @param {string} word
   * @returns {boolean}
   */
  doSpell(word) {
    if (!this.dictionary || !this.isLoaded) return false;

    try {
      return this.dictionary.check(word);
    } catch (error) {
      console.error('Error checking word:', word, error);
      return false;
    }
  }

  /**
   * Get spelling suggestions for a word
   * @param {string} word
   * @returns {string[]}
   */
  suggest(word) {
    if (!this.dictionary || !this.isLoaded) {
      return [];
    }

    const suggestions = this.dictionary.suggest(word);

    // Add common Korean corrections
    const extraSuggestions = this.getKoreanSuggestions(word);

    // Merge and deduplicate
    const combined = [...new Set([...suggestions, ...extraSuggestions])];

    return combined.slice(0, 10); // Return top 10
  }

  /**
   * Get common Korean typo corrections
   * @param {string} word
   * @returns {string[]}
   */
  getKoreanSuggestions(word) {
    const suggestions = [];

    // Common Korean typos
    const koreanCorrections = {
      '있엇': '있었',
      '갔엇': '갔었',
      '왔엇': '왔었',
      '했엇': '했었',
      '됬': '됐',
      '됬어': '됐어',
      '됬다': '됐다',
      '되여': '돼',
      '되요': '돼요',
      '안되': '안 돼',
      '않되': '안 돼',
      '웬': '왠',
      '왠지': '웬지',
      '어떻해': '어떻게',
      '그렇케': '그렇게',
      '이렇케': '이렇게',
      '저렇케': '저렇게',
    };

    if (koreanCorrections[word]) {
      suggestions.push(koreanCorrections[word]);
    }

    // English case variations
    if (/[a-zA-Z]/.test(word)) {
      if (word !== word.toLowerCase()) {
        suggestions.push(word.toLowerCase());
      }
      if (word !== word.toUpperCase()) {
        suggestions.push(word.toUpperCase());
      }
      if (word.length > 1) {
        const titleCase = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        if (word !== titleCase) {
          suggestions.push(titleCase);
        }
      }
    }

    return suggestions;
  }
}

// Singleton instance
export const spellChecker = new SpellChecker();
