import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Database, Sparkles } from "lucide-react";
import { thisOrThatQuestions } from "@/data/thisOrThatQuestions";
import { spicyTruths, spicyDares, regularTruths, regularDares, spicyNeverHaveIEver, regularNeverHaveIEver } from "@/data/spicyGameContent";

type GameType = "this_or_that" | "would_you_rather" | "truth_or_dare" | "never_have_i_ever" | "conversation_starters";
type Difficulty = "regular" | "spicy" | "intimate";

interface GameQuestion {
  id: string;
  game_type: GameType;
  question_text: string;
  option_a: string | null;
  option_b: string | null;
  category: string;
  difficulty: Difficulty;
  depth: number;
  is_active: boolean;
  is_premium: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface FormData {
  question_text: string;
  option_a: string;
  option_b: string;
  category: string;
  difficulty: Difficulty;
  depth: number;
  is_active: boolean;
  is_premium: boolean;
}

const gameTypeLabels: Record<GameType, string> = {
  this_or_that: "This or That",
  would_you_rather: "Would You Rather",
  truth_or_dare: "Truth or Dare",
  never_have_i_ever: "Never Have I Ever",
  conversation_starters: "Conversation Starters",
};

const categoryOptions: Record<GameType, string[]> = {
  this_or_that: ["lifestyle", "romance", "food", "adventure", "intimate", "future"],
  would_you_rather: ["general", "romantic", "spicy", "funny"],
  truth_or_dare: ["truth", "dare"],
  never_have_i_ever: ["general", "romantic", "adventure", "spicy"],
  conversation_starters: ["deep", "fun", "dreams", "memories", "growth"],
};

const defaultFormData: FormData = {
  question_text: "",
  option_a: "",
  option_b: "",
  category: "general",
  difficulty: "regular",
  depth: 1,
  is_active: true,
  is_premium: false,
};

export const CouplesGameCMS = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<GameType>("this_or_that");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<GameQuestion | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [isSeeding, setIsSeeding] = useState(false);

