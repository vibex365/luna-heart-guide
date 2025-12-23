import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BookOpen, Clock, ChevronRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Ebook {
  id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  chapters_count: number;
  estimated_read_time: number;
  is_premium: boolean;
}

interface EbookProgress {
  ebook_id: string;
  current_chapter: number;
  completed: boolean;
  completed_chapters: number[];
}

const Library = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: ebooks, isLoading: loadingBooks } = useQuery({
    queryKey: ['ebooks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ebooks')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as Ebook[];
    }
  });

  const { data: progress } = useQuery({
    queryKey: ['ebook-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('ebook_progress')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data as EbookProgress[];
    },
    enabled: !!user?.id
  });

  const getProgress = (ebookId: string, chaptersCount: number) => {
    const p = progress?.find(pr => pr.ebook_id === ebookId);
    if (!p) return 0;
    if (p.completed) return 100;
    return Math.round((p.completed_chapters?.length || 0) / chaptersCount * 100);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      communication: 'bg-blue-500/20 text-blue-600',
      healing: 'bg-green-500/20 text-green-600',
      conflict: 'bg-orange-500/20 text-orange-600',
      intimacy: 'bg-pink-500/20 text-pink-600',
    };
    return colors[category] || 'bg-primary/20 text-primary';
  };

  if (loadingBooks) {
    return (
      <div className="min-h-screen bg-background p-4 pb-24">
        <div className="max-w-lg mx-auto space-y-4">
          <Skeleton className="h-8 w-32" />
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 pb-24">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Library</h1>
            <p className="text-sm text-muted-foreground">Interactive relationship guides</p>
          </div>
        </div>

        <div className="space-y-4">
          {ebooks?.map((book) => {
            const progressPercent = getProgress(book.id, book.chapters_count);
            return (
              <Card 
                key={book.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/library/${book.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-20 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold line-clamp-2">{book.title}</h3>
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {book.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge className={getCategoryColor(book.category)} variant="secondary">
                          {book.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {book.estimated_read_time} min
                        </span>
                        {book.is_premium && (
                          <Badge variant="outline" className="gap-1">
                            <Sparkles className="w-3 h-3" /> Premium
                          </Badge>
                        )}
                      </div>
                      {progressPercent > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{progressPercent}%</span>
                          </div>
                          <Progress value={progressPercent} className="h-1.5" />
                        </div>
                      )}
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

export default Library;
