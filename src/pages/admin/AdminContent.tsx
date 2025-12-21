import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BreathingExercisesCMS } from "@/components/admin/cms/BreathingExercisesCMS";
import { MoodPromptsCMS } from "@/components/admin/cms/MoodPromptsCMS";
import { JournalTemplatesCMS } from "@/components/admin/cms/JournalTemplatesCMS";
import { CouplesGameCMS } from "@/components/admin/cms/CouplesGameCMS";
import { DailyQuestionsCMS } from "@/components/admin/cms/DailyQuestionsCMS";
import { RelationshipTipsCMS } from "@/components/admin/cms/RelationshipTipsCMS";
import { CoinAnalytics } from "@/components/admin/cms/CoinAnalytics";
import { Wind, Heart, BookOpen, FileText, Gamepad2, MessageCircleQuestion, Lightbulb, Coins } from "lucide-react";

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
            Manage content, daily questions, tips, and virtual currency
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="questions" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-7">
            <TabsTrigger value="questions" className="gap-1 text-xs">
              <MessageCircleQuestion className="h-4 w-4" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="tips" className="gap-1 text-xs">
              <Lightbulb className="h-4 w-4" />
              Tips
            </TabsTrigger>
            <TabsTrigger value="coins" className="gap-1 text-xs">
              <Coins className="h-4 w-4" />
              Coins
            </TabsTrigger>
            <TabsTrigger value="breathing" className="gap-1 text-xs">
              <Wind className="h-4 w-4" />
              Breathing
            </TabsTrigger>
            <TabsTrigger value="moods" className="gap-1 text-xs">
              <Heart className="h-4 w-4" />
              Moods
            </TabsTrigger>
            <TabsTrigger value="journals" className="gap-1 text-xs">
              <BookOpen className="h-4 w-4" />
              Journals
            </TabsTrigger>
            <TabsTrigger value="couples" className="gap-1 text-xs">
              <Gamepad2 className="h-4 w-4" />
              Games
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questions">
            <DailyQuestionsCMS />
          </TabsContent>

          <TabsContent value="tips">
            <RelationshipTipsCMS />
          </TabsContent>

          <TabsContent value="coins">
            <CoinAnalytics />
          </TabsContent>

          <TabsContent value="breathing">
            <BreathingExercisesCMS />
          </TabsContent>

          <TabsContent value="moods">
            <MoodPromptsCMS />
          </TabsContent>

          <TabsContent value="journals">
            <JournalTemplatesCMS />
          </TabsContent>

          <TabsContent value="couples">
            <CouplesGameCMS />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminContent;
