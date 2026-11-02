// Must match backend/src/Emotions.php
export const EMOTIONS = {
  happy:    { label: 'Happy',    emoji: '😊', color: '#F5B700', valence: 2 },
  excited:  { label: 'Excited',  emoji: '🤩', color: '#FF7A59', valence: 2 },
  grateful: { label: 'Grateful', emoji: '🙏', color: '#2BB673', valence: 2 },
  calm:     { label: 'Calm',     emoji: '😌', color: '#3EC6C1', valence: 1 },
  neutral:  { label: 'Neutral',  emoji: '😐', color: '#9A96B0', valence: 0 },
  confused: { label: 'Confused', emoji: '😕', color: '#B08CFF', valence: -1 },
  tired:    { label: 'Tired',    emoji: '😴', color: '#7D8BB5', valence: -1 },
  anxious:  { label: 'Anxious',  emoji: '😰', color: '#8E7CFF', valence: -1 },
  stressed: { label: 'Stressed', emoji: '😫', color: '#F08A4B', valence: -1 },
  lonely:   { label: 'Lonely',   emoji: '🥺', color: '#6C8CFF', valence: -2 },
  sad:      { label: 'Sad',      emoji: '😢', color: '#4F8BFF', valence: -2 },
  angry:    { label: 'Angry',    emoji: '😠', color: '#E5484D', valence: -2 },
};

export const EMOTION_KEYS = Object.keys(EMOTIONS);

export const getEmotion = (key) => EMOTIONS[key] || EMOTIONS.neutral;

/** Friendly line shown on Home based on today's mood. */
export const MOOD_GREETINGS = {
  happy:    "Love seeing you happy! Let's keep that glow going ✨",
  excited:  "Something exciting is in the air — tell me all about it!",
  grateful: 'Gratitude is a superpower. What are you thankful for today?',
  calm:     'Peaceful vibes today. A perfect moment to reflect 🌿',
  neutral:  "An ordinary day is still your day. I'm here if you want to chat.",
  confused: "Feeling unsure is okay. Let's untangle things together.",
  tired:    "You've been working hard. Be gentle with yourself today 💤",
  anxious:  "Let's take a slow breath together. You're not alone in this.",
  stressed: "That's a lot to carry. Let's make it a little lighter, one step at a time.",
  lonely:   "I'm really glad you're here. Let's talk — I'm all ears 💙",
  sad:      "Sending you a gentle hug. It's okay to not be okay 💙",
  angry:    "Frustration is valid. Want to vent? I'll listen without judgement.",
};

/** Small, mood-based wellbeing tips. */
export const MOOD_TIPS = {
  happy:    'Write down what made today good — future you will love reading it.',
  excited:  'Channel the energy: pick one exciting thing and take a first step today.',
  grateful: 'Send a quick thank-you message to someone who helped you.',
  calm:     'Try a 5-minute mindful walk to make this calm last longer.',
  neutral:  'A glass of water and a short stretch can lift your energy.',
  confused: 'Write the options down side by side — clarity often follows.',
  tired:    'A 20-minute power nap or an early night can work wonders.',
  anxious:  'Box breathing: in 4s, hold 4s, out 4s, hold 4s. Repeat 4 times.',
  stressed: 'Break your biggest task into three tiny steps and start with the smallest.',
  lonely:   "Reach out to one person today, even with a simple 'thinking of you'.",
  sad:      'Be kind to yourself — a warm drink, a cosy blanket, your favourite song.',
  angry:    'Move it out: a brisk walk or a few minutes of journaling can help.',
};
