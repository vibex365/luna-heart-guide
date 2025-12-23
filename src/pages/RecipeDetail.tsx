import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Users, Flame, Heart, Lightbulb, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { recipes } from "./Recipes";
import { useState } from "react";

const RecipeDetail = () => {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);
  const [checkedIngredients, setCheckedIngredients] = useState<number[]>([]);

  const recipe = recipes.find(r => r.id === recipeId);

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Recipe not found</p>
      </div>
    );
  }

  const toggleStep = (index: number) => {
    setCheckedSteps(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const toggleIngredient = (index: number) => {
    setCheckedIngredients(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

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
          <Button variant="ghost" size="icon" onClick={() => navigate('/date-night/recipes')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold truncate">{recipe.title}</h1>
            <p className="text-xs text-muted-foreground">{recipe.mood} mood</p>
          </div>
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-80px)]">
        <div className="p-4 max-w-lg mx-auto space-y-6">
          {/* Hero */}
          <div className="text-center space-y-4">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center text-5xl mx-auto">
              {recipe.image}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{recipe.title}</h2>
              <p className="text-muted-foreground mt-1">{recipe.description}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Prep</p>
              <p className="font-semibold text-sm">{recipe.prepTime}m</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Flame className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Cook</p>
              <p className="font-semibold text-sm">{recipe.cookTime}m</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Users className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Serves</p>
              <p className="font-semibold text-sm">{recipe.servings}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <Heart className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Mood</p>
              <Badge variant="secondary" className={`${getDifficultyColor(recipe.difficulty)} text-[10px] px-1.5`}>
                {recipe.difficulty}
              </Badge>
            </div>
          </div>

          {/* Tip */}
          {recipe.tips && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4 flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{recipe.tips}</p>
              </CardContent>
            </Card>
          )}

          {/* Ingredients */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Ingredients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <button
                  key={index}
                  onClick={() => toggleIngredient(index)}
                  className={`w-full text-left p-2 rounded-lg transition-all flex items-center gap-3 ${
                    checkedIngredients.includes(index) 
                      ? 'bg-green-500/10 text-muted-foreground line-through' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    checkedIngredients.includes(index) ? 'border-green-500 bg-green-500' : 'border-muted-foreground'
                  }`}>
                    {checkedIngredients.includes(index) && (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="text-sm">{ingredient}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recipe.instructions.map((step, index) => (
                <button
                  key={index}
                  onClick={() => toggleStep(index)}
                  className={`w-full text-left transition-all ${
                    checkedSteps.includes(index) ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold ${
                      checkedSteps.includes(index) 
                        ? 'bg-green-500 text-white' 
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {checkedSteps.includes(index) ? '✓' : index + 1}
                    </div>
                    <p className={`text-sm pt-1 ${checkedSteps.includes(index) ? 'line-through text-muted-foreground' : ''}`}>
                      {step}
                    </p>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Progress */}
          <div className="text-center text-sm text-muted-foreground">
            {checkedSteps.length} of {recipe.instructions.length} steps completed
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default RecipeDetail;