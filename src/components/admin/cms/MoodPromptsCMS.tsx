import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, MessageCircle } from "lucide-react";

interface MoodPrompt {
  id: string;
  prompt_text: string;
  mood_category: string | null;
  is_active: boolean;
  is_premium: boolean;
}

const defaultPrompt: Partial<MoodPrompt> = {
  prompt_text: "",
  mood_category: "neutral",
  is_active: true,
  is_premium: false,
};

export const MoodPromptsCMS = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MoodPrompt | null>(null);
  const [form, setForm] = useState<Partial<MoodPrompt>>(defaultPrompt);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ["admin-mood-prompts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mood_prompts")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as MoodPrompt[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (prompt: Partial<MoodPrompt>) => {
      if (editing) {
        const { error } = await supabase
          .from("mood_prompts")
          .update(prompt as any)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("mood_prompts")
          .insert(prompt as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-mood-prompts"] });
      toast({ title: editing ? "Prompt Updated" : "Prompt Created" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("mood_prompts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-mood-prompts"] });
      toast({ title: "Prompt Deleted" });
    },
  });

  const handleOpenDialog = (prompt?: MoodPrompt) => {
    if (prompt) {
      setEditing(prompt);
      setForm(prompt);
    } else {
      setEditing(null);
      setForm(defaultPrompt);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(defaultPrompt);
  };

  const handleSave = () => {
    if (!form.prompt_text?.trim()) return;
    saveMutation.mutate(form);
  };

  const getCategoryColor = (category: string | null) => {
    switch (category) {
      case "positive": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "sad": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "anxious": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Mood Prompts</h3>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Prompt
        </Button>
      </div>

      <div className="grid gap-3">
        {isLoading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : prompts.length === 0 ? (
          <div className="text-muted-foreground">No prompts yet</div>
        ) : (
          prompts.map((prompt) => (
            <div
              key={prompt.id}
              className="bg-card border border-border rounded-lg p-4 flex items-start justify-between"
            >
              <div className="flex items-start gap-3">
                <MessageCircle className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <p className="text-foreground">{prompt.prompt_text}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className={getCategoryColor(prompt.mood_category)}>
                      {prompt.mood_category || "general"}
                    </Badge>
                    {!prompt.is_active && <Badge variant="secondary">Inactive</Badge>}
                    {prompt.is_premium && <Badge>Premium</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(prompt)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(prompt.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Prompt" : "New Prompt"}</DialogTitle>
            <DialogDescription>Create a reflection prompt for users</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Prompt Text</Label>
              <Textarea
                value={form.prompt_text || ""}
                onChange={(e) => setForm({ ...form, prompt_text: e.target.value })}
                rows={3}
                placeholder="What made you smile today?"
              />
            </div>
            <div className="space-y-2">
              <Label>Mood Category</Label>
              <Select 
                value={form.mood_category || "neutral"} 
                onValueChange={(v) => setForm({ ...form, mood_category: v })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="sad">Sad</SelectItem>
                  <SelectItem value="anxious">Anxious</SelectItem>
                  <SelectItem value="angry">Angry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Premium Only</Label>
              <Switch checked={form.is_premium} onCheckedChange={(c) => setForm({ ...form, is_premium: c })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
