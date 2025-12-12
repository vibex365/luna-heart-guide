import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Camera, User, Save, Heart, Users, Sparkles, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LunaAvatar from "@/components/LunaAvatar";
import ConversationAnalytics from "@/components/ConversationAnalytics";
import WeeklyInsights from "@/components/WeeklyInsights";
import StreakDisplay from "@/components/StreakDisplay";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  weekly_insights_enabled: boolean | null;
}

interface UserPreferences {
  relationship_reason: string | null;
  relationship_status: string | null;
  desired_outcome: string | null;
  communication_style: string | null;
}

const reasonOptions = [
  { value: "hurt", label: "I'm feeling hurt or confused" },
  { value: "communicate", label: "I want to communicate better" },
  { value: "understand", label: "I need to understand my partner" },
  { value: "heal", label: "I'm healing from something painful" },
  { value: "explore", label: "Just exploring my feelings" },
];

const statusOptions = [
  { value: "relationship", label: "In a relationship" },
  { value: "separated", label: "Recently separated" },
  { value: "dating", label: "Dating / Getting to know someone" },
  { value: "single", label: "Single and reflecting" },
  { value: "unsure", label: "It's complicated" },
];

const outcomeOptions = [
  { value: "clarity", label: "I want clarity on my feelings" },
  { value: "peace", label: "I want to feel at peace" },
  { value: "script", label: "I need help saying something" },
  { value: "understand", label: "I want to understand patterns" },
  { value: "support", label: "I just need emotional support" },
];

const communicationOptions = [
  { value: "direct", label: "Direct and honest" },
  { value: "gentle", label: "Gentle and supportive" },
  { value: "slow", label: "I like to process slowly" },
  { value: "validation", label: "I need validation first" },
  { value: "actionable", label: "Give me actionable steps" },
];

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [weeklyInsightsEnabled, setWeeklyInsightsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Preferences state
  const [preferences, setPreferences] = useState<UserPreferences>({
    relationship_reason: null,
    relationship_status: null,
    desired_outcome: null,
    communication_style: null,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      loadProfile();
      loadPreferences();
    }
  }, [user, authLoading, navigate]);

  const loadProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error loading profile:", error);
      toast({
        title: "Error",
        description: "Could not load your profile.",
        variant: "destructive",
      });
    } else if (data) {
      setProfile(data);
      setDisplayName(data.display_name || "");
      setAvatarUrl(data.avatar_url);
      setWeeklyInsightsEnabled(data.weekly_insights_enabled ?? true);
    }

    setLoading(false);
  };

  const loadPreferences = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data) {
      setPreferences({
        relationship_reason: data.relationship_reason,
        relationship_status: data.relationship_status,
        desired_outcome: data.desired_outcome,
        communication_style: data.communication_style,
      });
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 2MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const newAvatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(newAvatarUrl);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: newAvatarUrl })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      toast({
        title: "Avatar updated! 💜",
        description: "Your new photo looks great.",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Upload failed",
        description: "Could not upload your avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      // Save profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() || null })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Save preferences
      const { error: prefError } = await supabase
        .from("user_preferences")
        .upsert({
          user_id: user.id,
          ...preferences,
        }, { onConflict: "user_id" });

      if (prefError) throw prefError;

      toast({
        title: "Profile saved! 💜",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({
        title: "Save failed",
        description: "Could not save your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const PreferenceSelect = ({ 
    label, 
    icon: Icon, 
    value, 
    options, 
    onChange 
  }: { 
    label: string; 
    icon: React.ElementType; 
    value: string | null; 
    options: { value: string; label: string }[]; 
    onChange: (val: string) => void;
  }) => (
    <div className="space-y-2">
      <Label className="text-foreground flex items-center gap-2">
        <Icon className="w-4 h-4 text-accent" />
        {label}
      </Label>
      <div className="grid grid-cols-1 gap-2">
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`p-3 rounded-xl border text-left text-sm transition-all ${
              value === option.value
                ? "bg-secondary border-accent"
                : "bg-background border-border hover:border-accent/50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );

  if (authLoading || loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <LunaAvatar size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/chat")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <LunaAvatar size="sm" showGlow={false} />
            <span className="font-heading font-bold text-xl text-foreground">LUNA</span>
          </div>
        </div>
      </header>

      {/* Profile Form */}
      <main className="container mx-auto px-6 py-8 pb-20">
        <motion.div
          className="max-w-md mx-auto space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Profile Section */}
          <div className="bg-card rounded-3xl p-8 shadow-luna border border-border">
            <h1 className="font-heading text-2xl font-bold text-foreground text-center mb-2">
              Your Profile
            </h1>
            <p className="text-muted-foreground text-center mb-8">
              Personalize your Luna experience
            </p>

            {/* Avatar */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <button
                  onClick={handleAvatarClick}
                  disabled={uploading}
                  className="relative w-24 h-24 rounded-full overflow-hidden bg-secondary border-4 border-border hover:border-accent transition-colors group"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-background" />
                  </div>
                </button>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-full">
                    <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-foreground">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="How should Luna call you?"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-12 rounded-xl border-border bg-background"
                  maxLength={50}
                />
                <p className="text-xs text-muted-foreground">
                  This is how Luna will address you in conversations
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground">Email</Label>
                <Input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="h-12 rounded-xl border-border bg-muted text-muted-foreground cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-card rounded-3xl p-8 shadow-luna border border-border">
            <h2 className="font-heading text-xl font-bold text-foreground text-center mb-2">
              Luna Preferences
            </h2>
            <p className="text-muted-foreground text-center mb-6 text-sm">
              Help Luna understand you better
            </p>

            <div className="space-y-6">
              <PreferenceSelect
                label="What brings you here?"
                icon={Heart}
                value={preferences.relationship_reason}
                options={reasonOptions}
                onChange={(val) => setPreferences({ ...preferences, relationship_reason: val })}
              />

              <PreferenceSelect
                label="Current situation"
                icon={Users}
                value={preferences.relationship_status}
                options={statusOptions}
                onChange={(val) => setPreferences({ ...preferences, relationship_status: val })}
              />

              <PreferenceSelect
                label="What you're seeking"
                icon={Sparkles}
                value={preferences.desired_outcome}
                options={outcomeOptions}
                onChange={(val) => setPreferences({ ...preferences, desired_outcome: val })}
              />

              <PreferenceSelect
                label="Communication style"
                icon={MessageCircle}
                value={preferences.communication_style}
                options={communicationOptions}
                onChange={(val) => setPreferences({ ...preferences, communication_style: val })}
              />
            </div>
          </div>

          {/* Streak Section */}
          <div className="bg-card rounded-3xl p-8 shadow-luna border border-border">
            <StreakDisplay />
          </div>

          {/* Weekly Insights Section */}
          <div className="bg-card rounded-3xl p-8 shadow-luna border border-border">
            <WeeklyInsights 
              weeklyInsightsEnabled={weeklyInsightsEnabled}
              onUpdate={(enabled) => setWeeklyInsightsEnabled(enabled)}
            />
          </div>

          {/* Analytics Section */}
          <div className="bg-card rounded-3xl p-8 shadow-luna border border-border">
            <ConversationAnalytics />
          </div>

          <Button
            variant="peach"
            size="lg"
            className="w-full"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Your data is private and secure. 💜
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default ProfileSettings;
