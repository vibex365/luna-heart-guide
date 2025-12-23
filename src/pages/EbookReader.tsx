import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, StickyNote, Gamepad2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ChapterGame } from "@/components/library/ChapterGame";
import ReactMarkdown from "react-markdown";

const EbookReader = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentChapter, setCurrentChapter] = useState(1);
  const [noteText, setNoteText] = useState("");
  const [showGame, setShowGame] = useState(false);

  const { data: book } = useQuery({
    queryKey: ['ebook', bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ebooks')
        .select('*')
        .eq('id', bookId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!bookId
  });

  const { data: chapters } = useQuery({
    queryKey: ['ebook-chapters', bookId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ebook_chapters')
        .select('*')
        .eq('ebook_id', bookId)
        .order('chapter_number');
      if (error) throw error;
      return data;
    },
    enabled: !!bookId
  });

  const { data: progress, refetch: refetchProgress } = useQuery({
    queryKey: ['ebook-progress', bookId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('ebook_progress')
        .select('*')
        .eq('ebook_id', bookId)
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!bookId && !!user?.id
  });

  const { data: existingNote } = useQuery({
    queryKey: ['chapter-note', chapters?.[currentChapter - 1]?.id, user?.id],
    queryFn: async () => {
      const chapterId = chapters?.[currentChapter - 1]?.id;
      if (!chapterId || !user?.id) return null;
      const { data } = await supabase
        .from('ebook_user_notes')
        .select('*')
        .eq('chapter_id', chapterId)
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!chapters?.[currentChapter - 1]?.id && !!user?.id
  });

  useEffect(() => {
    if (existingNote) {
      setNoteText(existingNote.note_text);
    } else {
      setNoteText("");
    }
  }, [existingNote, currentChapter]);

  useEffect(() => {
    if (progress?.current_chapter) {
      setCurrentChapter(progress.current_chapter);
    }
  }, [progress]);

  const saveNoteMutation = useMutation({
    mutationFn: async () => {
      const chapterId = chapters?.[currentChapter - 1]?.id;
      if (!chapterId || !user?.id || !noteText.trim()) return;

      if (existingNote) {
        await supabase
          .from('ebook_user_notes')
          .update({ note_text: noteText, updated_at: new Date().toISOString() })
          .eq('id', existingNote.id);
      } else {
        await supabase
          .from('ebook_user_notes')
          .insert({ user_id: user.id, chapter_id: chapterId, note_text: noteText });
      }
    },
    onSuccess: () => {
      toast({ title: "Note saved!" });
      queryClient.invalidateQueries({ queryKey: ['chapter-note'] });
    }
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (chapterNum: number) => {
      if (!user?.id || !bookId) return;
      
      const completedChapters = progress?.completed_chapters || [];
      if (!completedChapters.includes(currentChapter)) {
        completedChapters.push(currentChapter);
      }
      
      const isCompleted = completedChapters.length >= (chapters?.length || 0);

      if (progress) {
        await supabase
          .from('ebook_progress')
          .update({ 
            current_chapter: chapterNum, 
            completed_chapters: completedChapters,
            completed: isCompleted,
            last_read_at: new Date().toISOString() 
          })
          .eq('id', progress.id);
      } else {
        await supabase
          .from('ebook_progress')
          .insert({ 
            user_id: user.id, 
            ebook_id: bookId, 
            current_chapter: chapterNum,
            completed_chapters: completedChapters
          });
      }
    },
    onSuccess: () => refetchProgress()
  });

  const currentChapterData = chapters?.[currentChapter - 1];
  const isChapterCompleted = progress?.completed_chapters?.includes(currentChapter);

  const goToChapter = (num: number) => {
    updateProgressMutation.mutate(num);
    setCurrentChapter(num);
    setShowGame(false);
  };

  if (!book || !chapters) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Skeleton className="h-8 w-32 mb-4" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b p-4 z-10">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" onClick={() => navigate('/library')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold truncate">{book.title}</h1>
            <p className="text-sm text-muted-foreground">
              Chapter {currentChapter} of {chapters.length}
            </p>
          </div>
          {isChapterCompleted && (
            <Badge variant="secondary" className="gap-1">
              <Check className="w-3 h-3" /> Done
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto p-4 pb-32">
          {showGame && currentChapterData?.has_game ? (
            <ChapterGame 
              gameType={currentChapterData.game_type || 'quiz'}
              gameData={currentChapterData.game_data as any}
              onComplete={() => {
                setShowGame(false);
                if (currentChapter < chapters.length) {
                  goToChapter(currentChapter + 1);
                }
              }}
              onBack={() => setShowGame(false)}
            />
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-6">{currentChapterData?.title}</h2>
              <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/80 prose-strong:text-foreground prose-li:text-foreground/80">
                <ReactMarkdown>
                  {currentChapterData?.content || ''}
                </ReactMarkdown>
              </div>

              {/* Notes Section */}
              <Card className="mt-8">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <StickyNote className="w-5 h-5 text-amber-500" />
                    <span className="font-medium">Your Notes</span>
                  </div>
                  <Textarea
                    placeholder="Write your thoughts, reflections, or key takeaways..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={4}
                    className="mb-3"
                  />
                  <Button 
                    size="sm" 
                    onClick={() => saveNoteMutation.mutate()}
                    disabled={!noteText.trim() || saveNoteMutation.isPending}
                  >
                    {saveNoteMutation.isPending ? 'Saving...' : 'Save Note'}
                  </Button>
                </CardContent>
              </Card>

              {/* Chapter Game Button */}
              {currentChapterData?.has_game && (
                <Button 
                  className="w-full mt-4 gap-2" 
                  variant="outline"
                  onClick={() => setShowGame(true)}
                >
                  <Gamepad2 className="w-4 h-4" />
                  Take the Chapter Activity
                </Button>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Navigation */}
      {!showGame && (
        <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t p-4">
          <div className="flex justify-between max-w-2xl mx-auto">
            <Button
              variant="outline"
              onClick={() => goToChapter(currentChapter - 1)}
              disabled={currentChapter <= 1}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <Button
              onClick={() => goToChapter(currentChapter + 1)}
              disabled={currentChapter >= chapters.length}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EbookReader;
