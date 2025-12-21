import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit, Trash2, MessageCircleQuestion, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface DailyQuestion {
  id: string;
  question_text: string;
  category: string;
  difficulty: string;
  is_active: boolean;
  sort_order: number;
}

export const DailyQuestionsCMS = () => {
  const queryClient = useQueryClient();
  const [editingQuestion, setEditingQuestion] = useState<DailyQuestion | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question_text: "",
    category: "general",
    difficulty: "easy",
  });

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["admin-daily-questions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_questions")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as DailyQuestion[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (question: typeof newQuestion) => {
      const { error } = await supabase.from("daily_questions").insert(question);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-daily-questions"] });
      toast.success("Question added!");
      setIsAddDialogOpen(false);
      setNewQuestion({ question_text: "", category: "general", difficulty: "easy" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (question: DailyQuestion) => {
      const { error } = await supabase
        .from("daily_questions")
        .update({
          question_text: question.question_text,
          category: question.category,
          difficulty: question.difficulty,
          is_active: question.is_active,
          sort_order: question.sort_order,
        })
        .eq("id", question.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-daily-questions"] });
      toast.success("Question updated!");
      setEditingQuestion(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("daily_questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-daily-questions"] });
      toast.success("Question deleted!");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const categories = ["general", "appreciation", "love", "dreams", "memories", "fun", "growth", "adventure", "deep"];
  const difficulties = ["easy", "medium", "hard"];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageCircleQuestion className="w-5 h-5" />
          Daily Questions ({questions.length})
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add Question
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Daily Question</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Question</Label>
                <Textarea
                  value={newQuestion.question_text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                  placeholder="Enter the question..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select
                    value={newQuestion.category}
                    onValueChange={(v) => setNewQuestion({ ...newQuestion, category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <Select
                    value={newQuestion.difficulty}
                    onValueChange={(v) => setNewQuestion({ ...newQuestion, difficulty: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {difficulties.map((diff) => (
                        <SelectItem key={diff} value={diff}>
                          {diff}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => addMutation.mutate(newQuestion)} className="w-full">
                Add Question
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {questions.map((q) => (
              <div
                key={q.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50"
              >
                <div className="flex-1">
                  {editingQuestion?.id === q.id ? (
                    <Textarea
                      value={editingQuestion.question_text}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, question_text: e.target.value })
                      }
                      className="mb-2"
                    />
                  ) : (
                    <p className="text-sm">{q.question_text}</p>
                  )}
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                      {q.category}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-muted">{q.difficulty}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={q.is_active}
                    onCheckedChange={(checked) =>
                      updateMutation.mutate({ ...q, is_active: checked })
                    }
                  />
                  {editingQuestion?.id === q.id ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => updateMutation.mutate(editingQuestion)}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button size="icon" variant="ghost" onClick={() => setEditingQuestion(q)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => deleteMutation.mutate(q.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