  // Fetch questions for current game type
  const { data: questions, isLoading } = useQuery({
    queryKey: ["couples-game-questions", activeTab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("couples_game_questions")
        .select("*")
        .eq("game_type", activeTab)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as GameQuestion[];
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase.from("couples_game_questions").insert({
        game_type: activeTab,
        question_text: data.question_text,
        option_a: data.option_a || null,
        option_b: data.option_b || null,
        category: data.category,
        difficulty: data.difficulty,
        depth: data.depth,
        is_active: data.is_active,
        is_premium: data.is_premium,
        sort_order: (questions?.length || 0) + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["couples-game-questions"] });
      toast.success("Question created successfully");
      closeDialog();
    },
    onError: (error) => {
      toast.error("Failed to create question: " + error.message);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData }) => {
      const { error } = await supabase
        .from("couples_game_questions")
        .update({
          question_text: data.question_text,
          option_a: data.option_a || null,
          option_b: data.option_b || null,
          category: data.category,
          difficulty: data.difficulty,
          depth: data.depth,
          is_active: data.is_active,
          is_premium: data.is_premium,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["couples-game-questions"] });
      toast.success("Question updated successfully");
      closeDialog();
    },
    onError: (error) => {
      toast.error("Failed to update question: " + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("couples_game_questions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["couples-game-questions"] });
      toast.success("Question deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete question: " + error.message);
    },
  });

  // Seed from defaults
  const handleSeedDefaults = async () => {
    setIsSeeding(true);
    try {
      const questionsToInsert: Omit<GameQuestion, "id" | "created_at" | "updated_at">[] = [];
      let sortOrder = 0;

      // This or That questions
      thisOrThatQuestions.forEach((q) => {
        questionsToInsert.push({
          game_type: "this_or_that",
          question_text: `${q.optionA} or ${q.optionB}?`,
          option_a: q.optionA,
          option_b: q.optionB,
          category: q.category,
          difficulty: q.category === "intimate" ? "spicy" : "regular",
          depth: 1,
          is_active: true,
          is_premium: false,
          sort_order: sortOrder++,
        });
      });

      // Truth or Dare - Regular truths
      regularTruths.forEach((q) => {
        questionsToInsert.push({
          game_type: "truth_or_dare",
          question_text: q,
          option_a: null,
          option_b: null,
          category: "truth",
          difficulty: "regular",
          depth: 1,
          is_active: true,
          is_premium: false,
          sort_order: sortOrder++,
        });
      });

      // Truth or Dare - Spicy truths
      spicyTruths.forEach((q) => {
        questionsToInsert.push({
          game_type: "truth_or_dare",
          question_text: q,
          option_a: null,
          option_b: null,
          category: "truth",
          difficulty: "spicy",
          depth: 2,
          is_active: true,
          is_premium: false,
          sort_order: sortOrder++,
        });
      });

      // Truth or Dare - Regular dares
      regularDares.forEach((q) => {
        questionsToInsert.push({
          game_type: "truth_or_dare",
          question_text: q,
          option_a: null,
          option_b: null,
          category: "dare",
          difficulty: "regular",
          depth: 1,
          is_active: true,
          is_premium: false,
          sort_order: sortOrder++,
        });
      });

      // Truth or Dare - Spicy dares
      spicyDares.forEach((q) => {
        questionsToInsert.push({
          game_type: "truth_or_dare",
          question_text: q,
          option_a: null,
          option_b: null,
          category: "dare",
          difficulty: "spicy",
          depth: 2,
          is_active: true,
          is_premium: false,
          sort_order: sortOrder++,
        });
      });

      // Never Have I Ever - Regular
      regularNeverHaveIEver.forEach((q) => {
        questionsToInsert.push({
          game_type: "never_have_i_ever",
          question_text: q,
          option_a: null,
          option_b: null,
          category: "general",
          difficulty: "regular",
          depth: 1,
          is_active: true,
          is_premium: false,
          sort_order: sortOrder++,
        });
      });

      // Never Have I Ever - Spicy
      spicyNeverHaveIEver.forEach((q) => {
        questionsToInsert.push({
          game_type: "never_have_i_ever",
          question_text: q,
          option_a: null,
          option_b: null,
          category: "spicy",
          difficulty: "spicy",
          depth: 2,
          is_active: true,
          is_premium: false,
          sort_order: sortOrder++,
        });
      });

      // Conversation Starters
      const conversationStarters = [
        { text: "What's something you've never told anyone before?", category: "deep", depth: 3 },
        { text: "When do you feel most loved by me?", category: "deep", depth: 2 },
        { text: "If we could teleport anywhere right now, where would you go?", category: "fun", depth: 1 },
        { text: "Where do you see us in 10 years?", category: "dreams", depth: 2 },
        { text: "What's your favorite memory of us together?", category: "memories", depth: 1 },
        { text: "How have I helped you become a better person?", category: "growth", depth: 2 },
        { text: "What does 'home' mean to you?", category: "deep", depth: 2 },
        { text: "What's on your bucket list that you want us to do together?", category: "dreams", depth: 2 },
        { text: "When did you first realize you loved me?", category: "memories", depth: 2 },
        { text: "What's something you want us to work on together?", category: "growth", depth: 2 },
      ];
      
      conversationStarters.forEach((q) => {
        questionsToInsert.push({
          game_type: "conversation_starters",
          question_text: q.text,
          option_a: null,
          option_b: null,
          category: q.category,
          difficulty: "regular",
          depth: q.depth,
          is_active: true,
          is_premium: false,
          sort_order: sortOrder++,
        });
      });

      const { error } = await supabase.from("couples_game_questions").insert(questionsToInsert);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["couples-game-questions"] });
      toast.success(`Successfully seeded ${questionsToInsert.length} questions!`);
    } catch (error: any) {
      toast.error("Failed to seed questions: " + error.message);
    } finally {
      setIsSeeding(false);
    }
  };

  const openCreateDialog = () => {
    setEditingQuestion(null);
    setFormData({
      ...defaultFormData,
      category: categoryOptions[activeTab]?.[0] || "general",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (question: GameQuestion) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      option_a: question.option_a || "",
      option_b: question.option_b || "",
      category: question.category,
      difficulty: question.difficulty as Difficulty,
      depth: question.depth,
      is_active: question.is_active,
      is_premium: question.is_premium,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingQuestion(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = () => {
    if (!formData.question_text.trim()) {
      toast.error("Question text is required");
      return;
    }

    if (editingQuestion) {
      updateMutation.mutate({ id: editingQuestion.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const needsOptions = activeTab === "this_or_that" || activeTab === "would_you_rather";

  return (
    <div className="space-y-6">
      {/* Header with seed button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Couples Game Questions</h2>
          <p className="text-sm text-muted-foreground">Manage content for couples games</p>
        </div>
        <Button
          variant="outline"
          onClick={handleSeedDefaults}
          disabled={isSeeding}
          className="gap-2"
        >
          {isSeeding ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Database className="h-4 w-4" />
          )}
          Seed from Defaults
        </Button>
      </div>

      {/* Game type tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as GameType)}>
        <TabsList className="grid w-full grid-cols-5">
          {Object.entries(gameTypeLabels).map(([key, label]) => (
            <TabsTrigger key={key} value={key} className="text-xs">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.keys(gameTypeLabels).map((gameType) => (
          <TabsContent key={gameType} value={gameType} className="space-y-4">
            {/* Add button */}
            <div className="flex justify-end">
              <Button onClick={openCreateDialog} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Question
              </Button>
            </div>

            {/* Questions list */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : questions?.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No questions yet for {gameTypeLabels[activeTab]}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add questions manually or seed from defaults
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {questions?.map((question) => (
                  <Card key={question.id} className={!question.is_active ? "opacity-50" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {question.question_text}
                          </p>
                          {(question.option_a || question.option_b) && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {question.option_a} vs {question.option_b}
                            </p>
                          )}
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {question.category}
                            </Badge>
                            <Badge
                              variant={question.difficulty === "spicy" ? "destructive" : "secondary"}
                              className="text-xs"
                            >
                              {question.difficulty}
                            </Badge>
                            {question.is_premium && (
                              <Badge className="text-xs bg-amber-500">Premium</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(question)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(question.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Edit Question" : "Add Question"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="question_text">Question Text</Label>
              <Textarea
                id="question_text"
                value={formData.question_text}
                onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                placeholder={
                  activeTab === "never_have_i_ever"
                    ? "Never have I ever..."
                    : activeTab === "truth_or_dare"
                    ? "Enter truth question or dare..."
                    : "Enter question..."
                }
                rows={3}
              />
            </div>

            {needsOptions && (
              <>
                <div>
                  <Label htmlFor="option_a">Option A</Label>
                  <Input
                    id="option_a"
                    value={formData.option_a}
                    onChange={(e) => setFormData({ ...formData, option_a: e.target.value })}
                    placeholder="First option"
                  />
                </div>
                <div>
                  <Label htmlFor="option_b">Option B</Label>
                  <Input
                    id="option_b"
                    value={formData.option_b}
                    onChange={(e) => setFormData({ ...formData, option_b: e.target.value })}
                    placeholder="Second option"
                  />
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions[activeTab]?.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(v) => setFormData({ ...formData, difficulty: v as Difficulty })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="spicy">Spicy</SelectItem>
                    <SelectItem value="intimate">Intimate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_premium"
                  checked={formData.is_premium}
                  onCheckedChange={(v) => setFormData({ ...formData, is_premium: v })}
                />
                <Label htmlFor="is_premium">Premium</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingQuestion ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
