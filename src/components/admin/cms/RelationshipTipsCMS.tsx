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
import { Plus, Edit, Trash2, Lightbulb, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface RelationshipTip {
  id: string;
  title: string;
  content: string;
  category: string;
  author: string | null;
  is_active: boolean;
  sort_order: number;
}

export const RelationshipTipsCMS = () => {
  const queryClient = useQueryClient();
  const [editingTip, setEditingTip] = useState<RelationshipTip | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTip, setNewTip] = useState({
    title: "",
    content: "",
    category: "general",
    author: "",
  });

  const { data: tips = [], isLoading } = useQuery({
    queryKey: ["admin-relationship-tips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("relationship_tips")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as RelationshipTip[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (tip: typeof newTip) => {
      const { error } = await supabase.from("relationship_tips").insert({
        ...tip,
        author: tip.author || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-relationship-tips"] });
      toast.success("Tip added!");
      setIsAddDialogOpen(false);
      setNewTip({ title: "", content: "", category: "general", author: "" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async (tip: RelationshipTip) => {
      const { error } = await supabase
        .from("relationship_tips")
        .update({
          title: tip.title,
          content: tip.content,
          category: tip.category,
          author: tip.author,
          is_active: tip.is_active,
          sort_order: tip.sort_order,
        })
        .eq("id", tip.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-relationship-tips"] });
      toast.success("Tip updated!");
      setEditingTip(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("relationship_tips").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-relationship-tips"] });
      toast.success("Tip deleted!");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const categories = ["general", "communication", "positivity", "connection", "intimacy", "quality-time", "conflict", "appreciation"];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Expert Tips ({tips.length})
        </CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add Tip
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Expert Tip</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={newTip.title}
                  onChange={(e) => setNewTip({ ...newTip, title: e.target.value })}
                  placeholder="Tip title..."
                />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea
                  value={newTip.content}
                  onChange={(e) => setNewTip({ ...newTip, content: e.target.value })}
                  placeholder="Tip content..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select
                    value={newTip.category}
                    onValueChange={(v) => setNewTip({ ...newTip, category: v })}
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
                  <Label>Author (optional)</Label>
                  <Input
                    value={newTip.author}
                    onChange={(e) => setNewTip({ ...newTip, author: e.target.value })}
                    placeholder="Dr. John Gottman"
                  />
                </div>
              </div>
              <Button onClick={() => addMutation.mutate(newTip)} className="w-full">
                Add Tip
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
            {tips.map((tip) => (
              <div
                key={tip.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{tip.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{tip.content}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-600">
                      {tip.category}
                    </span>
                    {tip.author && (
                      <span className="text-xs text-muted-foreground">by {tip.author}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={tip.is_active}
                    onCheckedChange={(checked) =>
                      updateMutation.mutate({ ...tip, is_active: checked })
                    }
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => deleteMutation.mutate(tip.id)}
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
