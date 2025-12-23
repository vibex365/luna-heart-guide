import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, ChefHat, Users, Flame, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const recipes = [
  {
    id: 'candlelit-pasta',
    title: 'Candlelit Pasta Night',
    description: 'Classic fettuccine alfredo with garlic bread - perfect for a cozy night in',
    image: '🍝',
    prepTime: 15,
    cookTime: 25,
    difficulty: 'Easy',
    servings: 2,
    mood: 'Romantic',
    ingredients: [
      '8 oz fettuccine pasta',
      '1 cup heavy cream',
      '1/2 cup butter',
      '1 cup parmesan cheese, grated',
      '3 cloves garlic, minced',
      'Salt and pepper to taste',
      'Fresh parsley for garnish',
      'Italian bread for garlic bread'
    ],
    instructions: [
      'Cook fettuccine according to package directions. Reserve 1/2 cup pasta water before draining.',
      'In a large skillet, melt butter over medium heat. Add garlic and sauté for 1 minute.',
      'Pour in heavy cream and bring to a gentle simmer.',
      'Gradually add parmesan cheese, stirring constantly until melted and smooth.',
      'Add drained pasta to the sauce, tossing to coat. Add pasta water if needed.',
      'Season with salt and pepper. Garnish with fresh parsley.',
      'Serve immediately with warm garlic bread and your favorite wine.'
    ],
    tips: 'Set the mood with candles, soft music, and turn off your phones!'
  },
  {
    id: 'sushi-date',
    title: 'Sushi Making Date',
    description: 'Learn to roll sushi together - fun, interactive, and delicious',
    image: '🍣',
    prepTime: 30,
    cookTime: 20,
    difficulty: 'Medium',
    servings: 2,
    mood: 'Playful',
    ingredients: [
      '2 cups sushi rice',
      '4 nori sheets',
      '1/2 lb fresh salmon or tuna (sushi grade)',
      '1 cucumber, julienned',
      '1 avocado, sliced',
      '2 tbsp rice vinegar',
      'Soy sauce, wasabi, pickled ginger'
    ],
    instructions: [
      'Rinse rice until water runs clear. Cook according to package directions.',
      'Season warm rice with rice vinegar, gently folding to combine. Let cool.',
      'Place nori sheet shiny-side down on bamboo mat.',
      'Spread thin layer of rice over nori, leaving 1-inch border at top.',
      'Add fillings in a line across the center.',
      'Roll tightly using the bamboo mat, sealing with water.',
      'Slice with wet knife into 6-8 pieces. Serve with soy sauce and wasabi.'
    ],
    tips: 'Make it a challenge - see who can roll the best sushi!'
  },
  {
    id: 'fondue-two',
    title: 'Fondue for Two',
    description: 'Cheese fondue with bread, veggies, and chocolate dessert fondue',
    image: '🫕',
    prepTime: 15,
    cookTime: 15,
    difficulty: 'Easy',
    servings: 2,
    mood: 'Intimate',
    ingredients: [
      '8 oz gruyere cheese, shredded',
      '4 oz emmental cheese, shredded',
      '1 cup dry white wine',
      '1 clove garlic',
      '1 tbsp cornstarch',
      'Crusty bread cubes',
      'Apple slices, vegetables for dipping',
      '6 oz dark chocolate for dessert fondue'
    ],
    instructions: [
      'Rub fondue pot with cut garlic clove.',
      'Heat wine in pot over medium heat until simmering.',
      'Toss cheeses with cornstarch. Gradually add to wine, stirring constantly.',
      'Stir until smooth and creamy. Keep warm over low heat.',
      'Arrange bread, apples, and veggies on a platter for dipping.',
      'For dessert: melt chocolate with a splash of cream.',
      'Dip strawberries, bananas, and marshmallows in chocolate.'
    ],
    tips: 'Take turns feeding each other for extra romance!'
  },
  {
    id: 'breakfast-bed',
    title: 'Breakfast in Bed',
    description: 'Surprise your partner with a gourmet breakfast tray',
    image: '🥞',
    prepTime: 20,
    cookTime: 20,
    difficulty: 'Easy',
    servings: 2,
    mood: 'Sweet',
    ingredients: [
      '1 cup flour',
      '1 egg',
      '1 cup milk',
      '2 tbsp butter',
      'Fresh berries',
      'Maple syrup',
      'Bacon or sausage',
      'Fresh orange juice',
      'Coffee or tea'
    ],
    instructions: [
      'Mix flour, egg, milk, and melted butter for pancake batter.',
      'Heat pan and make silver dollar pancakes for easy eating in bed.',
      'Cook bacon or sausage to desired crispness.',
      'Arrange everything beautifully on a tray.',
      'Add fresh flowers or a love note for extra points.',
      'Bring to your sleeping partner with a gentle wake-up kiss.'
    ],
    tips: 'Prepare everything the night before for a stress-free morning!'
  },
  {
    id: 'wine-cheese',
    title: 'Wine & Cheese Board',
    description: 'Curate the perfect charcuterie board for two',
    image: '🧀',
    prepTime: 20,
    cookTime: 0,
    difficulty: 'Easy',
    servings: 2,
    mood: 'Sophisticated',
    ingredients: [
      '3 varieties of cheese (soft, semi-hard, hard)',
      'Prosciutto and salami',
      'Crackers and crusty bread',
      'Grapes, figs, dried apricots',
      'Honey and fig jam',
      'Olives and nuts',
      'Bottle of wine (red or white)'
    ],
    instructions: [
      'Choose a beautiful board or slate.',
      'Place cheeses at different angles, leaving space between.',
      'Roll or fold meats and arrange near cheeses.',
      'Fill gaps with crackers and bread.',
      'Add fruits, nuts, and olives in small clusters.',
      'Drizzle honey and add small spoons for jams.',
      'Pair with wine and enjoy while chatting!'
    ],
    tips: 'Take cheese out 30 minutes before serving for best flavor!'
  },
  {
    id: 'steak-lobster',
    title: 'Steak & Lobster at Home',
    description: 'Recreate a steakhouse experience in your kitchen',
    image: '🥩',
    prepTime: 15,
    cookTime: 30,
    difficulty: 'Hard',
    servings: 2,
    mood: 'Luxurious',
    ingredients: [
      '2 ribeye or filet mignon steaks',
      '2 lobster tails',
      '4 tbsp butter',
      '4 cloves garlic, minced',
      'Fresh thyme and rosemary',
      'Salt and pepper',
      'Asparagus or baked potatoes'
    ],
    instructions: [
      'Bring steaks to room temperature. Season generously with salt and pepper.',
      'Heat cast iron skillet until smoking hot. Sear steaks 3-4 minutes per side.',
      'Add butter, garlic, and herbs. Baste steaks with melted butter.',
      'Rest steaks while preparing lobster.',
      'Butterfly lobster tails. Brush with garlic butter.',
      'Broil lobster 5-6 minutes until opaque.',
      'Serve with remaining garlic butter and your favorite sides.'
    ],
    tips: 'Use a meat thermometer: 130°F for medium-rare!'
  },
  {
    id: 'pizza-date',
    title: 'Pizza Making Date',
    description: 'Make pizza from scratch together - get creative with toppings!',
    image: '🍕',
    prepTime: 90,
    cookTime: 15,
    difficulty: 'Medium',
    servings: 2,
    mood: 'Fun',
    ingredients: [
      '2.5 cups flour',
      '1 packet instant yeast',
      '1 cup warm water',
      '2 tbsp olive oil',
      'Pizza sauce',
      'Mozzarella cheese',
      'Your favorite toppings',
      'Italian seasoning'
    ],
    instructions: [
      'Mix flour, yeast, water, oil, and salt. Knead until smooth.',
      'Let dough rise 1 hour until doubled.',
      'Preheat oven to 475°F with pizza stone if available.',
      'Divide dough in half. Each person stretches their own pizza!',
      'Add sauce, cheese, and toppings of choice.',
      'Bake 12-15 minutes until crust is golden and cheese bubbles.',
      'Compare pizzas and vote on the winner!'
    ],
    tips: 'Make it a competition to see who creates the best pizza!'
  },
  {
    id: 'chocolate-night',
    title: 'Chocolate Dessert Night',
    description: 'Decadent chocolate treats for the sweetest date',
    image: '🍫',
    prepTime: 20,
    cookTime: 25,
    difficulty: 'Medium',
    servings: 2,
    mood: 'Indulgent',
    ingredients: [
      '4 oz dark chocolate',
      '4 tbsp butter',
      '2 eggs',
      '1/4 cup sugar',
      '2 tbsp flour',
      'Vanilla ice cream',
      'Strawberries',
      'Whipped cream'
    ],
    instructions: [
      'Preheat oven to 425°F. Grease two ramekins.',
      'Melt chocolate and butter together. Let cool slightly.',
      'Whisk eggs and sugar until pale. Fold in chocolate mixture.',
      'Add flour and gently fold until combined.',
      'Divide between ramekins. Bake 12-14 minutes.',
      'Center should still be slightly jiggly.',
      'Serve immediately with ice cream and strawberries.'
    ],
    tips: 'The center should be molten when you cut into it!'
  },
  {
    id: 'mediterranean-mezze',
    title: 'Mediterranean Mezze',
    description: 'A spread of hummus, falafel, and fresh pita',
    image: '🥙',
    prepTime: 30,
    cookTime: 20,
    difficulty: 'Medium',
    servings: 2,
    mood: 'Healthy',
    ingredients: [
      '1 can chickpeas',
      'Tahini, lemon, garlic',
      'Falafel mix or frozen falafel',
      'Pita bread',
      'Cucumber, tomato, olives',
      'Feta cheese',
      'Olive oil and za\'atar'
    ],
    instructions: [
      'Blend chickpeas, tahini, lemon, garlic, and olive oil for hummus.',
      'Prepare falafel according to package directions.',
      'Warm pita bread in the oven.',
      'Chop cucumber, tomato, and arrange with olives and feta.',
      'Drizzle everything with olive oil and sprinkle za\'atar.',
      'Arrange on a large platter for sharing.',
      'Tear pita and enjoy the feast together!'
    ],
    tips: 'Play some Mediterranean music to set the mood!'
  },
  {
    id: 'indoor-picnic',
    title: 'Romantic Indoor Picnic',
    description: 'Set up a cozy picnic in your living room',
    image: '🧺',
    prepTime: 25,
    cookTime: 0,
    difficulty: 'Easy',
    servings: 2,
    mood: 'Whimsical',
    ingredients: [
      'Baguette and brie',
      'Grapes and strawberries',
      'Chicken salad or sandwiches',
      'Sparkling water or champagne',
      'Chocolate truffles',
      'Blanket and pillows',
      'Fairy lights or candles'
    ],
    instructions: [
      'Spread a blanket on the living room floor.',
      'Surround with pillows for comfort.',
      'Set up fairy lights or candles for ambiance.',
      'Prepare finger foods and arrange in a basket.',
      'Include cloth napkins and real glasses for elegance.',
      'Put on a playlist of your favorite songs.',
      'Enjoy your indoor adventure together!'
    ],
    tips: 'Turn off the TV and really connect with each other!'
  }
];

const Recipes = () => {
  const navigate = useNavigate();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-500/20 text-green-600';
      case 'Medium': return 'bg-amber-500/20 text-amber-600';
      case 'Hard': return 'bg-red-500/20 text-red-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b p-4 z-10">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/date-night')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="font-semibold flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-orange-500" />
              Romantic Recipes
            </h1>
            <p className="text-xs text-muted-foreground">Cook together, love together</p>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {recipes.map((recipe) => (
          <Card 
            key={recipe.id}
            className="cursor-pointer hover:shadow-lg transition-all"
            onClick={() => navigate(`/date-night/recipes/${recipe.id}`)}
          >
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center text-3xl flex-shrink-0">
                  {recipe.image}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{recipe.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {recipe.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="secondary" className={getDifficultyColor(recipe.difficulty)}>
                      {recipe.difficulty}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {recipe.prepTime + recipe.cookTime} min
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {recipe.mood}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Recipes;