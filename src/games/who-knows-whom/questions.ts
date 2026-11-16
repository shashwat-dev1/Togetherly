/**
 * TOGETHERLY — WHO KNOWS WHOM BETTER?
 * 7 Curated Question Decks for Couples
 */

export interface QuizQuestion {
  id: string;
  deckId: string;
  deckName: string;
  questionText: string;
  options: string[];
}

export interface QuizDeck {
  id: string;
  name: string;
  emoji: string;
  description: string;
  questions: QuizQuestion[];
}

export const QUIZ_DECKS: QuizDeck[] = [
  {
    id: 'personality',
    name: 'Personality & Quirks',
    emoji: '🎭',
    description: 'How well do you know your partner’s deepest traits and quirks?',
    questions: [
      {
        id: 'p_1',
        deckId: 'personality',
        deckName: 'Personality & Quirks',
        questionText: 'When stressed, what is my go-to coping mechanism?',
        options: ['Vent to my partner', 'Need quiet alone time', 'Eat comfort food', 'Go for a walk / workout'],
      },
      {
        id: 'p_2',
        deckId: 'personality',
        deckName: 'Personality & Quirks',
        questionText: 'Am I more introverted or extroverted in social settings?',
        options: ['Introvert — drain quickly', 'Extrovert — love energy', 'Ambivert — depends on the crowd', 'Quiet until comfortable'],
      },
      {
        id: 'p_3',
        deckId: 'personality',
        deckName: 'Personality & Quirks',
        questionText: 'What is my biggest everyday pet peeve?',
        options: ['People being chronically late', 'Slow internet / buffering', 'Chewing loudly', 'Messy living spaces'],
      },
    ],
  },
  {
    id: 'food',
    name: 'Food & Flavours',
    emoji: '🍕',
    description: 'Favorite meals, cravings, and midnight snacks.',
    questions: [
      {
        id: 'f_1',
        deckId: 'food',
        deckName: 'Food & Flavours',
        questionText: 'If I could only eat one cuisine for the rest of my life, what would it be?',
        options: ['Italian (Pasta & Pizza)', 'Asian (Sushi, Noodles, Curry)', 'Mexican / Tacos', 'Homestyle Comfort Food'],
      },
      {
        id: 'f_2',
        deckId: 'food',
        deckName: 'Food & Flavours',
        questionText: 'What is my ultimate midnight craving snack?',
        options: ['Ice cream / Sweets', 'Chips / Salty snacks', 'Instant noodles', 'Leftovers from dinner'],
      },
      {
        id: 'f_3',
        deckId: 'food',
        deckName: 'Food & Flavours',
        questionText: 'How do I take my morning coffee or tea?',
        options: ['Sweet & milky', 'Black / Strong', 'Iced latte', 'I prefer herbal tea or juice'],
      },
    ],
  },
  {
    id: 'travel',
    name: 'Travel & Adventure',
    emoji: '✈️',
    description: 'Dream getaways, flight habits, and exploring the globe.',
    questions: [
      {
        id: 't_1',
        deckId: 'travel',
        deckName: 'Travel & Adventure',
        questionText: 'What is my ideal dream vacation?',
        options: ['Tropical beach resort & relaxing', 'Exploring historic European cities', 'Mountain cabin with hiking & snow', 'Action-packed road trip'],
      },
      {
        id: 't_2',
        deckId: 'travel',
        deckName: 'Travel & Adventure',
        questionText: 'At the airport, am I super early or barely making it?',
        options: ['3 hours early at the gate', 'Comfortably 1.5 hours early', 'Running to the boarding gate', 'Lost in the duty-free shop'],
      },
    ],
  },
  {
    id: 'habits',
    name: 'Habits & Routines',
    emoji: '⏰',
    description: 'Sleep schedules, weekend habits, and daily rhythms.',
    questions: [
      {
        id: 'h_1',
        deckId: 'habits',
        deckName: 'Habits & Routines',
        questionText: 'Am I an early bird or a night owl?',
        options: ['Definite morning person', 'Extreme night owl', 'Neither, always tired', 'Changes every week'],
      },
      {
        id: 'h_2',
        deckId: 'habits',
        deckName: 'Habits & Routines',
        questionText: 'What is my ideal Sunday morning routine?',
        options: ['Sleeping in until noon', 'Cooking a lavish breakfast', 'Morning run or workout', 'Coffee and reading in bed'],
      },
    ],
  },
  {
    id: 'memories',
    name: 'Relationship Memories',
    emoji: '📸',
    description: 'Cherished milestones and how you fell in love.',
    questions: [
      {
        id: 'm_1',
        deckId: 'memories',
        deckName: 'Relationship Memories',
        questionText: 'What was my initial impression of you when we first met?',
        options: ['Instantly smitten / butterflies', 'Thought you were super cool', 'A bit nervous / shy', 'Took a little time to warm up'],
      },
      {
        id: 'm_2',
        deckId: 'memories',
        deckName: 'Relationship Memories',
        questionText: 'What is my favorite thing we do together when it’s just the two of us?',
        options: ['Cuddling & binge-watching shows', 'Cooking and eating dinner', 'Deep late-night conversations', 'Going on spontaneous date nights'],
      },
    ],
  },
  {
    id: 'dreams',
    name: 'Hopes & Dreams',
    emoji: '🌟',
    description: 'Future aspirations, bucket lists, and shared visions.',
    questions: [
      {
        id: 'd_1',
        deckId: 'dreams',
        deckName: 'Hopes & Dreams',
        questionText: 'If I won a million dollars tomorrow, what would I do first?',
        options: ['Buy our dream home', 'Travel the world together', 'Invest & save for the future', 'Start a creative passion project'],
      },
    ],
  },
  {
    id: 'quirks',
    name: 'Fun & Weird',
    emoji: '🤪',
    description: 'Silly traits, phobias, and hilarious secrets.',
    questions: [
      {
        id: 'q_1',
        deckId: 'quirks',
        deckName: 'Fun & Weird',
        questionText: 'Which animal best matches my personality on a lazy day?',
        options: ['Sleepy Cat', 'Playful Golden Retriever', 'Cozy Sloth', 'Curious Otter'],
      },
    ],
  },
];

export function getAllQuizQuestions(): QuizQuestion[] {
  return QUIZ_DECKS.flatMap((deck) => deck.questions);
}
