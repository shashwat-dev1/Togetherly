/**
 * TOGETHERLY — TRUTH OR DARE CONTENT ENGINE
 * 100+ Curated Prompts across Cute, Funny, Romantic, Deep, and Adventurous categories.
 * Strictly safe, non-coercive, positive, and relationship-enriching.
 */

export type PromptCategory = 'cute' | 'funny' | 'romantic' | 'deep' | 'adventurous' | 'mature';
export type PromptType = 'truth' | 'dare';

export interface TruthOrDarePrompt {
  id: string;
  type: PromptType;
  category: PromptCategory;
  text: string;
  isMature?: boolean;
}

export const TRUTH_OR_DARE_PROMPTS: TruthOrDarePrompt[] = [
  // --- CUTE TRUTHS (10) ---
  { id: 'ct_1', type: 'truth', category: 'cute', text: 'What is the very first thing you noticed and liked about me?' },
  { id: 'ct_2', type: 'truth', category: 'cute', text: 'Which cute nickname do you secretly love being called the most?' },
  { id: 'ct_3', type: 'truth', category: 'cute', text: 'What is one silly habit of mine that you find adorable?' },
  { id: 'ct_4', type: 'truth', category: 'cute', text: 'If we were animated cartoon characters, which duo would we be?' },
  { id: 'ct_5', type: 'truth', category: 'cute', text: 'What outfit of mine is your absolute favourite to see me wear?' },
  { id: 'ct_6', type: 'truth', category: 'cute', text: 'When did you first realize you had serious feelings for me?' },
  { id: 'ct_7', type: 'truth', category: 'cute', text: 'What is your favourite photograph of the two of us together?' },
  { id: 'ct_8', type: 'truth', category: 'cute', text: 'What is something small I do every day that always makes you smile?' },
  { id: 'ct_9', type: 'truth', category: 'cute', text: 'If you had to describe our relationship in three cute words, what are they?' },
  { id: 'ct_10', type: 'truth', category: 'cute', text: 'What is your favorite memory from our first few weeks of dating?' },

  // --- CUTE DARES (10) ---
  { id: 'cd_1', type: 'dare', category: 'cute', text: 'Send me the cutest selfie you can take in the next 30 seconds.' },
  { id: 'cd_2', type: 'dare', category: 'cute', text: 'Sing the chorus of your favorite love song in a funny baby voice.' },
  { id: 'cd_3', type: 'dare', category: 'cute', text: 'Give me a 30-second back or shoulder massage right now (or send an audio coupon for one).' },
  { id: 'cd_4', type: 'dare', category: 'cute', text: 'Re-enact the exact face I make when I am hungry or tired.' },
  { id: 'cd_5', type: 'dare', category: 'cute', text: 'Hold my hands, look into my eyes for 20 seconds without laughing or looking away.' },
  { id: 'cd_6', type: 'dare', category: 'cute', text: 'Whisper three genuine compliments in my ear with your sweetest voice.' },
  { id: 'cd_7', type: 'dare', category: 'cute', text: 'Draw a tiny doodle of our dream house on a piece of paper and show me.' },
  { id: 'cd_8', type: 'dare', category: 'cute', text: 'Send me a 15-second voice memo reciting a cute poem made up on the spot.' },
  { id: 'cd_9', type: 'dare', category: 'cute', text: 'Give me five rapid-fire kisses on my cheek, forehead, and nose.' },
  { id: 'cd_10', type: 'dare', category: 'cute', text: 'Do your best romantic prince/princess dramatic bow and pledge your loyalty to me.' },

  // --- FUNNY TRUTHS (10) ---
  { id: 'ft_1', type: 'truth', category: 'funny', text: 'What is the most ridiculous thing you have ever googled when nobody was looking?' },
  { id: 'ft_2', type: 'truth', category: 'funny', text: 'What is a movie or song you are deeply embarrassed to admit you love?' },
  { id: 'ft_3', type: 'truth', category: 'funny', text: 'What was your most awkward fashion phase growing up?' },
  { id: 'ft_4', type: 'truth', category: 'funny', text: 'Have you ever re-gifted something or pretended to like a gift you secretly hated?' },
  { id: 'ft_5', type: 'truth', category: 'funny', text: 'What is the most irrational fear you hold onto?' },
  { id: 'ft_6', type: 'truth', category: 'funny', text: 'What is the worst date or romantic blunder you ever had before us?' },
  { id: 'ft_7', type: 'truth', category: 'funny', text: 'If you had to eat only one weird food combination forever, what would it be?' },
  { id: 'ft_8', type: 'truth', category: 'funny', text: 'Have you ever blamed a weird sound or smell on a pet or someone else?' },
  { id: 'ft_9', type: 'truth', category: 'funny', text: 'What is something you pretend to understand in conversation but actually have no clue about?' },
  { id: 'ft_10', type: 'truth', category: 'funny', text: 'What is your silliest guilty pleasure that you do when you are home alone?' },

  // --- FUNNY DARES (10) ---
  { id: 'fd_1', type: 'dare', category: 'funny', text: 'Do your best dramatic opera singing interpretation of ordering a pizza.' },
  { id: 'fd_2', type: 'dare', category: 'funny', text: 'Show me the single most unflattering or goofy photo saved in your phone camera roll.' },
  { id: 'fd_3', type: 'dare', category: 'funny', text: 'Talk in a ridiculous pirate accent for the next two rounds of this game.' },
  { id: 'fd_4', type: 'dare', category: 'funny', text: 'Try to do 10 push-ups or squats while reciting the alphabet backward.' },
  { id: 'fd_5', type: 'dare', category: 'funny', text: 'Eat a spoonful of whatever condiment is in the fridge (ketchup, mustard, or hot sauce).' },
  { id: 'fd_6', type: 'dare', category: 'funny', text: 'Do an energetic 20-second robot dance with zero music.' },
  { id: 'fd_7', type: 'dare', category: 'funny', text: 'Let me style your hair in the goofiest way possible and take a picture.' },
  { id: 'fd_8', type: 'dare', category: 'funny', text: 'Try to juggle three random items from the room for 10 seconds.' },
  { id: 'fd_9', type: 'dare', category: 'funny', text: 'Speak only in rhymes until it is your turn to play again.' },
  { id: 'fd_10', type: 'dare', category: 'funny', text: 'Do your best dramatic impression of a grumpy cat waking up from a nap.' },

  // --- ROMANTIC TRUTHS (10) ---
  { id: 'rt_1', type: 'truth', category: 'romantic', text: 'What is your absolute favorite physical feature of mine?' },
  { id: 'rt_2', type: 'truth', category: 'romantic', text: 'What was the exact moment you realized you were in love with me?' },
  { id: 'rt_3', type: 'truth', category: 'romantic', text: 'What is something romantic you have always dreamed of doing together?' },
  { id: 'rt_4', type: 'truth', category: 'romantic', text: 'How do you feel in your chest when you haven’t seen me all day and we finally reunite?' },
  { id: 'rt_5', type: 'truth', category: 'romantic', text: 'What song immediately reminds you of me whenever you hear it on the radio?' },
  { id: 'rt_6', type: 'truth', category: 'romantic', text: 'If you could relive one single day from our relationship, which day would you choose?' },
  { id: 'rt_7', type: 'truth', category: 'romantic', text: 'What is the most thoughtful gesture I have ever done for you?' },
  { id: 'rt_8', type: 'truth', category: 'romantic', text: 'What is one promise you want to make to me for our future together?' },
  { id: 'rt_9', type: 'truth', category: 'romantic', text: 'What is your idea of the ultimate dream date night with zero budget limits?' },
  { id: 'rt_10', type: 'truth', category: 'romantic', text: 'What makes you feel most loved and appreciated by me?' },

  // --- ROMANTIC DARES (10) ---
  { id: 'rd_1', type: 'dare', category: 'romantic', text: 'Slow dance with me to an imaginary romantic song for 60 seconds.' },
  { id: 'rd_2', type: 'dare', category: 'romantic', text: 'Write a 3-sentence love note on a piece of paper and tuck it into my pocket/bag.' },
  { id: 'rd_3', type: 'dare', category: 'romantic', text: 'Look into my eyes and list five things about my soul that you cherish.' },
  { id: 'rd_4', type: 'dare', category: 'romantic', text: 'Kiss me passionately for 15 unbroken seconds.' },
  { id: 'rd_5', type: 'dare', category: 'romantic', text: 'Re-enact the confession of your feelings as if we were in a dramatic classic movie.' },
  { id: 'rd_6', type: 'dare', category: 'romantic', text: 'Gently trace your fingertips across my cheek and whisper your favorite memory of us.' },
  { id: 'rd_7', type: 'dare', category: 'romantic', text: 'Change your phone wallpaper to your favorite photo of us for the rest of the week.' },
  { id: 'rd_8', type: 'dare', category: 'romantic', text: 'Plan a surprise mini-date for us sometime in the next 7 days and tell me the dress code.' },
  { id: 'rd_9', type: 'dare', category: 'romantic', text: 'Feed me a bite of a snack or fruit as delicately and romantically as possible.' },
  { id: 'rd_10', type: 'dare', category: 'romantic', text: 'Hold my face with both hands and tell me the single thing you are most thankful for about me.' },

  // --- DEEP TRUTHS (10) ---
  { id: 'dt_1', type: 'truth', category: 'deep', text: 'What is one personal fear you rarely talk about with anyone else?' },
  { id: 'dt_2', type: 'truth', category: 'deep', text: 'How do you think being together has changed you as a person for the better?' },
  { id: 'dt_3', type: 'truth', category: 'deep', text: 'What is one lesson from your childhood that still shapes how you love today?' },
  { id: 'dt_4', type: 'truth', category: 'deep', text: 'When do you feel most vulnerable or exposed around me?' },
  { id: 'dt_5', type: 'truth', category: 'deep', text: 'What is a dream or goal you have that you are nervous about pursuing?' },
  { id: 'dt_6', type: 'truth', category: 'deep', text: 'What does true loyalty in a relationship mean to you?' },
  { id: 'dt_7', type: 'truth', category: 'deep', text: 'Is there any past regret that you wish you could go back and handle differently?' },
  { id: 'dt_8', type: 'truth', category: 'deep', text: 'What is something about your emotions or communication you are working to improve?' },
  { id: 'dt_9', type: 'truth', category: 'deep', text: 'Where do you see our little world in five years from now?' },
  { id: 'dt_10', type: 'truth', category: 'deep', text: 'What is the greatest piece of advice someone ever gave you about love?' },

  // --- DEEP DARES (10) ---
  { id: 'dd_1', type: 'dare', category: 'deep', text: 'Close your eyes, breathe together in sync for 30 seconds, and share the first feeling that arises.' },
  { id: 'dd_2', type: 'dare', category: 'deep', text: 'Tell me about a hardship you went through in the past that made you the resilient person you are today.' },
  { id: 'dd_3', type: 'dare', category: 'deep', text: 'Share one insecurity you have about yourself that you want me to reassure you on.' },
  { id: 'dd_4', type: 'dare', category: 'deep', text: 'Ask me any burning deep question you have hesitated to ask in the past.' },
  { id: 'dd_5', type: 'dare', category: 'deep', text: 'Describe in detail what your soul feels like when you are in a state of complete peace.' },
  { id: 'dd_6', type: 'dare', category: 'deep', text: 'Give me your hands and speak one deep blessing or wish you have over my life.' },
  { id: 'dd_7', type: 'dare', category: 'deep', text: 'Tell me about a moment where you were proud of the way we navigated a disagreement.' },
  { id: 'dd_8', type: 'dare', category: 'deep', text: 'Describe the legacy or impact you hope our relationship leaves on the world.' },
  { id: 'dd_9', type: 'dare', category: 'deep', text: 'Confess one thing you have learned from me that you apply in your daily life.' },
  { id: 'dd_10', type: 'dare', category: 'deep', text: 'Look at me and honestly state what you need most from me emotionally this week.' },

  // --- ADVENTUROUS TRUTHS (10) ---
  { id: 'at_1', type: 'truth', category: 'adventurous', text: 'What is the wildest spontaneous adventure you would do with me right now if we had tickets?' },
  { id: 'at_2', type: 'truth', category: 'adventurous', text: 'Would you ever go skydiving, bungee jumping, or scuba diving with sharks together?' },
  { id: 'at_3', type: 'truth', category: 'adventurous', text: 'What is the most adventurous place you want to travel to with just backpacks?' },
  { id: 'at_4', type: 'truth', category: 'adventurous', text: 'If we could drop everything and move to a foreign country for a year, where would you choose?' },
  { id: 'at_5', type: 'truth', category: 'adventurous', text: 'What is the craziest thing on your personal bucket list?' },
  { id: 'at_6', type: 'truth', category: 'adventurous', text: 'Would you rather sleep under the open stars in the desert or camp in a deep rainforest?' },
  { id: 'at_7', type: 'truth', category: 'adventurous', text: 'What is an exotic sport, hobby, or martial art you’d love for us to learn together?' },
  { id: 'at_8', type: 'truth', category: 'adventurous', text: 'If we entered an adventurous reality TV race together, what would be our greatest strength?' },
  { id: 'at_9', type: 'truth', category: 'adventurous', text: 'What is the most daring risk you have ever taken in your personal life?' },
  { id: 'at_10', type: 'truth', category: 'adventurous', text: 'What is a thrill you haven’t experienced yet that you want to experience with me?' },

  // --- ADVENTUROUS DARES (10) ---
  { id: 'ad_1', type: 'dare', category: 'adventurous', text: 'Drop to the floor and do a 30-second plank while shouting words of affirmation to me.' },
  { id: 'ad_2', type: 'dare', category: 'adventurous', text: 'Spin around 10 times in a circle and try to walk in a straight line toward me.' },
  { id: 'ad_3', type: 'dare', category: 'adventurous', text: 'Pick me up (or let me give you a piggyback ride) and carry me across the room.' },
  { id: 'ad_4', type: 'dare', category: 'adventurous', text: 'Blindfold yourself with a scarf/towel and let me guide you around the room using only touch.' },
  { id: 'ad_5', type: 'dare', category: 'adventurous', text: 'Put on a wild costume or crazy mix-and-match clothes in under 60 seconds and strike a model pose.' },
  { id: 'ad_6', type: 'dare', category: 'adventurous', text: 'Open the window (or step outside) and shout "I love Togetherly!" at the top of your lungs.' },
  { id: 'ad_7', type: 'dare', category: 'adventurous', text: 'Invent a new secret couple handshake with 4 distinct moves and teach it to me right now.' },
  { id: 'ad_8', type: 'dare', category: 'adventurous', text: 'Let me blindfold you and feed you a mystery item from the pantry to guess what it is.' },
  { id: 'ad_9', type: 'dare', category: 'adventurous', text: 'Do 15 jumping jacks while speaking in a foreign accent.' },
  { id: 'ad_10', type: 'dare', category: 'adventurous', text: 'Propose to me with a random object in the room as the engagement ring.' },

  // --- OPTIONAL AGE-GATED MATURE PROMPTS (10) ---
  { id: 'mt_1', type: 'truth', category: 'mature', isMature: true, text: 'Where is your absolute favorite spot on your body to be kissed softly?' },
  { id: 'mt_2', type: 'truth', category: 'mature', isMature: true, text: 'What is a subtle physical touch of mine that gives you instant chills?' },
  { id: 'mt_3', type: 'truth', category: 'mature', isMature: true, text: 'What outfit or look of mine turns you on the most without me even trying?' },
  { id: 'mt_4', type: 'truth', category: 'mature', isMature: true, text: 'What is a romantic or sensual fantasy you have secretly thought about us trying?' },
  { id: 'mt_5', type: 'truth', category: 'mature', isMature: true, text: 'What was the most electrically charged kiss we have ever shared?' },
  { id: 'md_1', type: 'dare', category: 'mature', isMature: true, text: 'Slowly kiss me starting from my forehead, down my nose, onto my lips and neck for 30 seconds.' },
  { id: 'md_2', type: 'dare', category: 'mature', isMature: true, text: 'Whisper your deepest, most intimate fantasy directly into my ear in a soft whisper.' },
  { id: 'md_3', type: 'dare', category: 'mature', isMature: true, text: 'Give me a tender 2-minute foot or neck massage focusing purely on relaxation.' },
  { id: 'md_4', type: 'dare', category: 'mature', isMature: true, text: 'Gently unbutton the top button of my shirt or trace your lips along my collarbone.' },
  { id: 'md_5', type: 'dare', category: 'mature', isMature: true, text: 'Look me dead in the eyes and tell me the most sensual thought you had about me recently.' },
];

export function getPrompts(category?: PromptCategory, allowMature: boolean = false): TruthOrDarePrompt[] {
  return TRUTH_OR_DARE_PROMPTS.filter((p) => {
    if (p.isMature && !allowMature) return false;
    if (category && category !== 'cute' && p.category !== category) return false;
    return true;
  });
}

