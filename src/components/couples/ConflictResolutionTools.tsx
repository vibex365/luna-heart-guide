import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, ChevronDown, ChevronUp, Lightbulb, HeartHandshake } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";

interface ConflictTemplate {
  id: string;
  title: string;
  category: string;
  trigger_phrases: string[];
  script_template: string;
  follow_up_questions: string[];
}

const categoryIcons: Record<string, React.ReactNode> = {
  communication: <MessageCircle className="w-4 h-4" />,
  conflict: <HeartHandshake className="w-4 h-4" />,
  intimacy: <Lightbulb className="w-4 h-4" />,
  connection: <Lightbulb className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
  communication: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  conflict: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  intimacy: "bg-pink-500/10 text-pink-600 border-pink-500/30",
  connection: "bg-purple-500/10 text-purple-600 border-purple-500/30",
};

export const ConflictResolutionTools = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["conflict-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conflict_resolution_templates")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (error) throw error;
      return data as ConflictTemplate[];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-primary" />
          Conflict Resolution Scripts
        </CardTitle>
        <CardDescription>Luna-guided exercises for common challenges</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {templates.map((template, index) => (
          <Collapsible
            key={template.id}
            open={expandedId === template.id}
            onOpenChange={(open) => setExpandedId(open ? template.id : null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border border-border rounded-lg overflow-hidden"
            >
              <CollapsibleTrigger asChild>
                <button className="w-full p-3 text-left hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${categoryColors[template.category] || categoryColors.connection}`}>
                        {categoryIcons[template.category] || <Lightbulb className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{template.title}</h4>
                        <Badge 
                          variant="outline" 
                          className={`text-xs mt-1 ${categoryColors[template.category]}`}
                        >
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                    {expandedId === template.id ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="px-3 pb-3 space-y-4">
                  <div className="border-t border-border pt-3">
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">
                      When to use:
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {template.trigger_phrases.map((phrase, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          "{phrase}"
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">
                      Luna's Script:
                    </h5>
                    <p className="text-sm bg-muted/50 p-3 rounded-lg italic">
                      "{template.script_template}"
                    </p>
                  </div>

                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">
                      Follow-up Questions:
                    </h5>
                    <ul className="space-y-1">
                      {template.follow_up_questions.map((question, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {question}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      // Navigate to chat with context
                      window.location.href = `/chat?context=conflict&template=${template.id}`;
                    }}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Discuss with Luna
                  </Button>
                </div>
              </CollapsibleContent>
            </motion.div>
          </Collapsible>
        ))}

        {templates.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            No templates available yet
          </p>
        )}
      </CardContent>
    </Card>
  );
};
