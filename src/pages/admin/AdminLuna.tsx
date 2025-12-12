import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { LunaSliderControl } from "@/components/admin/LunaSliderControl";
import { LunaModuleToggles } from "@/components/admin/LunaModuleToggles";
import { LunaSafetySettings } from "@/components/admin/LunaSafetySettings";
import { LunaTestChat } from "@/components/admin/LunaTestChat";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Brain, Sliders, Shield, MessageSquare } from "lucide-react";

interface LunaConfig {
  id: string;
  key: string;
  value: Record<string, unknown>;
  description: string;
}

const AdminLuna = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all Luna config
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ["admin-luna-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("luna_config")
        .select("*");

      if (error) throw error;
      return (data as unknown as LunaConfig[]) || [];
    },
  });

  // Update config mutation
  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      const { error } = await supabase
        .from("luna_config")
        .update({ value: value as any })
        .eq("key", key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-luna-config"] });
      toast({
        title: "Settings Updated",
        description: "Luna configuration has been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
      console.error("Update error:", error);
    },
  });

  const getConfig = (key: string) => configs.find((c) => c.key === key);
  
  const updateConfig = (key: string, value: Record<string, unknown>) => {
    updateMutation.mutate({ key, value });
  };

  const toneConfig = getConfig("tone");
  const depthConfig = getConfig("depth");
  const conversationConfig = getConfig("conversation");
  const safetyConfig = getConfig("safety");
  const modulesConfig = getConfig("modules");

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Brain className="h-6 w-6 text-accent" />
            Luna AI Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure Luna's personality, capabilities, and safety features
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Sliders and Conversation */}
          <div className="space-y-6">
            {/* Tone & Depth */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sliders className="h-5 w-5 text-accent" />
                  Response Style
                </CardTitle>
                <CardDescription>
                  Adjust how Luna communicates with users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {toneConfig && (
                  <LunaSliderControl
                    label="Tone Intensity"
                    description="How gentle or direct Luna responds"
                    value={(toneConfig.value as { intensity: number }).intensity}
                    min={0}
                    max={1}
                    step={0.1}
                    leftLabel="Gentle"
                    rightLabel="Direct"
                    onChange={(intensity) =>
                      updateConfig("tone", { ...toneConfig.value, intensity })
                    }
                  />
                )}

                {depthConfig && (
                  <LunaSliderControl
                    label="Analysis Depth"
                    description="How deeply Luna explores emotional topics"
                    value={(depthConfig.value as { level: number }).level}
                    min={0}
                    max={1}
                    step={0.1}
                    leftLabel="Surface"
                    rightLabel="Deep"
                    onChange={(level) =>
                      updateConfig("depth", { ...depthConfig.value, level })
                    }
                  />
                )}
              </CardContent>
            </Card>

            {/* Conversation Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5 text-accent" />
                  Conversation Settings
                </CardTitle>
                <CardDescription>
                  Control conversation length and memory
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {conversationConfig && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="max_length">Max Messages per Conversation</Label>
                      <Input
                        id="max_length"
                        type="number"
                        min={10}
                        max={200}
                        value={(conversationConfig.value as { max_length: number }).max_length}
                        onChange={(e) =>
                          updateConfig("conversation", {
                            ...conversationConfig.value,
                            max_length: parseInt(e.target.value) || 50,
                          })
                        }
                        className="w-32"
                      />
                      <p className="text-sm text-muted-foreground">
                        Maximum messages before suggesting a new conversation
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label htmlFor="memory_window">Memory Window</Label>
                      <Input
                        id="memory_window"
                        type="number"
                        min={5}
                        max={50}
                        value={(conversationConfig.value as { memory_window: number }).memory_window}
                        onChange={(e) =>
                          updateConfig("conversation", {
                            ...conversationConfig.value,
                            memory_window: parseInt(e.target.value) || 20,
                          })
                        }
                        className="w-32"
                      />
                      <p className="text-sm text-muted-foreground">
                        Number of past messages Luna remembers for context
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Safety Settings */}
            {safetyConfig && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Shield className="h-5 w-5 text-accent" />
                    Safety Filters
                  </CardTitle>
                  <CardDescription>
                    Crisis detection and content moderation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LunaSafetySettings
                    settings={safetyConfig.value as Record<string, boolean>}
                    onChange={(settings) => updateConfig("safety", settings)}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Modules and Test */}
          <div className="space-y-6">
            {/* Module Toggles */}
            {modulesConfig && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Conversation Modules</CardTitle>
                  <CardDescription>
                    Enable or disable Luna's specialized capabilities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LunaModuleToggles
                    modules={modulesConfig.value as Record<string, { enabled: boolean; label: string; description: string }>}
                    onChange={(modules) => updateConfig("modules", modules)}
                  />
                </CardContent>
              </Card>
            )}

            {/* Test Chat */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test Luna Response</CardTitle>
                <CardDescription>
                  Preview how Luna responds with current settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LunaTestChat />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminLuna;
