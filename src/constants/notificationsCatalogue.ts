/**
 * TOGETHERLY — CURATED ROMANTIC, CHEESY, FLIRTY & ENGAGEMENT NOTIFICATION LIBRARY
 *
 * 130 handcrafted, unique messages across 8 romantic categories:
 * - Cute (16)
 * - Romantic (18)
 * - Cheesy (16)
 * - Funny (16)
 * - Flirty (16) [Opt-in only, default disabled]
 * - Playful Double Meaning (16) [Opt-in only, default disabled, suggestive & tasteful]
 * - Missing-You (16)
 * - Game Invitations (16)
 *
 * All messages support `{partnerName}` token interpolation and provide
 * a `discreetBody` fallback for privacy when the user enables Discreet Lockscreen Previews.
 */

export type RomanticCategory =
  | 'cute'
  | 'romantic'
  | 'cheesy'
  | 'funny'
  | 'flirty'
  | 'double_meaning'
  | 'missing_you'
  | 'game_invitation';

export type NotificationCategory = RomanticCategory;

export interface NotificationTemplate {
  id: string;
  category: RomanticCategory;
  title: string;
  body: string;
  discreetBody: string;
  isOptInOnly?: boolean; // Requires explicit consent in notification settings
}

export const NOTIFICATION_CATALOGUE: NotificationTemplate[] = [
  // ==========================================
  // 1. CUTE (16 messages)
  // ==========================================
  {
    id: 'cute_001',
    category: 'cute',
    title: 'A Little Smile For You 😊',
    body: "Someone's missing you right now. Hint: It's totally mutual. 🥹❤️",
    discreetBody: 'You have a sweet message waiting on Togetherly.',
  },
  {
    id: 'cute_002',
    category: 'cute',
    title: 'Distance Check 📍',
    body: 'Distance is rude. Your love story definitely isn’t. 💕',
    discreetBody: 'New reminder on Togetherly.',
  },
  {
    id: 'cute_003',
    category: 'cute',
    title: 'Love Break ☕',
    body: 'Pause what you’re doing for 30 seconds and send {partnerName} a thought.',
    discreetBody: 'Take a quick moment on Togetherly.',
  },
  {
    id: 'cute_004',
    category: 'cute',
    title: 'Pocket Hug 🤗',
    body: 'Sending a virtual pocket squeeze straight to {partnerName}.',
    discreetBody: 'A sweet notification arrived.',
  },
  {
    id: 'cute_005',
    category: 'cute',
    title: 'Daily Appreciation 🌸',
    body: 'Just a reminder that out of everyone in the world, you picked each other.',
    discreetBody: 'Daily couple reminder on Togetherly.',
  },
  {
    id: 'cute_006',
    category: 'cute',
    title: 'Little Moments ✨',
    body: 'You don’t need a reason to drop a heart. Open Togetherly and say hi.',
    discreetBody: 'New reminder on Togetherly.',
  },
  {
    id: 'cute_007',
    category: 'cute',
    title: 'Warm & Fuzzy 🧸',
    body: 'Thinking of {partnerName}? They are probably thinking about you too.',
    discreetBody: 'Togetherly update.',
  },
  {
    id: 'cute_008',
    category: 'cute',
    title: 'Our Little Bubble 🫧',
    body: 'Two people, one little world. How’s your world doing today?',
    discreetBody: 'Check in on your little world.',
  },
  {
    id: 'cute_009',
    category: 'cute',
    title: 'Random Sweetness 🍯',
    body: 'Warning: Thinking about {partnerName} may cause uncontrollable smiling.',
    discreetBody: 'A sweet alert on Togetherly.',
  },
  {
    id: 'cute_010',
    category: 'cute',
    title: 'Cup of Love 🍵',
    body: 'A quick warm reminder that you are deeply loved by {partnerName}.',
    discreetBody: 'You have an update on Togetherly.',
  },
  {
    id: 'cute_011',
    category: 'cute',
    title: 'Two Peas in a Pod 🌱',
    body: 'Still the cutest couple in every zip code. Don’t let anyone tell you otherwise.',
    discreetBody: 'Togetherly check-in.',
  },
  {
    id: 'cute_012',
    category: 'cute',
    title: 'Snuggle Radar 📡',
    body: 'Our sensors detect a 99% probability of extreme cuteness today.',
    discreetBody: 'Togetherly couple reminder.',
  },
  {
    id: 'cute_013',
    category: 'cute',
    title: 'Soft Landing ☁️',
    body: 'Long day? Take a quiet minute together inside your space.',
    discreetBody: 'A peaceful reminder from Togetherly.',
  },
  {
    id: 'cute_014',
    category: 'cute',
    title: 'Heart Battery 🔋',
    body: 'Heart battery at 100% every time you talk to {partnerName}.',
    discreetBody: 'Togetherly status reminder.',
  },
  {
    id: 'cute_015',
    category: 'cute',
    title: 'Lucky Charms 🍀',
    body: 'Having {partnerName} in your corner makes every day a little brighter.',
    discreetBody: 'Togetherly reminder.',
  },
  {
    id: 'cute_016',
    category: 'cute',
    title: 'Just Because 💖',
    body: 'No big reason. Just wanted to bring a little love into your afternoon.',
    discreetBody: 'New reminder on Togetherly.',
  },

  // ==========================================
  // 2. ROMANTIC (18 messages)
  // ==========================================
  {
    id: 'rom_001',
    category: 'romantic',
    title: 'Under the Same Sky 🌙',
    body: 'Same moon. Different locations. One little world.',
    discreetBody: 'A romantic thought on Togetherly.',
  },
  {
    id: 'rom_002',
    category: 'romantic',
    title: 'Lucky You ❤️',
    body: 'Somewhere out there, your favourite human exists. Lucky you.',
    discreetBody: 'A sweet thought on Togetherly.',
  },
  {
    id: 'rom_003',
    category: 'romantic',
    title: 'No Distance 🧭',
    body: 'Love doesn’t need the same PIN code to stay completely connected.',
    discreetBody: 'A gentle reminder on Togetherly.',
  },
  {
    id: 'rom_004',
    category: 'romantic',
    title: 'Always in My Corner 💫',
    body: 'Miles can measure the map, but never what you two share.',
    discreetBody: 'Togetherly romantic reminder.',
  },
  {
    id: 'rom_005',
    category: 'romantic',
    title: 'A Love That Stays 🌹',
    body: 'Through every busy hour, you are each other’s calm harbor.',
    discreetBody: 'New notification on Togetherly.',
  },
  {
    id: 'rom_006',
    category: 'romantic',
    title: 'Our Story 📖',
    body: 'Every day together is another favorite page. Open your chapter.',
    discreetBody: 'Togetherly check-in.',
  },
  {
    id: 'rom_007',
    category: 'romantic',
    title: 'Constellation of Two ⭐',
    body: 'No matter the timezone, you two are always aligned.',
    discreetBody: 'Togetherly connection reminder.',
  },
  {
    id: 'rom_008',
    category: 'romantic',
    title: 'My Favorite Destination 🏡',
    body: 'Home isn’t a city. It’s whenever you connect with {partnerName}.',
    discreetBody: 'A romantic thought from Togetherly.',
  },
  {
    id: 'rom_009',
    category: 'romantic',
    title: 'The Sound of You 🎶',
    body: 'The best notification is always hearing from {partnerName}.',
    discreetBody: 'Togetherly couple notification.',
  },
  {
    id: 'rom_010',
    category: 'romantic',
    title: 'Forever Kind of Love ♾️',
    body: 'Deep roots don’t mind the wind. Your connection is solid.',
    discreetBody: 'A quiet thought on Togetherly.',
  },
  {
    id: 'rom_011',
    category: 'romantic',
    title: 'Golden Hour 🌅',
    body: 'Take a second to tell {partnerName} how grateful you are for them.',
    discreetBody: 'Togetherly daily reminder.',
  },
  {
    id: 'rom_012',
    category: 'romantic',
    title: 'Wired Together 🔗',
    body: 'Invisible threads connect hearts that belong together.',
    discreetBody: 'Togetherly reminder.',
  },
  {
    id: 'rom_013',
    category: 'romantic',
    title: 'A Little Serenade 🎻',
    body: 'In a noisy world, you two made your own quiet song.',
    discreetBody: 'A peaceful reminder from Togetherly.',
  },
  {
    id: 'rom_014',
    category: 'romantic',
    title: 'Anchored ⚓',
    body: 'No matter where life drifts today, you’re anchored in love.',
    discreetBody: 'Togetherly connection alert.',
  },
  {
    id: 'rom_015',
    category: 'romantic',
    title: 'Unconditional 💎',
    body: 'The sweetest thing about today? You get to love {partnerName}.',
    discreetBody: 'A romantic thought on Togetherly.',
  },
  {
    id: 'rom_016',
    category: 'romantic',
    title: 'Midnight Thoughts 🌌',
    body: 'Closing the day with the person who holds your heart.',
    discreetBody: 'Evening check-in on Togetherly.',
  },
  {
    id: 'rom_017',
    category: 'romantic',
    title: 'Worth Every Mile 🛤️',
    body: 'Every single mile in between just proves how real this is.',
    discreetBody: 'A love note on Togetherly.',
  },
  {
    id: 'rom_018',
    category: 'romantic',
    title: 'One In Eight Billion 🌍',
    body: 'Out of all the humans on earth, you found your favorite one.',
    discreetBody: 'A sweet thought on Togetherly.',
  },

  // ==========================================
  // 3. CHEESY (16 messages)
  // ==========================================
  {
    id: 'chz_001',
    category: 'cheesy',
    title: 'Strong Connection 📶',
    body: 'Are you Wi-Fi? Because this connection feels unbeatable. 😉',
    discreetBody: 'A cheesy reminder on Togetherly.',
  },
  {
    id: 'chz_002',
    category: 'cheesy',
    title: 'Incoming Call 📞',
    body: 'Your heart called. It requested some quality time with {partnerName}.',
    discreetBody: 'Togetherly check-in alert.',
  },
  {
    id: 'chz_003',
    category: 'cheesy',
    title: 'Best Distraction 🎯',
    body: 'Your favorite distraction is only one tap away.',
    discreetBody: 'New reminder on Togetherly.',
  },
  {
    id: 'chz_004',
    category: 'cheesy',
    title: 'Stolen Goods 🚨',
    body: 'Are you a thief? Because you completely stole {partnerName}’s heart.',
    discreetBody: 'Playful note on Togetherly.',
  },
  {
    id: 'chz_005',
    category: 'cheesy',
    title: 'Too Sweet 🍯',
    body: 'You two are officially so sweet, doctors might need to prescribe insulin.',
    discreetBody: 'Cheesy couple alert.',
  },
  {
    id: 'chz_006',
    category: 'cheesy',
    title: 'Parking Ticket 🎫',
    body: 'Do you have a parking ticket? Because you’ve got FINE written all over you.',
    discreetBody: 'Playful alert on Togetherly.',
  },
  {
    id: 'chz_007',
    category: 'cheesy',
    title: 'Google Search 🔍',
    body: 'Google called. It said they stopped searching because you found the one.',
    discreetBody: 'Togetherly check-in.',
  },
  {
    id: 'chz_008',
    category: 'cheesy',
    title: 'Extra Cheese 🧀',
    body: 'This notification is 100% extra cheese. Just like your love story.',
    discreetBody: 'A fun alert on Togetherly.',
  },
  {
    id: 'chz_009',
    category: 'cheesy',
    title: 'Gravity Failure 🪐',
    body: 'Did gravity just fail, or did you fall for {partnerName} all over again?',
    discreetBody: 'Togetherly reminder.',
  },
  {
    id: 'chz_010',
    category: 'cheesy',
    title: 'Sunscreen Needed ☀️',
    body: 'You two shine so bright together, we might need sunglasses.',
    discreetBody: 'Cheesy check-in on Togetherly.',
  },
  {
    id: 'chz_011',
    category: 'cheesy',
    title: 'Keyboard Error ⌨️',
    body: 'If I could rearrange the alphabet, I’d put U and I together.',
    discreetBody: 'A sweet joke on Togetherly.',
  },
  {
    id: 'chz_012',
    category: 'cheesy',
    title: 'Passport Check 🛂',
    body: 'Is it legal to look that good while living rent-free in someone’s head?',
    discreetBody: 'Playful note on Togetherly.',
  },
  {
    id: 'chz_013',
    category: 'cheesy',
    title: 'Butter Me Up 🧈',
    body: 'You and {partnerName} go together like hot toast and butter.',
    discreetBody: 'Cheesy couple note.',
  },
  {
    id: 'chz_014',
    category: 'cheesy',
    title: 'Cupid’s Arrow 🏹',
    body: 'Cupid called. He said his best work was introducing you two.',
    discreetBody: 'Togetherly update.',
  },
  {
    id: 'chz_015',
    category: 'cheesy',
    title: 'Sugar Rush 🍭',
    body: 'One notification from {partnerName} = instant sugar rush.',
    discreetBody: 'A sweet alert on Togetherly.',
  },
  {
    id: 'chz_016',
    category: 'cheesy',
    title: 'Perfect Match 🔥',
    body: 'Even fireworks are jealous of the spark between you two.',
    discreetBody: 'Togetherly couple reminder.',
  },

  // ==========================================
  // 4. FUNNY (16 messages)
  // ==========================================
  {
    id: 'fun_001',
    category: 'funny',
    title: 'Important Meeting 💼',
    body: 'Your partner has summoned you for an emergency gaming session.',
    discreetBody: 'You have an invitation on Togetherly.',
  },
  {
    id: 'fun_002',
    category: 'funny',
    title: 'Dispute Settlement ⚖️',
    body: 'Can’t decide who loves who more? Settle it on Connect Four right now.',
    discreetBody: 'A match is waiting on Togetherly.',
  },
  {
    id: 'fun_003',
    category: 'funny',
    title: 'Productivity Alert 📉',
    body: 'Productivity: 0%. Relationship happiness: 100%. Worth it.',
    discreetBody: 'Togetherly status update.',
  },
  {
    id: 'fun_004',
    category: 'funny',
    title: 'Warning: Smugness Ahead 🏆',
    body: '{partnerName} thinks they can beat you in Trivia. Prove them wrong.',
    discreetBody: 'A challenge is waiting on Togetherly.',
  },
  {
    id: 'fun_005',
    category: 'funny',
    title: 'Relationship Tax 🧾',
    body: 'Time to pay your daily attention tax to {partnerName}. Pay up!',
    discreetBody: 'Daily check-in on Togetherly.',
  },
  {
    id: 'fun_006',
    category: 'funny',
    title: 'Cuddle Deficit 📉',
    body: 'Official report: Long-distance cuddle deficit has reached critical levels.',
    discreetBody: 'Togetherly reminder.',
  },
  {
    id: 'fun_007',
    category: 'funny',
    title: 'Bragging Rights 🥇',
    body: 'Unclaimed bragging rights detected in your couple space. Go claim them.',
    discreetBody: 'A game is waiting on Togetherly.',
  },
  {
    id: 'fun_008',
    category: 'funny',
    title: 'Attention Whistle 🗣️',
    body: 'Paging your favorite human. Please report to Togetherly immediately.',
    discreetBody: 'Togetherly notification.',
  },
  {
    id: 'fun_009',
    category: 'funny',
    title: 'Who’s the Boss? 👑',
    body: 'Tic-Tac-Toe will decide who picks the movie tonight. Ready?',
    discreetBody: 'Game alert on Togetherly.',
  },
  {
    id: 'fun_010',
    category: 'funny',
    title: 'Zero Chill 🧊',
    body: 'We heard someone has zero chill when it comes to missing their partner.',
    discreetBody: 'Togetherly message.',
  },
  {
    id: 'fun_011',
    category: 'funny',
    title: 'Procrastination Station 🚂',
    body: 'Whatever you’re supposed to be doing right now can wait 5 minutes.',
    discreetBody: 'A quick break on Togetherly.',
  },
  {
    id: 'fun_012',
    category: 'funny',
    title: 'Love Crime 🚓',
    body: 'Being this cute from another city is officially a misdemeanor.',
    discreetBody: 'Togetherly alert.',
  },
  {
    id: 'fun_013',
    category: 'funny',
    title: 'Competitive Mode 🥊',
    body: 'Love is great, but beating {partnerName} at Word Guess feels pretty good too.',
    discreetBody: 'A game is ready on Togetherly.',
  },
  {
    id: 'fun_014',
    category: 'funny',
    title: 'Heartbeat Check 💓',
    body: 'Just checking to see if your heart did that flutter thing today.',
    discreetBody: 'Togetherly reminder.',
  },
  {
    id: 'fun_015',
    category: 'funny',
    title: 'Spoiler Alert 🍿',
    body: 'Spoiler: You two end up happily ever after. Now go play a game.',
    discreetBody: 'Togetherly notification.',
  },
  {
    id: 'fun_016',
    category: 'funny',
    title: 'GPS Alert 🗺️',
    body: 'Recalculating route... Destination: {partnerName}’s heart.',
    discreetBody: 'Togetherly check-in.',
  },

  // ==========================================
  // 5. FLIRTY (16 messages) [Opt-in Only]
  // ==========================================
  {
    id: 'flirt_001',
    category: 'flirty',
    title: 'Attention Deserved 😏',
    body: 'Your favorite person deserves some serious attention tonight.',
    discreetBody: 'New personal alert on Togetherly.',
    isOptInOnly: true,
  },
  {
    id: 'flirt_002',
    category: 'flirty',
    title: 'Unfair Advantage 🔥',
    body: 'Stop being so cute from so far away. It’s completely unfair.',
    discreetBody: 'A personal reminder on Togetherly.',
    isOptInOnly: true,
  },
  {
    id: 'flirt_003',
    category: 'flirty',
    title: 'Two Hearts, Little Trouble 😉',
    body: 'One game. Two hearts. Maybe a little trouble tonight.',
    discreetBody: 'You have a message on Togetherly.',
    isOptInOnly: true,
  },
  {
    id: 'flirt_004',
    category: 'flirty',
    title: 'Late Night Thoughts 🌙',
    body: 'Guess who’s thinking about you right now? Open up to find out.',
    discreetBody: 'A notification on Togetherly.',
    isOptInOnly: true,
  },
  {
    id: 'flirt_005',
    category: 'flirty',
    title: 'Spark Alert ✨',
    body: 'That spark between you two isn’t cooling down anytime soon.',
    discreetBody: 'Togetherly update.',
    isOptInOnly: true,
  },
  {
    id: 'flirt_006',
    category: 'flirty',
    title: 'Your Move, Gorgeous 💃',
    body: 'Don’t keep {partnerName} waiting on pins and needles.',
    discreetBody: 'It’s your turn on Togetherly.',
    isOptInOnly: true,
  },
  {
    id: 'flirt_007',
    category: 'flirty',
    title: 'Butterflies 🦋',
    body: 'Still giving each other butterflies after all this time.',
    discreetBody: 'Togetherly couple reminder.',
    isOptInOnly: true,
  },
  {
    id: 'flirt_008',
    category: 'flirty',
    title: 'Truth or Dare? 🎲',
    body: 'Feeling bold tonight? A Truth or Dare round is waiting.',
    discreetBody: 'A game is waiting on Togetherly.',
    isOptInOnly: true,
  },
  {
    id: 'flirt_009',
    category: 'flirty',
    title: 'Daydreaming 💭',
    body: 'Caught you daydreaming about {partnerName}. We have proof.',
    discreetBody: 'Togetherly reminder.',
    isOptInOnly: true,
  },
  {
    id: 'flirt_010',
    category: 'flirty',
    title: 'Lookin’ Good 👀',
    body: 'Just imagined your smile. 10 out of 10, would recommend.',
    discreetBody: 'A sweet alert on Togetherly.',
    isOptInOnly: true,
  },
  {
    id: 'flirt_011',
    category: 'flirty',
    title: 'Magnetic 🧲',
    body: 'The pull between you two is ridiculously strong today.',
    discreetBody: 'Togetherly check-in.',
    isOptInOnly: true,
  },
  {
    id: 'flirt_012',
    category: 'flirty',
    title: 'Warming Up 🔥',
    body: 'Ready to turn the heat up a notch in tonight’s match?',
    discreetBody: 'Game alert on Togetherly.',
    isOptInOnly: true,
  },
  {
    id: 'flirt_013',
    category: 'flirty',
    title: 'VIP Pass 🎟️',
    body: 'You have exclusive VIP access to {partnerName}’s heart.',
    discreetBody: 'Togetherly status update.',
    isOptInOnly: true,
  },
  {
    id: 'flirt_014',
    category: 'flirty',
    title: 'Spellbound 🪄',
    body: 'Whatever spell you put on {partnerName}, it definitely worked.',
    discreetBody: 'A personal reminder on Togetherly.',
    isOptInOnly: true,
  },
  {
    id: 'flirt_015',
    category: 'flirty',
    title: 'Stolen Kisses 💋',
    body: 'Sending one long-distance kiss that expires in 60 seconds. Open quick!',
    discreetBody: 'New alert on Togetherly.',
    isOptInOnly: true,
  },
  {
    id: 'flirt_016',
    category: 'flirty',
    title: 'Too Charming 😉',
    body: 'Careful... one more message and someone might fall even harder.',
    discreetBody: 'Togetherly notification.',
    isOptInOnly: true,
  },

  // ==========================================
  // 6. PLAYFUL DOUBLE MEANING (16 messages) [Opt-in Only, Tasteful]
  // ==========================================
  {
    id: 'dbl_001',
    category: 'double_meaning',
    title: 'Another Round? 😏',
    body: 'Think you can handle another round tonight? Let’s find out.',
    discreetBody: 'Game reminder on Togetherly.',
    isOptInOnly: true,
  },
  {
    id: 'dbl_002',
    category: 'double_meaning',
    title: 'In the Mood 🎮',
    body: '{partnerName} might just be in the mood... for a game. 😉',
    discreetBody: 'Activity alert on Togetherly.',
    isOptInOnly: true,
  },
  {
    id: 'dbl_003',
    category: 'double_meaning',
    title: 'Make Your Move ♟️',
    body: 'Ready to make your next move? The ball’s in your court.',
    discreetBody: 'It’s your turn on Togetherly.',
    isOptInOnly: true,
  },
  {
    id: 'dbl_004',
    category: 'double_meaning',
    title: 'Push the Right Buttons 🕹️',
    body: 'Go on... push the right buttons tonight.',
    discreetBody: 'Playful reminder on Togetherly.',
    isOptInOnly: true,
  },
  {
    id: 'dbl_005',
    category: 'double_meaning',
    title: 'Getting Heated 🔥',
    body: 'Things are about to get competitive... and maybe a little heated.',
    discreetBody: 'Match notification on Togetherly.',
    isOptInOnly: true,
  },
  {
    id: 'dbl_006',
    category: 'double_meaning',
    title: 'Who’s on Top? 🏆',
    body: 'Check the scoreboard to see who’s on top this week.',
    discreetBody: 'Scoreboard update on Togetherly.',
    isOptInOnly: true,
  },
  {
    id: 'dbl_007',
    category: 'double_meaning',
    title: 'Fast Hands ⚡',
    body: 'Quick reflexes required. Think you can keep up with {partnerName}?',
    discreetBody: 'Game alert on Togetherly.',
    isOptInOnly: true,
  },
  {
    id: 'dbl_008',
    category: 'double_meaning',
    title: 'Ready to Play? 🃏',
    body: 'Don’t tease... make your move and show what you’ve got.',
    discreetBody: 'Turn notification on Togetherly.',
    isOptInOnly: true,
  },
  {
    id: 'dbl_009',
    category: 'double_meaning',
    title: 'Stamina Test ⏱️',
    body: 'Who has the stamina to finish all 10 rounds of Trivia tonight?',
    discreetBody: 'Trivia invitation on Togetherly.',
    isOptInOnly: true,
  },
  {
    id: 'dbl_010',
    category: 'double_meaning',
    title: 'No Holding Back 💥',
    body: 'Tonight, nobody holds back. Game faces on.',
    discreetBody: 'Challenge alert on Togetherly.',
    isOptInOnly: true,
  },
  {
    id: 'dbl_011',
    category: 'double_meaning',
    title: 'Sweet Surrender 🏳️',
    body: 'Sometimes losing to {partnerName} is the sweetest outcome.',
    discreetBody: 'Togetherly match reminder.',
    isOptInOnly: true,
  },
  {
    id: 'dbl_012',
    category: 'double_meaning',
    title: 'A Good Match 🕯️',
    body: 'Some things are just built to ignite. Ready to play?',
    discreetBody: 'A game is waiting on Togetherly.',
    isOptInOnly: true,
  },
  {
    id: 'dbl_013',
    category: 'double_meaning',
    title: 'Deep Connection 🌊',
    body: 'Ready to go deep? Who Knows Whom round 5 is waiting.',
    discreetBody: 'Question round ready on Togetherly.',
    isOptInOnly: true,
  },
  {
    id: 'dbl_014',
    category: 'double_meaning',
    title: 'Under Pressure 💎',
    body: 'How do you handle the pressure when {partnerName} turns up the heat?',
    discreetBody: 'Togetherly game reminder.',
    isOptInOnly: true,
  },
  {
    id: 'dbl_015',
    category: 'double_meaning',
    title: 'Score Settling 🎯',
    body: 'Time to settle the score in private. Open Togetherly.',
    discreetBody: 'Match ready on Togetherly.',
    isOptInOnly: true,
  },
  {
    id: 'dbl_016',
    category: 'double_meaning',
    title: 'Just Us Two 🔒',
    body: 'No outside interruptions. Just you, me, and our little world.',
    discreetBody: 'Togetherly check-in.',
    isOptInOnly: true,
  },

  // ==========================================
  // 7. MISSING YOU (16 messages)
  // ==========================================
  {
    id: 'msu_001',
    category: 'missing_you',
    title: 'Thinking of You 💭',
    body: 'Your side of the screen feels quiet without you right now.',
    discreetBody: 'Someone is thinking of you on Togetherly.',
  },
  {
    id: 'msu_002',
    category: 'missing_you',
    title: 'Counting Hours ⏳',
    body: 'One day closer to being in the same room. Until then, we play.',
    discreetBody: 'Togetherly reminder.',
  },
  {
    id: 'msu_003',
    category: 'missing_you',
    title: 'A Little Closer 🌉',
    body: 'Every game brings you two just a little closer together.',
    discreetBody: 'New reminder on Togetherly.',
  },
  {
    id: 'msu_004',
    category: 'missing_you',
    title: 'Empty Spot 🛋️',
    body: 'My day feels incomplete without our daily check-in.',
    discreetBody: 'Check in on Togetherly.',
  },
  {
    id: 'msu_005',
    category: 'missing_you',
    title: 'Signal Strong 📶',
    body: 'Distance means so little when {partnerName} means so much.',
    discreetBody: 'A sweet thought on Togetherly.',
  },
  {
    id: 'msu_006',
    category: 'missing_you',
    title: 'Wish You Were Here ✈️',
    body: 'Wish you were here, but Togetherly is the next best thing.',
    discreetBody: 'Togetherly couple alert.',
  },
  {
    id: 'msu_007',
    category: 'missing_you',
    title: 'Quiet Hug 🫂',
    body: 'Sending a quiet, warm squeeze across the distance.',
    discreetBody: 'A gentle thought on Togetherly.',
  },
  {
    id: 'msu_008',
    category: 'missing_you',
    title: 'Miss Your Face 🥺',
    body: 'Missing your laugh, your voice, and your terrible puns.',
    discreetBody: 'Togetherly notification.',
  },
  {
    id: 'msu_009',
    category: 'missing_you',
    title: 'Virtual Touch 📲',
    body: 'Tapping your phone screen is basically holding hands, right?',
    discreetBody: 'Playful note on Togetherly.',
  },
  {
    id: 'msu_010',
    category: 'missing_you',
    title: 'Bridge of Stars 🌉',
    body: 'Miles don’t matter when someone has a permanent home in your heart.',
    discreetBody: 'A romantic thought on Togetherly.',
  },
  {
    id: 'msu_011',
    category: 'missing_you',
    title: 'Check-in Time ⏰',
    body: 'Take 2 minutes to drop into your shared world together.',
    discreetBody: 'Togetherly check-in reminder.',
  },
  {
    id: 'msu_012',
    category: 'missing_you',
    title: 'Warm Welcome 🕯️',
    body: 'Your little world is waiting with open arms.',
    discreetBody: 'Togetherly status update.',
  },
  {
    id: 'msu_013',
    category: 'missing_you',
    title: 'Goodnight Thought 🌙',
    body: 'Falling asleep with you on my mind, as usual.',
    discreetBody: 'Evening check-in on Togetherly.',
  },
  {
    id: 'msu_014',
    category: 'missing_you',
    title: 'Morning Sunshine ☀️',
    body: 'First thought of the morning belongs to {partnerName}.',
    discreetBody: 'Morning greeting on Togetherly.',
  },
  {
    id: 'msu_015',
    category: 'missing_you',
    title: 'Hold On Tight 🤝',
    body: 'Distance is temporary. What you two have is forever.',
    discreetBody: 'Togetherly connection reminder.',
  },
  {
    id: 'msu_016',
    category: 'missing_you',
    title: 'Always Near 🕊️',
    body: 'You may be miles away, but you’re never far from my heart.',
    discreetBody: 'A sweet reminder on Togetherly.',
  },

  // ==========================================
  // 8. GAME INVITATIONS (16 messages)
  // ==========================================
  {
    id: 'gam_001',
    category: 'game_invitation',
    title: 'Game On! 🎮',
    body: '{partnerName} challenged you to a duel. Are you ready?',
    discreetBody: 'You have a game invitation on Togetherly.',
  },
  {
    id: 'gam_002',
    category: 'game_invitation',
    title: 'Your Turn! 😉',
    body: '{partnerName} made their move. Don’t keep them waiting!',
    discreetBody: 'It’s your turn on Togetherly.',
  },
  {
    id: 'gam_003',
    category: 'game_invitation',
    title: 'Rematch Demanded 🥊',
    body: '{partnerName} wants revenge! Think you can beat them again?',
    discreetBody: 'Rematch requested on Togetherly.',
  },
  {
    id: 'gam_004',
    category: 'game_invitation',
    title: 'Both Answers In! 💕',
    body: 'Both answers are committed! Ready for the big reveal?',
    discreetBody: 'Game results ready on Togetherly.',
  },
  {
    id: 'gam_005',
    category: 'game_invitation',
    title: 'Daily Challenge Ready 🎯',
    body: 'Today’s couple challenge is live! Earn +50 Shared XP together.',
    discreetBody: 'Daily challenge available on Togetherly.',
  },
  {
    id: 'gam_006',
    category: 'game_invitation',
    title: 'Connect Four Showdown 🔴',
    body: 'Discs are ready. Can you connect four before {partnerName}?',
    discreetBody: 'Game invitation on Togetherly.',
  },
  {
    id: 'gam_007',
    category: 'game_invitation',
    title: 'Trivia Time 💡',
    body: 'Test your compatibility and memory with a fresh round of Trivia.',
    discreetBody: 'Trivia invitation on Togetherly.',
  },
  {
    id: 'gam_008',
    category: 'game_invitation',
    title: 'Tic-Tac-Toe Duel ❌⭕',
    body: 'Simple rules. Infinite bragging rights. Let’s play!',
    discreetBody: 'Match alert on Togetherly.',
  },
  {
    id: 'gam_009',
    category: 'game_invitation',
    title: 'Draw & Guess 🎨',
    body: 'A canvas is waiting! Can you guess what {partnerName} is drawing?',
    discreetBody: 'Drawing challenge on Togetherly.',
  },
  {
    id: 'gam_010',
    category: 'game_invitation',
    title: 'Word Guess Puzzle 🟩',
    body: 'Can you two solve today’s 5-letter couple puzzle together?',
    discreetBody: 'Word puzzle waiting on Togetherly.',
  },
  {
    id: 'gam_011',
    category: 'game_invitation',
    title: 'Memory Match Duel 🃏',
    body: 'Card pairs are shuffled. Who has the sharper memory today?',
    discreetBody: 'Game waiting on Togetherly.',
  },
  {
    id: 'gam_012',
    category: 'game_invitation',
    title: 'This or That ⚖️',
    body: '10 quick choices. How similar are your minds right now?',
    discreetBody: 'Preference duel on Togetherly.',
  },
  {
    id: 'gam_013',
    category: 'game_invitation',
    title: 'Level Up Available 🌟',
    body: 'You are so close to the next couple level! One game seals it.',
    discreetBody: 'Couple milestone alert on Togetherly.',
  },
  {
    id: 'gam_014',
    category: 'game_invitation',
    title: 'Streak on the Line 🔥',
    body: 'Keep your couple streak alive! Play a quick round today.',
    discreetBody: 'Streak reminder on Togetherly.',
  },
  {
    id: 'gam_015',
    category: 'game_invitation',
    title: 'Truth or Dare Night 🍷',
    body: 'Spice up the evening with a round of Truth or Dare.',
    discreetBody: 'Game invitation on Togetherly.',
  },
  {
    id: 'gam_016',
    category: 'game_invitation',
    title: 'Quick Match Waiting ⚡',
    body: 'Got 3 minutes? That’s all you need for a quick connection.',
    discreetBody: 'Quick game invitation on Togetherly.',
  },
];

