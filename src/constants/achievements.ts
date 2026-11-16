/**
 * TOGETHERLY — ACHIEVEMENT DEFINITION CATALOGUE
 *
 * 17 Comprehensive Couple Achievements across 5 Tiers and Categories:
 * 1. FIRST STEPS (First Match, First Win, First Daily Challenge)
 * 2. GAME MASTERY (Quiz Champions, Mind Readers, Drawing Duo, Board Game Rivals, Word Wizards)
 * 3. CONSISTENCY (3-Day Streak, 7-Day Streak, 14-Day Streak, 30-Day Streak)
 * 4. EXPLORATION (Game Explorer, Five Games Played, All Ten Games Played)
 * 5. SPECIAL (Perfect Match, Perfect Quiz, Comeback Victory)
 */
import { Achievement, AchievementCategory, AchievementTier } from '@/types';

export interface AchievementTemplate {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  rewardXP: number;
  icon: string;
  targetCount: number;
}

export const ACHIEVEMENT_CATALOGUE: AchievementTemplate[] = [
  // --- 1. FIRST STEPS ---
  {
    id: 'first_match',
    title: 'First Spark',
    description: 'Complete your very first game together on Togetherly.',
    category: 'first_steps',
    tier: 'bronze',
    rewardXP: 50,
    icon: '✨',
    targetCount: 1,
  },
  {
    id: 'first_win',
    title: 'Taste of Victory',
    description: 'Win your first competitive match or solve your first cooperative puzzle.',
    category: 'first_steps',
    tier: 'bronze',
    rewardXP: 50,
    icon: '🏆',
    targetCount: 1,
  },
  {
    id: 'first_daily_challenge',
    title: 'Daily Dedication',
    description: 'Complete your very first Daily Challenge together.',
    category: 'first_steps',
    tier: 'bronze',
    rewardXP: 75,
    icon: '🎯',
    targetCount: 1,
  },

  // --- 2. GAME MASTERY ---
  {
    id: 'quiz_champions',
    title: 'Quiz Champions',
    description: 'Complete 5 quiz matches or score over 500 total trivia points.',
    category: 'game_mastery',
    tier: 'silver',
    rewardXP: 150,
    icon: '👑',
    targetCount: 5,
  },
  {
    id: 'mind_readers',
    title: 'Mind Readers',
    description: 'Achieve 100% agreement in Who Knows Whom Better? or This or That.',
    category: 'game_mastery',
    tier: 'gold',
    rewardXP: 250,
    icon: '🔮',
    targetCount: 1,
  },
  {
    id: 'drawing_duo',
    title: 'Drawing Duo',
    description: 'Solve 5 creative Draw & Guess sketches together.',
    category: 'game_mastery',
    tier: 'silver',
    rewardXP: 150,
    icon: '🎨',
    targetCount: 5,
  },
  {
    id: 'board_game_rivals',
    title: 'Board Game Rivals',
    description: 'Play 10 matches of Connect Four or Tic-Tac-Toe.',
    category: 'game_mastery',
    tier: 'silver',
    rewardXP: 150,
    icon: '🎲',
    targetCount: 10,
  },
  {
    id: 'word_wizards',
    title: 'Word Wizards',
    description: 'Solve 5 Word Guess secret puzzles together.',
    category: 'game_mastery',
    tier: 'gold',
    rewardXP: 200,
    icon: '📖',
    targetCount: 5,
  },

  // --- 3. CONSISTENCY (STREAKS) ---
  {
    id: 'streak_3',
    title: 'Three-Day Spark',
    description: 'Maintain a 3-day continuous shared activity streak.',
    category: 'consistency',
    tier: 'bronze',
    rewardXP: 75,
    icon: '🔥',
    targetCount: 3,
  },
  {
    id: 'streak_7',
    title: 'Seven Days Together',
    description: 'Maintain a 7-day continuous shared activity streak.',
    category: 'consistency',
    tier: 'silver',
    rewardXP: 150,
    icon: '🌟',
    targetCount: 7,
  },
  {
    id: 'streak_14',
    title: 'Two Weeks of Love',
    description: 'Maintain a 14-day continuous shared activity streak.',
    category: 'consistency',
    tier: 'gold',
    rewardXP: 300,
    icon: '💖',
    targetCount: 14,
  },
  {
    id: 'streak_30',
    title: 'Unbreakable Bond',
    description: 'Maintain a 30-day continuous shared activity streak.',
    category: 'consistency',
    tier: 'platinum',
    rewardXP: 600,
    icon: '💎',
    targetCount: 30,
  },

  // --- 4. EXPLORATION ---
  {
    id: 'game_explorer',
    title: 'Curious Explorers',
    description: 'Play at least 3 distinct games in the Togetherly catalogue.',
    category: 'exploration',
    tier: 'bronze',
    rewardXP: 75,
    icon: '🧭',
    targetCount: 3,
  },
  {
    id: 'five_games',
    title: 'Halfway Everywhere',
    description: 'Play at least 5 distinct games in the Togetherly catalogue.',
    category: 'exploration',
    tier: 'silver',
    rewardXP: 150,
    icon: '🗺️',
    targetCount: 5,
  },
  {
    id: 'all_ten_games',
    title: 'Grand Catalogue Champions',
    description: 'Play all 10 multiplayer games in the Togetherly catalogue.',
    category: 'exploration',
    tier: 'platinum',
    rewardXP: 500,
    icon: '🪐',
    targetCount: 10,
  },

  // --- 5. SPECIAL ---
  {
    id: 'perfect_match',
    title: 'Perfect Alignment',
    description: 'Score a flawless 10-out-of-10 match in This or That.',
    category: 'special',
    tier: 'gold',
    rewardXP: 200,
    icon: '💯',
    targetCount: 1,
  },
  {
    id: 'perfect_quiz',
    title: 'Genius Couple',
    description: 'Answer every question correctly in a match of Couple Trivia.',
    category: 'special',
    tier: 'gold',
    rewardXP: 250,
    icon: '🎓',
    targetCount: 1,
  },
  {
    id: 'comeback_victory',
    title: 'Comeback Kids',
    description: 'Win a match after trailing your partner in scores.',
    category: 'special',
    tier: 'gold',
    rewardXP: 200,
    icon: '⚡',
    targetCount: 1,
  },
];

export const ACHIEVEMENT_CATEGORIES: { id: AchievementCategory; label: string }[] = [
  { id: 'first_steps', label: 'First Steps' },
  { id: 'game_mastery', label: 'Game Mastery' },
  { id: 'consistency', label: 'Streaks & Consistency' },
  { id: 'exploration', label: 'Catalogue Exploration' },
  { id: 'special', label: 'Special Feats' },
];

/**
 * Returns formatted Achievement with unlocked status merged from couple data.
 */
export function getHydratedAchievements(
  unlockedMap: Record<string, { unlockedAt: number }> = {}
): Achievement[] {
  return ACHIEVEMENT_CATALOGUE.map((tpl) => {
    const unlockedRecord = unlockedMap[tpl.id];
    return {
      id: tpl.id,
      title: tpl.title,
      description: tpl.description,
      category: tpl.category,
      tier: tpl.tier,
      rewardXP: tpl.rewardXP,
      icon: tpl.icon,
      unlocked: !!unlockedRecord,
      unlockedAt: unlockedRecord?.unlockedAt,
      targetCount: tpl.targetCount,
    };
  });
}
