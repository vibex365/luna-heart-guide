import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, User, Save, Heart, Users, Sparkles, MessageCircle, LogOut, Crown, Link2, UserPlus, Download, Lock, Unlink, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import LunaAvatar from "@/components/LunaAvatar";
import ConversationAnalytics from "@/components/ConversationAnalytics";
import WeeklyInsights from "@/components/WeeklyInsights";
import StreakDisplay from "@/components/StreakDisplay";
import ReminderSettings from "@/components/ReminderSettings";
import MobileOnlyLayout from "@/components/MobileOnlyLayout";
import { ProfileSkeleton } from "@/components/skeletons/PageSkeletons";
import { PhoneSettingsCard } from "@/components/PhoneSettingsCard";
import { SmsNotificationPreferences } from "@/components/SmsNotificationPreferences";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useCouplesAccount } from "@/hooks/useCouplesAccount";
import { usePartnerNotifications } from "@/hooks/usePartnerNotifications";
import { WeeklyRelationshipSummary } from "@/components/couples/WeeklyRelationshipSummary";
import { format } from "date-fns";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  weekly_insights_enabled: boolean | null;
  phone_number: string | null;
  phone_verified: boolean | null;
  gender: string | null;
  sexual_orientation: string | null;
}

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "non-binary", label: "Non-binary" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

