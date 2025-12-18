// Intimate game content for Finish My Sentence and Rate the Fantasy

export const finishSentencePrompts = [
  // Romantic
  "When I first saw you, I thought...",
  "The moment I knew I loved you was when...",
  "My favorite thing about waking up next to you is...",
  "If we could relive one moment together, I'd choose...",
  "The thing that makes you irresistible to me is...",
  
  // Flirty
  "Tonight, I want to...",
  "When you touch me, I feel...",
  "The outfit I love seeing you in most is...",
  "My favorite place to kiss you is...",
  "If we were alone right now, I would...",
  
  // Intimate
  "The thing you do that drives me wild is...",
  "My ultimate fantasy with you involves...",
  "I can't stop thinking about the time we...",
  "The way you make me feel when we're close is...",
  "If I could have you anywhere right now, it would be...",
  
  // Playful
  "The naughtiest thing I want to try with you is...",
  "When you whisper in my ear, I want you to say...",
  "The secret thing I've always wanted to do to you is...",
  "After a long day, I wish you would...",
  "The way I want you to wake me up is...",
  
  // Deep connection
  "What I love most about being intimate with you is...",
  "The feeling I get when I'm in your arms is...",
  "My heart races when you...",
  "The thing I'll never forget about us is...",
  "Forever with you means...",
];

export const rateFantasyScenarios = [
  // Romantic getaways
  {
    title: "Beach Sunset",
    description: "A private beach at sunset, just the two of us with champagne and strawberries",
    category: "romantic"
  },
  {
    title: "Mountain Cabin",
    description: "A cozy cabin in the mountains, snowed in with a fireplace and no distractions",
    category: "romantic"
  },
  {
    title: "Rooftop Under Stars",
    description: "A rooftop terrace in a city, dinner under the stars with the skyline view",
    category: "romantic"
  },
  
  // Adventurous
  {
    title: "Spontaneous Road Trip",
    description: "Dropping everything for a spontaneous weekend road trip to somewhere new",
    category: "adventure"
  },
  {
    title: "Private Island",
    description: "A week on a private island with no one else around",
    category: "adventure"
  },
  {
    title: "Luxury Train Journey",
    description: "A romantic overnight train journey through scenic countryside",
    category: "adventure"
  },
  
  // Intimate scenarios
  {
    title: "Spa Day Together",
    description: "A couples' spa day with massages, hot tub, and relaxation",
    category: "intimate"
  },
  {
    title: "Candlelit Bubble Bath",
    description: "A candlelit bath together with wine and soft music",
    category: "intimate"
  },
  {
    title: "Breakfast in Bed",
    description: "Lazy Sunday morning with breakfast in bed and nowhere to be",
    category: "intimate"
  },
  
  // Playful/Spicy
  {
    title: "Role Play Night",
    description: "Dressing up and pretending to meet each other for the first time",
    category: "spicy"
  },
  {
    title: "Dance Floor Chemistry",
    description: "A night out dancing, pressed close together on a crowded dance floor",
    category: "spicy"
  },
  {
    title: "Secret Rendezvous",
    description: "Meeting at a hotel bar like strangers and 'going upstairs together'",
    category: "spicy"
  },
  {
    title: "Surprise at Work",
    description: "An unexpected midday visit to surprise each other",
    category: "spicy"
  },
  {
    title: "Midnight Swim",
    description: "A late-night swim together, just the two of us",
    category: "spicy"
  },
  
  // Future dreams
  {
    title: "Vow Renewal",
    description: "Renewing vows on a beach with just close family",
    category: "future"
  },
  {
    title: "Dream Home",
    description: "Building our dream home together exactly how we want it",
    category: "future"
  },
  {
    title: "Around the World",
    description: "Taking a year off to travel the world together",
    category: "future"
  },
  {
    title: "Second Honeymoon",
    description: "A second honeymoon to an exotic destination",
    category: "future"
  },
  {
    title: "Anniversary Tradition",
    description: "Creating a special anniversary tradition just for us",
    category: "future"
  },
];

export const categoryColors: Record<string, string> = {
  romantic: "bg-pink-500/20 text-pink-300",
  adventure: "bg-amber-500/20 text-amber-300",
  intimate: "bg-purple-500/20 text-purple-300",
  spicy: "bg-red-500/20 text-red-300",
  future: "bg-blue-500/20 text-blue-300",
};
