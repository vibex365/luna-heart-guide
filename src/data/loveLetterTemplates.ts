export interface LetterTemplate {
  id: string;
  name: string;
  category: "romantic" | "appreciation" | "apology" | "anniversary" | "missing-you" | "everyday";
  openings: string[];
  bodyPrompts: string[];
  closings: string[];
}

export const loveLetterTemplates: LetterTemplate[] = [
  {
    id: "classic-romance",
    name: "Classic Romance",
    category: "romantic",
    openings: [
      "My Dearest [Name],",
      "To the love of my life,",
      "My darling [Name],",
      "To my one and only,",
    ],
    bodyPrompts: [
      "When I first saw you, I knew...",
      "Every moment with you feels like...",
      "Your smile makes me...",
      "I love the way you...",
      "My favorite memory of us is...",
      "You make my heart...",
    ],
    closings: [
      "Forever and always yours,",
      "With all my love,",
      "Yours eternally,",
      "Until the end of time,",
    ],
  },
  {
    id: "deep-appreciation",
    name: "Deep Appreciation",
    category: "appreciation",
    openings: [
      "My wonderful [Name],",
      "To my amazing partner,",
      "Dear [Name], my rock,",
    ],
    bodyPrompts: [
      "I want to thank you for...",
      "You've taught me so much about...",
      "I admire how you...",
      "The way you support me...",
      "You make our life together...",
      "I'm grateful for...",
    ],
    closings: [
      "With deepest gratitude and love,",
      "Thank you for being you,",
      "Appreciating you always,",
    ],
  },
  {
    id: "heartfelt-apology",
    name: "Heartfelt Apology",
    category: "apology",
    openings: [
      "My dear [Name],",
      "To my patient partner,",
      "[Name], I need to say...",
    ],
    bodyPrompts: [
      "I'm sorry for...",
      "I realize now that...",
      "You deserved better when...",
      "I promise to...",
      "Please know that I...",
      "Moving forward, I will...",
    ],
    closings: [
      "With sincere apologies and love,",
      "Hoping for your forgiveness,",
      "Committed to doing better,",
    ],
  },
  {
    id: "anniversary-love",
    name: "Anniversary Celebration",
    category: "anniversary",
    openings: [
      "My beloved [Name],",
      "To my partner in everything,",
      "On this special day, my love,",
    ],
    bodyPrompts: [
      "Looking back on our journey...",
      "This past year/years has shown me...",
      "My favorite chapter of us was...",
      "I'm excited for our future because...",
      "The best part of growing with you is...",
      "Here's to more...",
    ],
    closings: [
      "Happy Anniversary, my love,",
      "To many more years together,",
      "Celebrating us, always,",
    ],
  },
  {
    id: "missing-you",
    name: "Missing You",
    category: "missing-you",
    openings: [
      "My darling [Name],",
      "To my heart, far away,",
      "Thinking of you, [Name],",
    ],
    bodyPrompts: [
      "The distance makes me realize...",
      "I miss the way you...",
      "I can't wait to...",
      "When we're together again...",
      "You're on my mind because...",
      "Counting the days until...",
    ],
    closings: [
      "Until I hold you again,",
      "Missing you always,",
      "Sending all my love across the miles,",
    ],
  },
  {
    id: "everyday-love",
    name: "Everyday Love Note",
    category: "everyday",
    openings: [
      "Hey you,",
      "Good morning/evening, love,",
      "Just wanted to say...",
    ],
    bodyPrompts: [
      "Today I was thinking about...",
      "You made me smile when...",
      "I love our little moments like...",
      "Can't stop thinking about...",
      "You're amazing because...",
      "Just a reminder that...",
    ],
    closings: [
      "Love you always,",
      "XOXO,",
      "Your biggest fan,",
      "- Your [nickname]",
    ],
  },
];

export const romanticWords = [
  "cherish", "adore", "treasure", "captivated", "enchanted",
  "mesmerized", "smitten", "devoted", "passionate", "heartfelt",
  "tender", "profound", "eternal", "infinite", "boundless",
];

export const loveQuotes = [
  "You are my today and all of my tomorrows.",
  "In you, I've found the love of my life and my closest friend.",
  "Every love story is beautiful, but ours is my favorite.",
  "You're the reason I believe in love.",
  "My heart is, and always will be, yours.",
  "I saw that you were perfect, and so I loved you. Then I saw that you were not perfect and I loved you even more.",
  "You are my sun, my moon, and all my stars.",
  "To love and be loved is to feel the sun from both sides.",
];

export const categoryColors: Record<string, string> = {
  "romantic": "bg-pink-500/20 text-pink-300 border-pink-500/30",
  "appreciation": "bg-amber-500/20 text-amber-300 border-amber-500/30",
  "apology": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "anniversary": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "missing-you": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "everyday": "bg-green-500/20 text-green-300 border-green-500/30",
};
