export interface ThisOrThatQuestion {
  optionA: string;
  optionB: string;
  category: "lifestyle" | "romance" | "food" | "adventure" | "intimate" | "future";
}

export const thisOrThatQuestions: ThisOrThatQuestion[] = [
  // Lifestyle
  { optionA: "Morning person", optionB: "Night owl", category: "lifestyle" },
  { optionA: "Netflix at home", optionB: "Night out dancing", category: "lifestyle" },
  { optionA: "Beach vacation", optionB: "Mountain getaway", category: "lifestyle" },
  { optionA: "Big party", optionB: "Intimate gathering", category: "lifestyle" },
  { optionA: "City life", optionB: "Countryside", category: "lifestyle" },
  { optionA: "Spontaneous trip", optionB: "Planned vacation", category: "lifestyle" },
  { optionA: "Cozy night in", optionB: "Exciting night out", category: "lifestyle" },
  { optionA: "Summer vibes", optionB: "Winter coziness", category: "lifestyle" },
  
  // Romance
  { optionA: "Surprise date", optionB: "Planned romantic evening", category: "romance" },
  { optionA: "Love letters", optionB: "Voice messages", category: "romance" },
  { optionA: "Public affection", optionB: "Private moments", category: "romance" },
  { optionA: "Grand gestures", optionB: "Small daily acts", category: "romance" },
  { optionA: "Flowers", optionB: "Experiences", category: "romance" },
  { optionA: "Breakfast in bed", optionB: "Candlelit dinner", category: "romance" },
  { optionA: "Slow dancing", optionB: "Wild dancing", category: "romance" },
  { optionA: "Movie night", optionB: "Stargazing", category: "romance" },
  
  // Food
  { optionA: "Sweet treats", optionB: "Savory snacks", category: "food" },
  { optionA: "Cook together", optionB: "Order takeout", category: "food" },
  { optionA: "Coffee date", optionB: "Wine tasting", category: "food" },
  { optionA: "Breakfast date", optionB: "Dinner date", category: "food" },
  { optionA: "Pizza night", optionB: "Sushi night", category: "food" },
  { optionA: "Homemade meal", optionB: "Fancy restaurant", category: "food" },
  { optionA: "Ice cream", optionB: "Cake", category: "food" },
  { optionA: "Picnic in the park", optionB: "Rooftop dining", category: "food" },
  
  // Adventure
  { optionA: "Skydiving", optionB: "Scuba diving", category: "adventure" },
  { optionA: "Road trip", optionB: "Flight to somewhere new", category: "adventure" },
  { optionA: "Camping under stars", optionB: "Luxury hotel", category: "adventure" },
  { optionA: "Hiking adventure", optionB: "Spa day", category: "adventure" },
  { optionA: "Learn something new together", optionB: "Perfect what we know", category: "adventure" },
  { optionA: "Thrill rides", optionB: "Scenic tours", category: "adventure" },
  { optionA: "Tropical island", optionB: "European cities", category: "adventure" },
  { optionA: "Safari adventure", optionB: "Cruise vacation", category: "adventure" },
  
  // Intimate
  { optionA: "Morning intimacy", optionB: "Late night passion", category: "intimate" },
  { optionA: "Bubble bath together", optionB: "Shower together", category: "intimate" },
  { optionA: "Massage night", optionB: "Game night", category: "intimate" },
  { optionA: "Cuddling all day", optionB: "Active adventure day", category: "intimate" },
  { optionA: "Whispered secrets", optionB: "Open conversations", category: "intimate" },
  { optionA: "Soft music", optionB: "Comfortable silence", category: "intimate" },
  { optionA: "Matching pajamas", optionB: "Nothing at all", category: "intimate" },
  { optionA: "Slow and tender", optionB: "Passionate and intense", category: "intimate" },
  
  // Future
  { optionA: "Big wedding", optionB: "Intimate ceremony", category: "future" },
  { optionA: "House in suburbs", optionB: "Apartment in city", category: "future" },
  { optionA: "Having pets", optionB: "Having plants", category: "future" },
  { optionA: "Travel the world", optionB: "Build a home base", category: "future" },
  { optionA: "Save for the future", optionB: "Live in the moment", category: "future" },
  { optionA: "Retire early", optionB: "Work on passion projects forever", category: "future" },
  { optionA: "Near family", optionB: "New adventures far away", category: "future" },
  { optionA: "Grow old together quietly", optionB: "Stay wild forever", category: "future" },
];

export const categoryIcons: Record<string, string> = {
  lifestyle: "🏠",
  romance: "💕",
  food: "🍽️",
  adventure: "🌍",
  intimate: "💋",
  future: "🔮",
};

export const categoryColors: Record<string, string> = {
  lifestyle: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  romance: "bg-pink-500/20 text-pink-300 border-pink-500/30",
  food: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  adventure: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  intimate: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  future: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
};
