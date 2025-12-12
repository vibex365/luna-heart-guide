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
import { Plus, Edit, Trash2, Wind } from "lucide-react";

interface BreathingExercise {
  id: string;
  title: string;
  description: string | null;
  inhale_seconds: number;
  hold_seconds: number;
  exhale_seconds: number;
  cycles: number;
  difficulty: string;
  category: string;
  is_active: boolean;
  is_premium: boolean;
}

const defaultExercise: Partial<BreathingExercise> = {
  title: "",
  description: "",
  inhale_seconds: 4,
  hold_seconds: 4,
  exhale_seconds: 4,
  cycles: 4,
  difficulty: "beginner",
  category: "relaxation",
  is_active: true,
  is_premium: false,
};

export const BreathingExercisesCMS = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BreathingExercise | null>(null);
  const [form, setForm] = useState<Partial<BreathingExercise>>(defaultExercise);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: exercises = [], isLoading } = useQuery({
    queryKey: ["admin-breathing-exercises"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("breathing_exercises")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as BreathingExercise[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (exercise: Partial<BreathingExercise>) => {
      if (editing) {
        const { error } = await supabase
          .from("breathing_exercises")
          .update(exercise as any)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("breathing_exercises")
          .insert(exercise as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-breathing-exercises"] });
      toast({ title: editing ? "Exercise Updated" : "Exercise Created" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("breathing_exercises").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-breathing-exercises"] });
      toast({ title: "Exercise Deleted" });
    },
  });

  const handleOpenDialog = (exercise?: BreathingExercise) => {
    if (exercise) {
      setEditing(exercise);
      setForm(exercise);
    } else {
      setEditing(null);
      setForm(defaultExercise);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(defaultExercise);
  };

  const handleSave = () => {
    if (!form.title?.trim()) return;
    saveMutation.mutate(form);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Breathing Exercises</h3>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Exercise
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : exercises.length === 0 ? (
          <div className="text-muted-foreground">No exercises yet</div>
        ) : (
          exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="bg-card border border-border rounded-lg p-4 flex items-start justify-between"
            >
              <div className="flex items-start gap-3">
                <Wind className="h-5 w-5 text-accent mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{exercise.title}</span>
                    {!exercise.is_active && <Badge variant="secondary">Inactive</Badge>}
                    {exercise.is_premium && <Badge>Premium</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {exercise.description}
                  </p>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Inhale: {exercise.inhale_seconds}s</span>
                    <span>Hold: {exercise.hold_seconds}s</span>
                    <span>Exhale: {exercise.exhale_seconds}s</span>
                    <span>Cycles: {exercise.cycles}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(exercise)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(exercise.id)}>
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
            <DialogTitle>{editing ? "Edit Exercise" : "New Exercise"}</DialogTitle>
            <DialogDescription>Configure the breathing exercise</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title || ""}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-2">
                <Label>Inhale (s)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.inhale_seconds}
                  onChange={(e) => setForm({ ...form, inhale_seconds: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Hold (s)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.hold_seconds}
                  onChange={(e) => setForm({ ...form, hold_seconds: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Exhale (s)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.exhale_seconds}
                  onChange={(e) => setForm({ ...form, exhale_seconds: parseInt(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cycles</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.cycles}
                  onChange={(e) => setForm({ ...form, cycles: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={form.difficulty} onValueChange={(v) => setForm({ ...form, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relaxation">Relaxation</SelectItem>
                    <SelectItem value="sleep">Sleep</SelectItem>
                    <SelectItem value="energy">Energy</SelectItem>
                    <SelectItem value="focus">Focus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
