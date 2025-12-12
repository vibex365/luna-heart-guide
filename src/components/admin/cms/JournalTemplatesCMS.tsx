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
import { Plus, Edit, Trash2, BookOpen, X } from "lucide-react";

interface JournalTemplate {
  id: string;
  title: string;
  description: string | null;
  prompts: string[];
  category: string;
  is_active: boolean;
  is_premium: boolean;
}

const defaultTemplate: Partial<JournalTemplate> = {
  title: "",
  description: "",
  prompts: [],
  category: "general",
  is_active: true,
  is_premium: false,
};

export const JournalTemplatesCMS = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<JournalTemplate | null>(null);
  const [form, setForm] = useState<Partial<JournalTemplate>>(defaultTemplate);
  const [newPrompt, setNewPrompt] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["admin-journal-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_templates")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data as unknown as JournalTemplate[]) || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (template: Partial<JournalTemplate>) => {
      const payload = {
        ...template,
        prompts: template.prompts as any,
      };
      if (editing) {
        const { error } = await supabase
          .from("journal_templates")
          .update(payload as any)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("journal_templates")
          .insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-journal-templates"] });
      toast({ title: editing ? "Template Updated" : "Template Created" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("journal_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-journal-templates"] });
      toast({ title: "Template Deleted" });
    },
  });

  const handleOpenDialog = (template?: JournalTemplate) => {
    if (template) {
      setEditing(template);
      setForm(template);
    } else {
      setEditing(null);
      setForm(defaultTemplate);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(defaultTemplate);
    setNewPrompt("");
  };

  const handleAddPrompt = () => {
    if (newPrompt.trim()) {
      setForm({ ...form, prompts: [...(form.prompts || []), newPrompt.trim()] });
      setNewPrompt("");
    }
  };

  const handleRemovePrompt = (index: number) => {
    setForm({ ...form, prompts: (form.prompts || []).filter((_, i) => i !== index) });
  };

  const handleSave = () => {
    if (!form.title?.trim()) return;
    saveMutation.mutate(form);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Journal Templates</h3>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : templates.length === 0 ? (
          <div className="text-muted-foreground">No templates yet</div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="bg-card border border-border rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-accent mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{template.title}</span>
                      <Badge variant="outline">{template.category}</Badge>
                      {!template.is_active && <Badge variant="secondary">Inactive</Badge>}
                      {template.is_premium && <Badge>Premium</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.description}
                    </p>
                    <div className="mt-3 space-y-1">
                      {template.prompts?.slice(0, 3).map((prompt, i) => (
                        <p key={i} className="text-sm text-muted-foreground">
                          • {prompt}
                        </p>
                      ))}
                      {template.prompts?.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{template.prompts.length - 3} more prompts
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(template)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(template.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Template" : "New Template"}</DialogTitle>
            <DialogDescription>Create a journaling template with prompts</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={form.title || ""}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Daily Reflection"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="A template for end-of-day reflection..."
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="gratitude">Gratitude</SelectItem>
                  <SelectItem value="anxiety">Anxiety</SelectItem>
                  <SelectItem value="goals">Goals</SelectItem>
                  <SelectItem value="relationships">Relationships</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Prompts</Label>
              <div className="space-y-2">
                {(form.prompts || []).map((prompt, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={prompt} readOnly className="flex-1" />
                    <Button variant="ghost" size="icon" onClick={() => handleRemovePrompt(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    placeholder="Add a prompt..."
                    onKeyDown={(e) => e.key === "Enter" && handleAddPrompt()}
                  />
                  <Button variant="outline" onClick={handleAddPrompt}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
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