const orientationOptions = [
  { value: "straight", label: "Straight" },
  { value: "gay", label: "Gay" },
  { value: "lesbian", label: "Lesbian" },
  { value: "bisexual", label: "Bisexual" },
  { value: "pansexual", label: "Pansexual" },
  { value: "asexual", label: "Asexual" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

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

// Couples Section Component
const CouplesSection = ({ userId, navigate }: { userId?: string; navigate: (path: string) => void }) => {
  // Couples account status
  const { isLinked, partnerId, partnerLink, unlinkPartner } = useCouplesAccount();

  // Check subscription
  const { data: subscription } = useQuery({
    queryKey: ["couples-subscription", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data } = await supabase
        .from("user_subscriptions")
        .select(`
          tier_id,
          subscription_tiers!inner(slug, name)
        `)
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle();

      return data;
    },
    enabled: !!userId,
  });

  // Fetch partner's profile
  const { data: partnerProfile } = useQuery({
    queryKey: ["partner-profile-detail", partnerId],
    queryFn: async () => {
      if (!partnerId) return null;
      
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", partnerId)
        .maybeSingle();

      return data;
    },
    enabled: !!partnerId,
  });

  // Fetch own profile for avatar
  const { data: ownProfile } = useQuery({
    queryKey: ["own-profile-detail", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", userId)
        .maybeSingle();

      return data;
    },
    enabled: !!userId,
  });

  const hasCouplesSubscription = subscription?.subscription_tiers?.slug === "couples";
  const linkedDate = partnerLink?.accepted_at 
    ? format(new Date(partnerLink.accepted_at), "MMM d, yyyy")
    : partnerLink?.created_at 
      ? format(new Date(partnerLink.created_at), "MMM d, yyyy")
      : null;

  return (
    <div className="bg-gradient-to-br from-pink-500/5 to-purple-500/5 rounded-3xl p-6 shadow-luna border border-pink-500/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-pink-500/10">
          <Heart className="w-5 h-5 text-pink-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground">Couples</h3>
          <p className="text-sm text-muted-foreground">
            {hasCouplesSubscription 
              ? isLinked 
                ? "Connected with your partner"
                : "Link your partner's account"
              : "Share your journey together"
            }
          </p>
        </div>
      </div>

      {hasCouplesSubscription ? (
        <div className="space-y-3">
          {isLinked ? (
            <>
              {/* Linked Partner Display */}
              <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                <div className="flex items-center gap-3">
                  {/* Linked Avatars */}
                  <div className="relative">
                    <div className="flex -space-x-2">
                      <Avatar className="w-10 h-10 border-2 border-background">
                        {ownProfile?.avatar_url ? (
                          <AvatarImage src={ownProfile.avatar_url} alt="You" />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {ownProfile?.display_name?.[0]?.toUpperCase() || "Y"}
                        </AvatarFallback>
                      </Avatar>
                      <Avatar className="w-10 h-10 border-2 border-background">
                        {partnerProfile?.avatar_url ? (
                          <AvatarImage src={partnerProfile.avatar_url} alt="Partner" />
                        ) : null}
                        <AvatarFallback className="bg-pink-500/10 text-pink-500 text-sm">
                          {partnerProfile?.display_name?.[0]?.toUpperCase() || "P"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2"
                    >
                      <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
                    </motion.div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {partnerProfile?.display_name || "Your Partner"}
                      </span>
                    </div>
                    {linkedDate && (
                      <p className="text-xs text-muted-foreground">
                        Since {linkedDate}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Unlink */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 h-8 w-8">
                      <Unlink className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Unlink Partner Account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will disconnect your accounts. You'll lose access to shared mood entries, 
                        relationship health scores, and couples activities. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => unlinkPartner()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Unlink
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <Button 
                variant="outline" 
                className="w-full border-pink-500/30 hover:bg-pink-500/10"
                onClick={() => navigate("/couples")}
              >
                <Heart className="w-4 h-4 mr-2 text-pink-500" />
                View Couples Dashboard
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
                <UserPlus className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-600 dark:text-yellow-400">
                  No partner linked yet
                </span>
              </div>
              <Button 
                variant="outline" 
                className="w-full border-pink-500/30 hover:bg-pink-500/10"
                onClick={() => navigate("/couples")}
              >
                <Heart className="w-4 h-4 mr-2 text-pink-500" />
                Link Partner
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Upgrade to Couples plan to unlock shared mood tracking, relationship health scores, and couples activities.
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="flex-1"
              onClick={() => navigate("/couples")}
            >
              Learn More
            </Button>
            <Button 
              size="sm"
              className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:opacity-90"
              onClick={() => navigate("/subscription")}
            >
              Upgrade
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { hasFeature, isPro } = useSubscription();
  const hasDataExport = hasFeature("data_export") || isPro;
  const [exportingData, setExportingData] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [sexualOrientation, setSexualOrientation] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [weeklyInsightsEnabled, setWeeklyInsightsEnabled] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("09:00");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Enable real-time partner notifications
  usePartnerNotifications();
  
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
      setGender(data.gender || null);
      setSexualOrientation(data.sexual_orientation || null);
      setAvatarUrl(data.avatar_url);
      setPhoneNumber(data.phone_number);
      setPhoneVerified(data.phone_verified ?? false);
      setWeeklyInsightsEnabled(data.weekly_insights_enabled ?? true);
      setReminderEnabled(data.reminder_enabled ?? false);
      setReminderTime(data.reminder_time ?? "09:00");
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
        .update({ 
          display_name: displayName.trim() || null,
          gender: gender,
          sexual_orientation: sexualOrientation
        })
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

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleExportData = async () => {
    if (!user || !hasDataExport) {
      toast({
        title: "Upgrade Required",
        description: "Data export is a Pro feature. Upgrade to export your data.",
        variant: "destructive",
      });
      return;
    }

    setExportingData(true);
    try {
      // Fetch all user data
      const [moodEntries, journalEntries, conversations] = await Promise.all([
        supabase.from("mood_entries").select("*").eq("user_id", user.id),
        supabase.from("journal_entries").select("*").eq("user_id", user.id),
        supabase.from("conversations").select("*, messages(*)").eq("user_id", user.id),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        userData: {
          email: user.email,
          displayName: displayName,
        },
        moodEntries: moodEntries.data || [],
        journalEntries: journalEntries.data || [],
        conversations: conversations.data || [],
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `luna-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data Exported! 💜",
        description: "Your data has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Export Failed",
        description: "Could not export your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExportingData(false);
    }
  };

  if (authLoading || loading) {
    return (
      <MobileOnlyLayout>
        <ProfileSkeleton />
      </MobileOnlyLayout>
    );
  }

  return (
    <MobileOnlyLayout>
      <div className="h-full flex flex-col bg-background overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <LunaAvatar size="sm" showGlow={false} />
              <span className="font-heading font-bold text-xl text-foreground">Profile</span>
            </div>
          </div>
        </header>

        {/* Profile Form */}
        <main className="container mx-auto px-4 py-6 pb-8">
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

              {/* Gender Select */}
              <div className="space-y-2">
                <Label className="text-foreground flex items-center gap-2">
                  <UserCircle2 className="w-4 h-4 text-accent" />
                  Gender
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {genderOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setGender(option.value)}
                      className={`p-3 rounded-xl border text-center text-sm transition-all ${
                        gender === option.value
                          ? "bg-secondary border-accent"
                          : "bg-background border-border hover:border-accent/50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Helps Luna personalize communication insights
                </p>
              </div>

              {/* Sexual Orientation Select */}
              <div className="space-y-2">
                <Label className="text-foreground flex items-center gap-2">
                  <Heart className="w-4 h-4 text-accent" />
                  Sexual Orientation
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {orientationOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSexualOrientation(option.value)}
                      className={`p-3 rounded-xl border text-center text-sm transition-all ${
                        sexualOrientation === option.value
                          ? "bg-secondary border-accent"
                          : "bg-background border-border hover:border-accent/50"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Helps personalize relationship advice
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

          {/* Phone Number Section */}
          {user && (
            <PhoneSettingsCard
              userId={user.id}
              phoneNumber={phoneNumber}
              phoneVerified={phoneVerified}
              onPhoneUpdated={(phone) => {
                setPhoneNumber(phone);
                setPhoneVerified(true);
              }}
            />
          )}

          {/* SMS Notification Preferences */}
          {user && (
            <SmsNotificationPreferences
              userId={user.id}
              phoneVerified={phoneVerified}
            />
          )}

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

          {/* Reminder Settings Section */}
          <div className="bg-card rounded-3xl p-8 shadow-luna border border-border">
            <ReminderSettings 
              reminderEnabled={reminderEnabled}
              reminderTime={reminderTime}
              onUpdate={(enabled, time) => {
                setReminderEnabled(enabled);
                setReminderTime(time);
              }}
            />
          </div>

          {/* Analytics Section */}
          <div className="bg-card rounded-3xl p-8 shadow-luna border border-border">
            <ConversationAnalytics />
          </div>

          {/* Couples Section */}
          <CouplesSection userId={user?.id} navigate={navigate} />

          {/* Weekly Relationship Summary (only if linked) */}
          <WeeklyRelationshipSummary />

          {/* Data Export Section */}
          <div className="bg-card rounded-3xl p-6 shadow-luna border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-accent/10">
                  {hasDataExport ? (
                    <Download className="w-5 h-5 text-accent" />
                  ) : (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Export Your Data</h3>
                  <p className="text-sm text-muted-foreground">
                    {hasDataExport ? "Download all your Luna data" : "Pro feature"}
                  </p>
                </div>
              </div>
              {hasDataExport ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleExportData}
                  disabled={exportingData}
                >
                  {exportingData ? "Exporting..." : "Export"}
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate("/subscription")}
                >
                  Upgrade
                </Button>
              )}
            </div>
          </div>

          {/* Subscription Section */}
          <div className="bg-card rounded-3xl p-6 shadow-luna border border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <Crown className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Subscription</h3>
                  <p className="text-sm text-muted-foreground">Manage your plan</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/subscription")}>
                View Plans
              </Button>
            </div>
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

          <Button
            variant="ghost"
            size="lg"
            className="w-full text-muted-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Your data is private and secure. 💜
          </p>
        </motion.div>
      </main>
      </div>
    </MobileOnlyLayout>
  );
};

export default ProfileSettings;
