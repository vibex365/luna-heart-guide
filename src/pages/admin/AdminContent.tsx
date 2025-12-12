import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BreathingExercisesCMS } from "@/components/admin/cms/BreathingExercisesCMS";
import { MoodPromptsCMS } from "@/components/admin/cms/MoodPromptsCMS";
import { JournalTemplatesCMS } from "@/components/admin/cms/JournalTemplatesCMS";
import { Wind, Heart, BookOpen, FileText } from "lucide-react";

const AdminContent = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-accent" />
            Content Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage breathing exercises, mood prompts, and journal templates
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="breathing" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="breathing" className="gap-2">
              <Wind className="h-4 w-4" />
              Breathing
            </TabsTrigger>
            <TabsTrigger value="moods" className="gap-2">
              <Heart className="h-4 w-4" />
              Moods
            </TabsTrigger>
            <TabsTrigger value="journals" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Journals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="breathing">
            <BreathingExercisesCMS />
          </TabsContent>

          <TabsContent value="moods">
            <MoodPromptsCMS />
          </TabsContent>

          <TabsContent value="journals">
            <JournalTemplatesCMS />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminContent;
