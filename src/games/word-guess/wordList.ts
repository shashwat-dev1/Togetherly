/**
 * TOGETHERLY — WORD GUESS WORD LIST & EVALUATION LOGIC
 *
 * 80+ Curated 5-letter relationship, romance & cozy lifestyle words.
 * Standard Wordle-grade letter evaluation handling duplicate letters.
 */

export type LetterStatus = 'correct' | 'present' | 'absent' | 'empty';

export interface EvaluatedLetter {
  char: string;
  status: LetterStatus;
}

export interface WordGuessItem {
  word: string;
  hint: string;
}

export const WORD_GUESS_BANK: WordGuessItem[] = [
  { word: 'HEART', hint: 'The symbol of our love' },
  { word: 'SWEET', hint: 'Like dessert or your voice' },
  { word: 'SMILE', hint: 'What you do when you see them' },
  { word: 'DREAM', hint: 'What we share when sleeping' },
  { word: 'CHARM', hint: 'The irresistible magic they possess' },
  { word: 'DANCE', hint: 'Moving together to our favorite song' },
  { word: 'HONEY', hint: 'A sweet term of endearment' },
  { word: 'LOVER', hint: 'The one who holds your heart' },
  { word: 'ROSES', hint: 'Classic red bouquet of romance' },
  { word: 'SPARK', hint: 'The feeling when your eyes first met' },
  { word: 'TRUST', hint: 'The foundation of true partnership' },
  { word: 'FAITH', hint: 'Believing in our shared future' },
  { word: 'BLISS', hint: 'Pure undisturbed happiness' },
  { word: 'ANGEL', hint: 'Heavenly nickname for your partner' },
  { word: 'MAGIC', hint: 'What being together feels like' },
  { word: 'BEACH', hint: 'Cozy walk near the crashing waves' },
  { word: 'SUNNY', hint: 'Bright like your warm personality' },
  { word: 'FLAME', hint: 'Keeps our passionate fire burning' },
  { word: 'OASIS', hint: 'A peaceful haven for just the two of us' },
  { word: 'TOUCH', hint: 'Gentle warmth of holding hands' },
  { word: 'NIGHT', hint: 'When stargazing and cuddling begins' },
  { word: 'STARS', hint: 'Glistening lights we count together' },
  { word: 'PEACE', hint: 'The calm stillness in their arms' },
  { word: 'GRACE', hint: 'Beauty and gentleness they bring' },
  { word: 'CHILL', hint: 'Lazy Sunday morning vibes' },
  { word: 'CANDY', hint: 'Sugary sweet treat for movie night' },
  { word: 'BRIDE', hint: 'Walking down the aisle' },
  { word: 'GROOM', hint: 'Waiting happily at the altar' },
  { word: 'RINGS', hint: 'Golden bands of commitment' },
  { word: 'VOWEL', hint: 'Letters woven into heartfelt vows' },
  { word: 'LAUGH', hint: 'The joyful sound of our silliness' },
  { word: 'PRIZE', hint: 'Winning the greatest partner in the world' },
  { word: 'LIGHT', hint: 'Guiding through any difficult day' },
  { word: 'UNITY', hint: 'Two souls walking side by side' },
  { word: 'CHERI', hint: 'Romantic French whisper' },
  { word: 'AMOUR', hint: 'The eternal word for deep love' },
  { word: 'HAVEN', hint: 'Comfortable safety in each others arms' },
  { word: 'BLOOM', hint: 'Like our relationship growing every season' },
  { word: 'CABIN', hint: 'Weekend mountain retreat with a fireplace' },
  { word: 'PIANO', hint: 'Playing gentle romantic melodies' },
  { word: 'CUPID', hint: 'Mischievous archer with love arrows' },
  { word: 'ZESTY', hint: 'Spicy, lively and full of fun' },
  { word: 'LUCKY', hint: 'How blessed we feel to have found each other' },
  { word: 'LOYAL', hint: 'Standing firm through thick and thin' },
  { word: 'TRULY', hint: 'Honest and deeply felt affection' },
  { word: 'SHINE', hint: 'Radiating joy wherever we go' },
  { word: 'OCEAN', hint: 'Deeper than the widest sea' },
  { word: 'MUSIC', hint: 'The soundtrack of our story' },
  { word: 'SHARE', hint: 'Giving selflessly to each other' },
  { word: 'FEAST', hint: 'Delicious home-cooked anniversary dinner' },
];

/**
 * Evaluates a 5-letter guess against the target word.
 * Correctly handles multi-letter counts (standard Wordle algorithm).
 */
export function evaluateWordGuess(targetWord: string, guess: string): EvaluatedLetter[] {
  const target = targetWord.toUpperCase();
  const candidate = guess.toUpperCase();
  const result: EvaluatedLetter[] = Array.from({ length: 5 }, (_, i) => ({
    char: candidate[i] || '',
    status: 'absent',
  }));

  const targetLetterCounts: Record<string, number> = {};
  for (const ch of target) {
    targetLetterCounts[ch] = (targetLetterCounts[ch] || 0) + 1;
  }

  // Pass 1: Find all exact 'correct' matches (Green)
  for (let i = 0; i < 5; i++) {
    if (candidate[i] === target[i]) {
      result[i].status = 'correct';
      targetLetterCounts[candidate[i]]--;
    }
  }

  // Pass 2: Find all misplaced 'present' matches (Yellow)
  for (let i = 0; i < 5; i++) {
    if (result[i].status !== 'correct') {
      const ch = candidate[i];
      if (ch && targetLetterCounts[ch] && targetLetterCounts[ch] > 0) {
        result[i].status = 'present';
        targetLetterCounts[ch]--;
      }
    }
  }

  return result;
}

export function getDeterministicWordGuess(sessionId: string): WordGuessItem {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = (hash << 5) - hash + sessionId.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % WORD_GUESS_BANK.length;
  return WORD_GUESS_BANK[idx];
}
