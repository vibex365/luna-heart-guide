export interface DrinkingPrompt {
  text: string;
  category: "drink_if" | "sip_or_skip" | "never_have_i_ever" | "truth_or_drink";
  isSpicy: boolean;
}

export const drinkIfPrompts: DrinkingPrompt[] = [
  // Regular
  { text: "Drink if you've ever texted the wrong person", category: "drink_if", isSpicy: false },
  { text: "Drink if you've watched the same movie more than 5 times", category: "drink_if", isSpicy: false },
  { text: "Drink if you've ever forgotten your partner's birthday", category: "drink_if", isSpicy: false },
  { text: "Drink if you've cried during a movie together", category: "drink_if", isSpicy: false },
  { text: "Drink if you've ever pretended to like their cooking", category: "drink_if", isSpicy: false },
  { text: "Drink if you've stalked your partner's social media before dating", category: "drink_if", isSpicy: false },
  { text: "Drink if you've ever blamed a fart on a pet", category: "drink_if", isSpicy: false },
  { text: "Drink if you've ever eaten your partner's leftovers", category: "drink_if", isSpicy: false },
  { text: "Drink if you still have photos of your ex", category: "drink_if", isSpicy: false },
  { text: "Drink if you've ever pretended to be asleep to avoid something", category: "drink_if", isSpicy: false },
  
  // Spicy
  { text: "Drink if you've ever had a dream about someone else while in this relationship", category: "drink_if", isSpicy: true },
  { text: "Drink if you've ever faked enthusiasm in the bedroom", category: "drink_if", isSpicy: true },
  { text: "Drink if you've ever thought about your partner during work in an inappropriate way", category: "drink_if", isSpicy: true },
  { text: "Drink if you've ever taken a sneaky photo of your partner", category: "drink_if", isSpicy: true },
  { text: "Drink if you've ever wanted to try something new but been too shy to ask", category: "drink_if", isSpicy: true },
];

export const sipOrSkipPrompts: DrinkingPrompt[] = [
  // Regular
  { text: "What's the most embarrassing thing you've done in front of your partner?", category: "sip_or_skip", isSpicy: false },
  { text: "What's a habit of your partner's that secretly annoys you?", category: "sip_or_skip", isSpicy: false },
  { text: "What's the biggest lie you've told your partner?", category: "sip_or_skip", isSpicy: false },
  { text: "What's something you've never told your partner?", category: "sip_or_skip", isSpicy: false },
  { text: "What's your partner's worst outfit that you've never commented on?", category: "sip_or_skip", isSpicy: false },
  { text: "What celebrity would you leave your partner for?", category: "sip_or_skip", isSpicy: false },
  { text: "What's your biggest pet peeve about your partner?", category: "sip_or_skip", isSpicy: false },
  { text: "What's the most childish thing you've done in this relationship?", category: "sip_or_skip", isSpicy: false },
  
  // Spicy
  { text: "What's your biggest fantasy that you haven't shared yet?", category: "sip_or_skip", isSpicy: true },
  { text: "Where's the most adventurous place you'd want to be intimate?", category: "sip_or_skip", isSpicy: true },
  { text: "What's something new you want to try in the bedroom?", category: "sip_or_skip", isSpicy: true },
  { text: "What was your first impression of your partner's kissing?", category: "sip_or_skip", isSpicy: true },
  { text: "What's the most attractive thing your partner does without realizing?", category: "sip_or_skip", isSpicy: true },
];

export const neverHaveIEverDrinking: DrinkingPrompt[] = [
  // Regular
  { text: "Never have I ever gone through my partner's phone", category: "never_have_i_ever", isSpicy: false },
  { text: "Never have I ever lied about liking their family", category: "never_have_i_ever", isSpicy: false },
  { text: "Never have I ever pretended to listen when my partner was talking", category: "never_have_i_ever", isSpicy: false },
  { text: "Never have I ever said 'I love you' first", category: "never_have_i_ever", isSpicy: false },
  { text: "Never have I ever been jealous of my partner's friend", category: "never_have_i_ever", isSpicy: false },
  { text: "Never have I ever stalked an ex on social media while in this relationship", category: "never_have_i_ever", isSpicy: false },
  { text: "Never have I ever used my partner's toothbrush", category: "never_have_i_ever", isSpicy: false },
  { text: "Never have I ever thought about marriage", category: "never_have_i_ever", isSpicy: false },
  
  // Spicy
  { text: "Never have I ever thought about someone else during intimacy", category: "never_have_i_ever", isSpicy: true },
  { text: "Never have I ever sent a risqué photo", category: "never_have_i_ever", isSpicy: true },
  { text: "Never have I ever watched adult content without telling my partner", category: "never_have_i_ever", isSpicy: true },
  { text: "Never have I ever initiated intimacy in a public place", category: "never_have_i_ever", isSpicy: true },
  { text: "Never have I ever had a dream about my partner that made me blush", category: "never_have_i_ever", isSpicy: true },
];

export const truthOrDrinkPrompts: DrinkingPrompt[] = [
  // Regular
  { text: "What's the most embarrassing thing you've searched online?", category: "truth_or_drink", isSpicy: false },
  { text: "Have you ever regretted dating your partner?", category: "truth_or_drink", isSpicy: false },
  { text: "What's one thing you wish you could change about your relationship?", category: "truth_or_drink", isSpicy: false },
  { text: "What's the meanest thought you've had about your partner?", category: "truth_or_drink", isSpicy: false },
  { text: "What's something your partner does that you find secretly unattractive?", category: "truth_or_drink", isSpicy: false },
  { text: "Have you ever compared your partner to your ex?", category: "truth_or_drink", isSpicy: false },
  { text: "What's a secret you're keeping from your partner right now?", category: "truth_or_drink", isSpicy: false },
  
  // Spicy
  { text: "What's your biggest turn-on that your partner doesn't know about?", category: "truth_or_drink", isSpicy: true },
  { text: "What's the most adventurous thing on your intimate bucket list?", category: "truth_or_drink", isSpicy: true },
  { text: "Have you ever faked pleasure?", category: "truth_or_drink", isSpicy: true },
  { text: "What's something you want more of in the bedroom?", category: "truth_or_drink", isSpicy: true },
  { text: "What's the boldest thing you've ever done to seduce your partner?", category: "truth_or_drink", isSpicy: true },
];

export const allDrinkingPrompts = [
  ...drinkIfPrompts,
  ...sipOrSkipPrompts,
  ...neverHaveIEverDrinking,
  ...truthOrDrinkPrompts,
];

export const getPromptsByCategory = (category: DrinkingPrompt["category"], spicyMode: boolean) => {
  let prompts: DrinkingPrompt[] = [];
  
  switch (category) {
    case "drink_if":
      prompts = drinkIfPrompts;
      break;
    case "sip_or_skip":
      prompts = sipOrSkipPrompts;
      break;
    case "never_have_i_ever":
      prompts = neverHaveIEverDrinking;
      break;
    case "truth_or_drink":
      prompts = truthOrDrinkPrompts;
      break;
  }
  
  if (!spicyMode) {
    prompts = prompts.filter(p => !p.isSpicy);
  }
  
  return prompts;
};
