import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const LunaTestChat = () => {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTest = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    setResponse("");

    try {
      const { data, error } = await supabase.functions.invoke("luna-chat", {
        body: {
          message: input,
          isTest: true,
        },
      });

      if (error) throw error;

      setResponse(data?.response || "No response received");
    } catch (error) {
      console.error("Test error:", error);
      setResponse("Error: Unable to get response. Make sure the Luna chat function is deployed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          placeholder="Type a test message to see how Luna responds..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <Button
          onClick={handleTest}
          disabled={!input.trim() || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Test Response
            </>
          )}
        </Button>
      </div>

      {response && (
        <div className="p-4 rounded-lg bg-luna-bubble border border-border">
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Luna's Response:
          </p>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {response}
          </p>
        </div>
      )}
    </div>
  );
};
