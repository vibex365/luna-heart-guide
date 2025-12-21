export interface Sticker {
  id: string;
  emoji: string;
  label: string;
}

export interface StickerPack {
  id: string;
  name: string;
  icon: string;
  stickers: Sticker[];
}

export const stickerPacks: StickerPack[] = [
  {
    id: "love",
    name: "Love",
    icon: "❤️",
    stickers: [
      { id: "love-1", emoji: "❤️", label: "Red Heart" },
      { id: "love-2", emoji: "💕", label: "Two Hearts" },
      { id: "love-3", emoji: "💗", label: "Growing Heart" },
      { id: "love-4", emoji: "💖", label: "Sparkling Heart" },
      { id: "love-5", emoji: "😘", label: "Kissing Face" },
      { id: "love-6", emoji: "🥰", label: "Smiling with Hearts" },
      { id: "love-7", emoji: "😍", label: "Heart Eyes" },
      { id: "love-8", emoji: "💋", label: "Kiss Mark" },
      { id: "love-9", emoji: "💘", label: "Heart with Arrow" },
      { id: "love-10", emoji: "💝", label: "Heart with Ribbon" },
      { id: "love-11", emoji: "💓", label: "Beating Heart" },
      { id: "love-12", emoji: "💞", label: "Revolving Hearts" },
    ],
  },
  {
    id: "cute",
    name: "Cute",
    icon: "🥺",
    stickers: [
      { id: "cute-1", emoji: "🥺", label: "Pleading Face" },
      { id: "cute-2", emoji: "🤗", label: "Hugging Face" },
      { id: "cute-3", emoji: "😊", label: "Smiling Face" },
      { id: "cute-4", emoji: "🙈", label: "See No Evil" },
      { id: "cute-5", emoji: "🙊", label: "Speak No Evil" },
      { id: "cute-6", emoji: "🫶", label: "Heart Hands" },
      { id: "cute-7", emoji: "✨", label: "Sparkles" },
      { id: "cute-8", emoji: "💫", label: "Dizzy" },
      { id: "cute-9", emoji: "🌟", label: "Glowing Star" },
      { id: "cute-10", emoji: "🧸", label: "Teddy Bear" },
      { id: "cute-11", emoji: "🦋", label: "Butterfly" },
      { id: "cute-12", emoji: "🌈", label: "Rainbow" },
    ],
  },
  {
    id: "fun",
    name: "Fun",
    icon: "😂",
    stickers: [
      { id: "fun-1", emoji: "😂", label: "Joy" },
      { id: "fun-2", emoji: "🤣", label: "ROFL" },
      { id: "fun-3", emoji: "😜", label: "Winking Tongue" },
      { id: "fun-4", emoji: "🤪", label: "Zany Face" },
      { id: "fun-5", emoji: "😝", label: "Squinting Tongue" },
      { id: "fun-6", emoji: "🎉", label: "Party Popper" },
      { id: "fun-7", emoji: "🔥", label: "Fire" },
      { id: "fun-8", emoji: "💯", label: "Hundred" },
      { id: "fun-9", emoji: "🙌", label: "Raising Hands" },
      { id: "fun-10", emoji: "👏", label: "Clapping" },
      { id: "fun-11", emoji: "🥳", label: "Partying Face" },
      { id: "fun-12", emoji: "🤩", label: "Star Struck" },
    ],
  },
  {
    id: "romantic",
    name: "Romance",
    icon: "💑",
    stickers: [
      { id: "romantic-1", emoji: "👫", label: "Couple" },
      { id: "romantic-2", emoji: "💑", label: "Couple with Heart" },
      { id: "romantic-3", emoji: "🌹", label: "Rose" },
      { id: "romantic-4", emoji: "🍫", label: "Chocolate" },
      { id: "romantic-5", emoji: "☕", label: "Coffee" },
      { id: "romantic-6", emoji: "🎬", label: "Movie" },
      { id: "romantic-7", emoji: "🌙", label: "Moon" },
      { id: "romantic-8", emoji: "🌸", label: "Cherry Blossom" },
      { id: "romantic-9", emoji: "🎁", label: "Gift" },
      { id: "romantic-10", emoji: "🕯️", label: "Candle" },
      { id: "romantic-11", emoji: "🍷", label: "Wine" },
      { id: "romantic-12", emoji: "💐", label: "Bouquet" },
    ],
  },
  {
    id: "flirty",
    name: "Flirty",
    icon: "😏",
    stickers: [
      { id: "flirty-1", emoji: "😏", label: "Smirking Face" },
      { id: "flirty-2", emoji: "😉", label: "Winking Face" },
      { id: "flirty-3", emoji: "🤭", label: "Face with Hand Over Mouth" },
      { id: "flirty-4", emoji: "😈", label: "Smiling Devil" },
      { id: "flirty-5", emoji: "👀", label: "Eyes" },
      { id: "flirty-6", emoji: "🫣", label: "Peeking Eye" },
      { id: "flirty-7", emoji: "🤤", label: "Drooling Face" },
      { id: "flirty-8", emoji: "😋", label: "Yummy Face" },
      { id: "flirty-9", emoji: "💅", label: "Nail Polish" },
      { id: "flirty-10", emoji: "🍑", label: "Peach" },
      { id: "flirty-11", emoji: "🍒", label: "Cherries" },
      { id: "flirty-12", emoji: "🌶️", label: "Hot Pepper" },
    ],
  },
];

export const quickReactions = [
  { emoji: "❤️", label: "Love" },
  { emoji: "😂", label: "Laugh" },
  { emoji: "😮", label: "Wow" },
  { emoji: "😢", label: "Sad" },
  { emoji: "🔥", label: "Fire" },
  { emoji: "👍", label: "Thumbs Up" },
  { emoji: "🍆", label: "Eggplant" },
  { emoji: "👅", label: "Tongue" },
  { emoji: "💦", label: "Sweat Droplets" },
  { emoji: "🍑", label: "Peach" },
  { emoji: "😈", label: "Devil" },
  { emoji: "😏", label: "Smirk" },
  { emoji: "🥵", label: "Hot Face" },
  { emoji: "😍", label: "Heart Eyes" },
  { emoji: "🤤", label: "Drooling" },
];