export interface EligibleNotificationOptions {
  allowCute?: boolean;
  allowRomantic?: boolean;
  allowCheesy?: boolean;
  allowFunny?: boolean;
  allowFlirty?: boolean;
  allowDoubleMeaning?: boolean;
  allowMissingYou?: boolean;
  allowGameInvitations?: boolean;
  notificationsEnabled?: boolean;
  notifyRomanticReminders?: boolean;
  notifyCheesy?: boolean;
  notifyFlirty?: boolean;
  notifyDoubleMeaning?: boolean;
}

/**
 * Filter catalogue by user preferences (excluding opt-in categories unless explicitly permitted)
 */
export function getEligibleNotifications(options: EligibleNotificationOptions = {}): NotificationTemplate[] {
  if (options.notificationsEnabled === false) {
    return [];
  }

  const allowCute = options.allowCute !== undefined ? options.allowCute : true;
  const allowRomantic = options.allowRomantic !== undefined
    ? options.allowRomantic
    : (options.notifyRomanticReminders !== undefined ? options.notifyRomanticReminders : true);
  const allowCheesy = options.allowCheesy !== undefined
    ? options.allowCheesy
    : (options.notifyCheesy !== undefined ? options.notifyCheesy : true);
  const allowFunny = options.allowFunny !== undefined ? options.allowFunny : true;
  const allowFlirty = options.allowFlirty !== undefined
    ? options.allowFlirty
    : (options.notifyFlirty !== undefined ? options.notifyFlirty : false);
  const allowDoubleMeaning = options.allowDoubleMeaning !== undefined
    ? options.allowDoubleMeaning
    : (options.notifyDoubleMeaning !== undefined ? options.notifyDoubleMeaning : false);
  const allowMissingYou = options.allowMissingYou !== undefined ? options.allowMissingYou : true;
  const allowGameInvitations = options.allowGameInvitations !== undefined ? options.allowGameInvitations : true;

  return NOTIFICATION_CATALOGUE.filter((item) => {
    switch (item.category) {
      case 'cute':
        return allowCute;
      case 'romantic':
        return allowRomantic;
      case 'cheesy':
        return allowCheesy;
      case 'funny':
        return allowFunny;
      case 'flirty':
        return allowFlirty;
      case 'double_meaning':
        return allowDoubleMeaning;
      case 'missing_you':
        return allowMissingYou;
      case 'game_invitation':
        return allowGameInvitations;
      default:
        return false;
    }
  });
}

/**
 * Helper to interpolate {partnerName} safely in titles and bodies
 */
export function formatNotificationContent(
  template: NotificationTemplate,
  partnerName?: string,
  discreetMode = false
): { title: string; body: string } {
  const name = partnerName?.trim() || 'your partner';

  if (discreetMode) {
    return {
      title: 'Togetherly',
      body: template.discreetBody,
    };
  }

  return {
    title: template.title.replace(/\{partnerName\}/g, name),
    body: template.body.replace(/\{partnerName\}/g, name),
  };
}
