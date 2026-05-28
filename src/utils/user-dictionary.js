/**
 * User Dictionary and Names List
 * LocalStorage-based persistent storage
 */

class UserDictionary {
  constructor() {
    this.userWords = new Set();
    this.namesList = new Set();
    this.skipAllList = new Set(); // Temporary skip list (session only)
    this.load();
  }

  /**
   * Load from localStorage
   */
  load() {
    try {
      const userWordsData = localStorage.getItem('subtitle-edit-user-words');
      if (userWordsData) {
        this.userWords = new Set(JSON.parse(userWordsData));
      }

      const namesData = localStorage.getItem('subtitle-edit-names');
      if (namesData) {
        this.namesList = new Set(JSON.parse(namesData));
      }

      console.log(`Loaded ${this.userWords.size} user words, ${this.namesList.size} names`);
    } catch (error) {
      console.error('Failed to load user dictionary:', error);
    }
  }

  /**
   * Save to localStorage
   */
  save() {
    try {
      localStorage.setItem('subtitle-edit-user-words', JSON.stringify([...this.userWords]));
      localStorage.setItem('subtitle-edit-names', JSON.stringify([...this.namesList]));
    } catch (error) {
      console.error('Failed to save user dictionary:', error);
    }
  }

  /**
   * Add word to user dictionary
   */
  addUserWord(word) {
    this.userWords.add(word);
    this.save();
  }

  /**
   * Add to names list
   */
  addName(word) {
    this.namesList.add(word);
    this.save();
  }

  /**
   * Add to skip all list (temporary)
   */
  addSkipAll(word) {
    this.skipAllList.add(word.toUpperCase());
  }

  /**
   * Check if word is in user dictionary
   */
  hasUserWord(word) {
    return this.userWords.has(word);
  }

  /**
   * Check if word is in names list
   */
  hasName(word) {
    return this.namesList.has(word);
  }

  /**
   * Check if word is in skip all list
   */
  isSkipped(word) {
    return this.skipAllList.has(word.toUpperCase());
  }

  /**
   * Clear skip all list (at end of session)
   */
  clearSkipAll() {
    this.skipAllList.clear();
  }

  /**
   * Remove word from user dictionary
   */
  removeUserWord(word) {
    this.userWords.delete(word);
    this.save();
  }

  /**
   * Remove from names list
   */
  removeName(word) {
    this.namesList.delete(word);
    this.save();
  }

  /**
   * Get all user words
   */
  getUserWords() {
    return [...this.userWords];
  }

  /**
   * Get all names
   */
  getNames() {
    return [...this.namesList];
  }
}

// Singleton instance
export const userDictionary = new UserDictionary();
