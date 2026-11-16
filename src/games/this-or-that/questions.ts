/**
 * TOGETHERLY — THIS OR THAT QUESTION BANK
 */
export interface ThisOrThatQuestion {
  id: string;
  category: 'lifestyle' | 'romance' | 'adventure' | 'food';
  optionA: string;
  emojiA: string;
  optionB: string;
  emojiB: string;
}

export const THIS_OR_THAT_BANK: ThisOrThatQuestion[] = [
  {
    id: 'tot_1',
    category: 'adventure',
    optionA: 'Sunny Beach Resort',
    emojiA: '🏖️',
    optionB: 'Cozy Mountain Cabin',
    emojiB: '🏔️',
  },
  {
    id: 'tot_2',
    category: 'romance',
    optionA: 'Late Night Movie & Cuddles',
    emojiA: '🎬',
    optionB: 'Dressed-Up Fancy Dinner',
    emojiB: '🍷',
  },
  {
    id: 'tot_3',
    category: 'lifestyle',
    optionA: 'Fresh Morning Coffee',
    emojiA: '☕',
    optionB: 'Calm Midnight Tea',
    emojiB: '🫖',
  },
  {
    id: 'tot_4',
    category: 'lifestyle',
    optionA: 'Spontaneous Long Phone Call',
    emojiA: '📞',
    optionB: 'Sweet Texts All Day Long',
    emojiB: '💬',
  },
  {
    id: 'tot_5',
    category: 'lifestyle',
    optionA: 'Bustling City Center Life',
    emojiA: '🏙️',
    optionB: 'Peaceful Countryside Retreat',
    emojiB: '🏡',
  },
  {
    id: 'tot_6',
    category: 'food',
    optionA: 'Ordering Favorite Takeout',
    emojiA: '🍕',
    optionB: 'Cooking a Lavish Meal Together',
    emojiB: '🍳',
  },
  {
    id: 'tot_7',
    category: 'adventure',
    optionA: 'Action-Packed Road Trip',
    emojiA: '🚗',
    optionB: 'All-Inclusive Relaxing Cruise',
    emojiB: '🚢',
  },
  {
    id: 'tot_8',
    category: 'romance',
    optionA: 'Watching Golden Sunrises',
    emojiA: '🌅',
    optionB: 'Stargazing at Midnight',
    emojiB: '🌌',
  },
  {
    id: 'tot_9',
    category: 'lifestyle',
    optionA: 'Sleep In Late on Weekends',
    emojiA: '🛌',
    optionB: 'Early Morning Weekend Adventure',
    emojiB: '🏃',
  },
  {
    id: 'tot_10',
    category: 'food',
    optionA: 'Decadent Sweet Dessert',
    emojiA: '🍰',
    optionB: 'Crispy Savory Snack',
    emojiB: '🍟',
  },
];
