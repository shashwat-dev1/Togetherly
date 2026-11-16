/**
 * TOGETHERLY — DRAW & GUESS PROMPTS
 * 60 Curated Romantic, Cute & Fun Drawing Prompts
 */

export interface DrawingPrompt {
  id: string;
  word: string;
  category: 'romantic' | 'food' | 'objects' | 'animals' | 'activities';
  hint: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const DRAWING_PROMPTS: DrawingPrompt[] = [
  // Romantic & Couples (15)
  { id: 'dg_1', word: 'engagement ring', category: 'romantic', hint: 'Sparkly jewelry', difficulty: 'easy' },
  { id: 'dg_2', word: 'wedding cake', category: 'romantic', hint: 'Multi-tiered sweet treat', difficulty: 'easy' },
  { id: 'dg_3', word: 'love letter', category: 'romantic', hint: 'Envelope sealed with a heart', difficulty: 'easy' },
  { id: 'dg_4', word: 'candlelight dinner', category: 'romantic', hint: 'Cozy meal with flames', difficulty: 'medium' },
  { id: 'dg_5', word: 'sunset walk', category: 'romantic', hint: 'Two silhouettes on the beach', difficulty: 'medium' },
  { id: 'dg_6', word: 'heart shaped pizza', category: 'romantic', hint: 'Cheesy romantic meal', difficulty: 'easy' },
  { id: 'dg_7', word: 'bouquet of roses', category: 'romantic', hint: 'Red flowers in a bunch', difficulty: 'easy' },
  { id: 'dg_8', word: 'ferris wheel', category: 'romantic', hint: 'Carnival ride for two', difficulty: 'medium' },
  { id: 'dg_9', word: 'couple umbrella', category: 'romantic', hint: 'Sharing shelter in the rain', difficulty: 'easy' },
  { id: 'dg_10', word: 'picnic basket', category: 'romantic', hint: 'Woven food container in a park', difficulty: 'easy' },
  { id: 'dg_11', word: 'holding hands', category: 'romantic', hint: 'Warm romantic gesture', difficulty: 'medium' },
  { id: 'dg_12', word: 'cupid arrow', category: 'romantic', hint: 'Shoots love into hearts', difficulty: 'easy' },
  { id: 'dg_13', word: 'campfire cuddle', category: 'romantic', hint: 'Warm flames under the stars', difficulty: 'medium' },
  { id: 'dg_14', word: 'stargazing', category: 'romantic', hint: 'Looking up at constellations', difficulty: 'medium' },
  { id: 'dg_15', word: 'teddy bear', category: 'romantic', hint: 'Fluffy gift with a bow', difficulty: 'easy' },

  // Food & Sweet Treats (12)
  { id: 'dg_16', word: 'strawberry fondue', category: 'food', hint: 'Dipping fruit in melted chocolate', difficulty: 'medium' },
  { id: 'dg_17', word: 'ice cream cone', category: 'food', hint: 'Two scoops with sprinkles', difficulty: 'easy' },
  { id: 'dg_18', word: 'cupcake', category: 'food', hint: 'Little cake with frosting', difficulty: 'easy' },
  { id: 'dg_19', word: 'coffee latte', category: 'food', hint: 'Hot mug with heart foam art', difficulty: 'easy' },
  { id: 'dg_20', word: 'popcorn bucket', category: 'food', hint: 'Movie night snack', difficulty: 'easy' },
  { id: 'dg_21', word: 'sushi roll', category: 'food', hint: 'Bite-sized rice wrapped in seaweed', difficulty: 'medium' },
  { id: 'dg_22', word: 'pancake stack', category: 'food', hint: 'Breakfast towers with maple syrup', difficulty: 'easy' },
  { id: 'dg_23', word: 'donut', category: 'food', hint: 'Round pastry with a hole in middle', difficulty: 'easy' },
  { id: 'dg_24', word: 'bubble tea', category: 'food', hint: 'Drink with tapioca pearls', difficulty: 'easy' },
  { id: 'dg_25', word: 'chocolate box', category: 'food', hint: 'Assorted bonbons in a red box', difficulty: 'medium' },
  { id: 'dg_26', word: 'cotton candy', category: 'food', hint: 'Fluffy pink cloud on a stick', difficulty: 'easy' },
  { id: 'dg_27', word: 'croissant', category: 'food', hint: 'Flaky crescent-shaped pastry', difficulty: 'medium' },

  // Animals & Cute Creatures (12)
  { id: 'dg_28', word: 'penguin pair', category: 'animals', hint: 'Birds that mate for life and waddle', difficulty: 'medium' },
  { id: 'dg_29', word: 'kitten', category: 'animals', hint: 'Tiny purring ball of fur', difficulty: 'easy' },
  { id: 'dg_30', word: 'puppy', category: 'animals', hint: 'Wagging tail and floppy ears', difficulty: 'easy' },
  { id: 'dg_31', word: 'swan', category: 'animals', hint: 'Graceful bird forming heart neck', difficulty: 'easy' },
  { id: 'dg_32', word: 'butterfly', category: 'animals', hint: 'Colorful winged insect', difficulty: 'easy' },
  { id: 'dg_33', word: 'red panda', category: 'animals', hint: 'Cute furry forest acrobat', difficulty: 'medium' },
  { id: 'dg_34', word: 'otter', category: 'animals', hint: 'Holds hands while floating on back', difficulty: 'medium' },
  { id: 'dg_35', word: 'bunny', category: 'animals', hint: 'Long ears and twitchy nose', difficulty: 'easy' },
  { id: 'dg_36', word: 'dolphin', category: 'animals', hint: 'Jumping out of ocean waves', difficulty: 'easy' },
  { id: 'dg_37', word: 'koala', category: 'animals', hint: 'Hugs eucalyptus tree branches', difficulty: 'medium' },
  { id: 'dg_38', word: 'hedgehog', category: 'animals', hint: 'Spiky cute little creature', difficulty: 'medium' },
  { id: 'dg_39', word: 'flamingo', category: 'animals', hint: 'Pink bird standing on one leg', difficulty: 'easy' },

  // Objects & Everyday Charm (11)
  { id: 'dg_40', word: 'polaroid camera', category: 'objects', hint: 'Prints instant square photos', difficulty: 'medium' },
  { id: 'dg_41', word: 'hot air balloon', category: 'objects', hint: 'Giant floating basket in the sky', difficulty: 'medium' },
  { id: 'dg_42', word: 'snow globe', category: 'objects', hint: 'Glass dome with falling flakes', difficulty: 'medium' },
  { id: 'dg_43', word: 'vintage bicycle', category: 'objects', hint: 'Two wheels with front flower basket', difficulty: 'medium' },
  { id: 'dg_44', word: 'guitar', category: 'objects', hint: 'Acoustic musical instrument with strings', difficulty: 'easy' },
  { id: 'dg_45', word: 'telescope', category: 'objects', hint: 'Tube looking up at the moon', difficulty: 'medium' },
  { id: 'dg_46', word: 'lighthouse', category: 'objects', hint: 'Tower guiding ships at sea', difficulty: 'easy' },
  { id: 'dg_47', word: 'paper airplane', category: 'objects', hint: 'Folded sheet gliding through air', difficulty: 'easy' },
  { id: 'dg_48', word: 'music box', category: 'objects', hint: 'Wind-up melodic keepsake', difficulty: 'hard' },
  { id: 'dg_49', word: 'key to my heart', category: 'objects', hint: 'Antique key with heart bow', difficulty: 'easy' },
  { id: 'dg_50', word: 'passport', category: 'objects', hint: 'Booklet for traveling the world', difficulty: 'easy' },

  // Activities & Adventures (10)
  { id: 'dg_51', word: 'karaoke night', category: 'activities', hint: 'Singing into a microphone', difficulty: 'easy' },
  { id: 'dg_52', word: 'pillow fight', category: 'activities', hint: 'Feathers flying everywhere', difficulty: 'medium' },
  { id: 'dg_53', word: 'baking cookies', category: 'activities', hint: 'Oven tray with warm treats', difficulty: 'medium' },
  { id: 'dg_54', word: 'road trip', category: 'activities', hint: 'Convertible driving along highway', difficulty: 'medium' },
  { id: 'dg_55', word: 'scuba diving', category: 'activities', hint: 'Swimming with goggles and oxygen tank', difficulty: 'medium' },
  { id: 'dg_56', word: 'roller coaster', category: 'activities', hint: 'Looping tracks in theme park', difficulty: 'hard' },
  { id: 'dg_57', word: 'slow dance', category: 'activities', hint: 'Two partners swaying to music', difficulty: 'medium' },
  { id: 'dg_58', word: 'building snowman', category: 'activities', hint: 'Three snowballs with carrot nose', difficulty: 'easy' },
  { id: 'dg_59', word: 'planting flowers', category: 'activities', hint: 'Spade, soil and blooming pot', difficulty: 'medium' },
  { id: 'dg_60', word: 'watching fireworks', category: 'activities', hint: 'Colorful explosions in night sky', difficulty: 'easy' },
];

