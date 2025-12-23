import { useNavigate } from "react-router-dom";
import { Palette, ChefHat, Heart, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const DateNight = () => {
  const navigate = useNavigate();

  const activities = [
    {
      id: 'coloring',
      title: 'Coloring Together',
      description: 'Relaxing coloring pages for a creative date night',
      icon: Palette,
      color: 'from-pink-500 to-rose-500',
      route: '/date-night/coloring'
    },
    {
      id: 'recipes',
      title: 'Romantic Recipes',
      description: 'Cook a special dinner together',
      icon: ChefHat,
      color: 'from-orange-500 to-amber-500',
      route: '/date-night/recipes',
      comingSoon: false
    }
  ];

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Date Night</h1>
            <p className="text-sm text-muted-foreground">Fun activities for you and your partner</p>
          </div>
        </div>

        <div className="grid gap-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <Card 
                key={activity.id}
                className={`cursor-pointer hover:shadow-lg transition-all ${activity.comingSoon ? 'opacity-60' : ''}`}
                onClick={() => !activity.comingSoon && navigate(activity.route)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${activity.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{activity.title}</h3>
                        {activity.comingSoon && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Soon
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DateNight;
