import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PhoneInput, CountryCode } from "@/components/ui/phone-input";
import { toast } from "sonner";
import { 
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Heart,
  User,
  Settings,
  Send,
  TestTube
} from "lucide-react";

interface AffirmationTemplate {
  id: string;
  message: string;
  category: string;
  account_type: string;
  is_active: boolean;
  created_at: string;
}

export const DailyAffirmationsManager = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<AffirmationTemplate | null>(null);
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("motivation");
  const [accountType, setAccountType] = useState("personal");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);

  // Fetch affirmation templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["daily-affirmation-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_affirmation_templates")
        .select("*")
        .order("account_type", { ascending: true })
        .order("category", { ascending: true });
      
      if (error) throw error;
      return data as AffirmationTemplate[];
    },
  });

  // Fetch daily affirmation settings
  const { data: settings } = useQuery({
    queryKey: ["daily-affirmation-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("luna_config")
        .select("value")
        .eq("key", "daily_affirmations_settings")
        .maybeSingle();
      
      if (error) throw error;
      return data?.value as { enabled: boolean; send_time: string } || { enabled: true, send_time: "09:00" };
    },
  });

  // Save template mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingTemplate) {
        const { error } = await supabase
          .from("daily_affirmation_templates")
          .update({
            message: message.trim(),
            category,
            account_type: accountType,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("daily_affirmation_templates")
          .insert({
            message: message.trim(),
            category,
            account_type: accountType,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-affirmation-templates"] });
      resetForm();
      toast.success(editingTemplate ? "Template updated" : "Template added");
    },
    onError: () => {
      toast.error("Failed to save template");
    },
  });

  // Toggle active mutation
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("daily_affirmation_templates")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-affirmation-templates"] });
    },
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("daily_affirmation_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-affirmation-templates"] });
      toast.success("Template deleted");
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: { enabled: boolean; send_time: string }) => {
      const { data: existing } = await supabase
        .from("luna_config")
        .select("id")
        .eq("key", "daily_affirmations_settings")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("luna_config")
          .update({ value: newSettings as any })
          .eq("key", "daily_affirmations_settings");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("luna_config")
          .insert({
            key: "daily_affirmations_settings",
            value: newSettings as any,
            description: "Daily affirmation SMS settings",
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-affirmation-settings"] });
      toast.success("Settings updated");
    },
  });

  const resetForm = () => {
    setMessage("");
    setCategory("motivation");
    setAccountType("personal");
    setEditingTemplate(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (template: AffirmationTemplate) => {
    setEditingTemplate(template);
    setMessage(template.message);
    setCategory(template.category);
    setAccountType(template.account_type);
    setIsDialogOpen(true);
  };

  const personalTemplates = templates.filter(t => t.account_type === "personal");
  const couplesTemplates = templates.filter(t => t.account_type === "couples");

  const categories = ["motivation", "strength", "self-love", "support", "progress", "appreciation", "connection", "gratitude", "communication", "journey"];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-accent" />
          <div>
            <h2 className="text-lg md:text-xl font-bold">Daily Affirmations</h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              Uplifting messages sent daily to brighten users' days
            </p>
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden md:inline">Add Template</span>
              <span className="md:hidden">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-4">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Edit Template" : "Add New Template"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter uplifting message..."
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">{message.length}/160 characters</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <Select value={accountType} onValueChange={setAccountType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="couples">Couples</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                onClick={() => saveMutation.mutate()} 
                disabled={saveMutation.isPending || !message.trim()}
                className="w-full"
              >
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingTemplate ? "Update Template" : "Add Template"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Test Affirmation Card */}
      <Card className="border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <TestTube className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
            Test Daily Affirmation
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Send a test affirmation to verify the system works
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              This will send a random affirmation to a specific phone number to test the SMS system before enabling for all users.
            </p>
          </div>
          
          <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto border-blue-500/30 hover:bg-blue-500/10">
                <Send className="h-4 w-4 mr-2 text-blue-500" />
                Send Test Affirmation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm mx-4">
              <DialogHeader>
                <DialogTitle>Send Test Affirmation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <PhoneInput
                    value={testPhoneNumber}
                    onChange={(fullNumber) => setTestPhoneNumber(fullNumber)}
                    defaultCountryCode="+1"
                  />
                  <p className="text-xs text-muted-foreground">Select country and enter number (digits only)</p>
                </div>
                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <Select value={accountType} onValueChange={setAccountType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="couples">Couples</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={async () => {
                    if (!testPhoneNumber.trim()) {
                      toast.error("Please enter a phone number");
                      return;
                    }
                    
                    setIsSendingTest(true);
                    try {
                      // Get a random template of the selected type
                      const templateList = accountType === "couples" ? couplesTemplates : personalTemplates;
                      if (templateList.length === 0) {
                        toast.error(`No ${accountType} templates available`);
                        return;
                      }
                      
                      const randomTemplate = templateList[Math.floor(Math.random() * templateList.length)];
                      const testMessage = `💜 Luna: ${randomTemplate.message}\n\n(This is a test message)`;
                      
                      const { data, error } = await supabase.functions.invoke("send-sms", {
                        body: {
                          action: "send-direct",
                          phoneNumber: testPhoneNumber.trim(),
                          message: testMessage,
                        },
                      });
                      
                      if (error || data?.error) {
                        throw new Error(error?.message || data?.error);
                      }
                      
                      toast.success("Test affirmation sent successfully!");
                      setIsTestDialogOpen(false);
                      setTestPhoneNumber("");
                    } catch (err: any) {
                      toast.error(err.message || "Failed to send test");
                    } finally {
                      setIsSendingTest(false);
                    }
                  }}
                  disabled={isSendingTest || !testPhoneNumber.trim()}
                  className="w-full"
                >
                  {isSendingTest ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Test
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Settings Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Settings className="h-4 w-4 md:h-5 md:w-5" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <Label>Enable Daily Affirmations</Label>
              <p className="text-xs text-muted-foreground">Send uplifting messages to users daily</p>
            </div>
            <Switch
              checked={settings?.enabled ?? true}
              onCheckedChange={(enabled) => 
                updateSettingsMutation.mutate({ ...settings, enabled, send_time: settings?.send_time || "09:00" })
              }
            />
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <Label>Send Time (UTC)</Label>
              <p className="text-xs text-muted-foreground">Time to send daily messages</p>
            </div>
            <Input
              type="time"
              value={settings?.send_time || "09:00"}
              onChange={(e) => 
                updateSettingsMutation.mutate({ ...settings, enabled: settings?.enabled ?? true, send_time: e.target.value })
              }
              className="w-full md:w-32"
            />
          </div>
        </CardContent>
      </Card>

      {/* Personal Templates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <User className="h-4 w-4 md:h-5 md:w-5" />
            Personal Account Messages
            <Badge variant="secondary" className="text-xs">{personalTemplates.length}</Badge>
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">Messages for individual users</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : personalTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No personal templates yet</p>
          ) : (
            <div className="space-y-3">
              {personalTemplates.map((template) => (
                <div 
                  key={template.id} 
                  className="flex flex-col md:flex-row md:items-start justify-between p-3 bg-muted/50 rounded-lg gap-3"
                >
                  <div className="flex-1 space-y-2 min-w-0">
                    <p className="text-sm">{template.message}</p>
                    <Badge variant="outline" className="capitalize text-xs">{template.category}</Badge>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={template.is_active}
                      onCheckedChange={(isActive) => toggleMutation.mutate({ id: template.id, isActive })}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteMutation.mutate(template.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Couples Templates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Heart className="h-4 w-4 md:h-5 md:w-5 text-pink-500" />
            Couples Account Messages
            <Badge variant="secondary" className="text-xs">{couplesTemplates.length}</Badge>
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">Messages for couples subscribers</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : couplesTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No couples templates yet</p>
          ) : (
            <div className="space-y-3">
              {couplesTemplates.map((template) => (
                <div 
                  key={template.id} 
                  className="flex flex-col md:flex-row md:items-start justify-between p-3 bg-muted/50 rounded-lg gap-3"
                >
                  <div className="flex-1 space-y-2 min-w-0">
                    <p className="text-sm">{template.message}</p>
                    <Badge variant="outline" className="capitalize text-xs">{template.category}</Badge>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={template.is_active}
                      onCheckedChange={(isActive) => toggleMutation.mutate({ id: template.id, isActive })}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteMutation.mutate(template.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
