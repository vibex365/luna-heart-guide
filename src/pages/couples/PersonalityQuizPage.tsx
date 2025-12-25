import { ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PersonalityQuiz } from '@/components/couples/PersonalityQuiz';
import { useCouplesTrial } from '@/hooks/useCouplesTrial';

const PersonalityQuizPage = () => {
  const navigate = useNavigate();
  const { hasCouplesAccess } = useCouplesTrial();

  if (!hasCouplesAccess) {
    navigate('/couples');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-background to-purple-50 dark:from-rose-950/20 dark:via-background dark:to-purple-950/20 pb-24">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Relationship Style
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Intro Card */}
        <Card className="border-0 bg-gradient-to-br from-amber-100/80 via-orange-50/80 to-rose-100/80 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-rose-950/30 shadow-lg">
          <CardContent className="p-6 text-center space-y-3">
            <h2 className="text-2xl font-bold">Talk, laugh, and learn together</h2>
            <p className="text-muted-foreground">
              Take our quiz to understand the psychology behind your relationship.
            </p>
          </CardContent>
        </Card>

        {/* Quiz Component */}
        <PersonalityQuiz 
          onComplete={(archetype) => {
            console.log('Quiz completed:', archetype);
          }}
        />
      </div>
    </div>
  );
};

export default PersonalityQuizPage;
