/**
 * TOGETHERLY — MEMORY MATCH CARDS
 * 8 Couple-Themed Matching Pairs (16 cards total)
 */

export interface MemoryCard {
  id: number;
  pairId: string;
  emoji: string;
  label: string;
}

export const MEMORY_PAIRS: { pairId: string; emoji: string; label: string }[] = [
  { pairId: 'heart', emoji: '❤️', label: 'True Love' },
  { pairId: 'ring', emoji: '💍', label: 'Diamond Ring' },
  { pairId: 'letter', emoji: '💌', label: 'Love Letter' },
  { pairId: 'cheers', emoji: '🥂', label: 'Celebration' },
  { pairId: 'teddy', emoji: '🧸', label: 'Cuddle Bear' },
  { pairId: 'rose', emoji: '🌹', label: 'Red Rose' },
  { pairId: 'flight', emoji: '✈️', label: 'Getaway' },
  { pairId: 'moon', emoji: '🌙', label: 'Stargazing' },
];

/**
 * Deterministically shuffles 16 cards from session ID seed so both devices share identical layout.
 */
export function generateMemoryDeck(sessionId: string): MemoryCard[] {
  const cards: MemoryCard[] = [];
  let id = 0;
  for (const pair of MEMORY_PAIRS) {
    cards.push({ id: id++, pairId: pair.pairId, emoji: pair.emoji, label: pair.label });
    cards.push({ id: id++, pairId: pair.pairId, emoji: pair.emoji, label: pair.label });
  }

  // PRNG shuffle using sessionId
  let seed = 0;
  for (let i = 0; i < sessionId.length; i++) {
    seed = (seed << 5) - seed + sessionId.charCodeAt(i);
    seed |= 0;
  }
  seed = Math.abs(seed) || 12345;

  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // Fisher-Yates
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  // Re-assign layout indices 0..15
  return cards.map((c, idx) => ({ ...c, id: idx }));
}
