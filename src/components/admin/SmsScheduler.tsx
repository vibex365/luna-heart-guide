import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Calendar,
  Clock,
  Send,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";

interface ScheduledSms {
  id: string;
  phone_number: string;
  message: string;
  scheduled_at: string;
  sent_at: string | null;
  status: string;
  recipient_type: string;
  error_message: string | null;
  created_at: string;
}

export const SmsScheduler = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [message, setMessage] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [recipientType, setRecipientType] = useState<"all" | "couples" | "personal">("all");

  // Fetch scheduled messages
  const { data: scheduledMessages = [], isLoading } = useQuery({
    queryKey: ["scheduled-sms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scheduled_sms")
        .select("*")
        .order("scheduled_at", { ascending: true });
      
      if (error) throw error;
      return data as ScheduledSms[];
    },
  });

  // Fetch templates for quick insert
  const { data: templates = [] } = useQuery({
    queryKey: ["sms-templates-for-scheduler"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sms_templates")
        .select("id, name, message")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  // Schedule SMS mutation
  const scheduleMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!message.trim()) throw new Error("Message is required");
      if (!scheduledDate || !scheduledTime) throw new Error("Schedule date and time are required");

      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

      // For "all" type, we'll create one entry that will be processed by the cron job
      const { error } = await supabase
        .from("scheduled_sms")
        .insert({
          phone_number: recipientType, // Store the type here for the cron to process
          message: message.trim(),
          scheduled_at: scheduledAt,
          recipient_type: recipientType,
          created_by: user.id,
          status: "pending",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-sms"] });
      setMessage("");
      setScheduledDate("");
      setScheduledTime("");
      toast.success("SMS scheduled successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Cancel scheduled SMS mutation
  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("scheduled_sms")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-sms"] });
      toast.success("Scheduled SMS cancelled");
    },
    onError: () => {
      toast.error("Failed to cancel scheduled SMS");
    },
  });

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setMessage(template.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="gap-1 text-xs"><Clock className="h-3 w-3" /> Pending</Badge>;
      case "sent":
        return <Badge variant="default" className="gap-1 bg-green-500 text-xs"><CheckCircle className="h-3 w-3" /> Sent</Badge>;
      case "failed":
        return <Badge variant="destructive" className="gap-1 text-xs"><XCircle className="h-3 w-3" /> Failed</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };

  const pendingMessages = scheduledMessages.filter(m => m.status === "pending");
  const sentMessages = scheduledMessages.filter(m => m.status !== "pending");

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="h-6 w-6 md:h-8 md:w-8 text-accent" />
        <div>
          <h2 className="text-lg md:text-xl font-bold">SMS Scheduler</h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            Schedule messages to be sent at a specific date and time
          </p>
        </div>
      </div>

      {/* Schedule New SMS */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base md:text-lg">Schedule New Message</CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Set up a message to be sent to users at a specific time
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label className="text-sm">Use Template (optional)</Label>
            <Select onValueChange={handleTemplateSelect}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id} className="text-sm">
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <Label className="text-sm">Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              rows={3}
              className="text-sm resize-none"
            />
            <p className="text-xs text-muted-foreground">{message.length}/160 characters</p>
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <Label className="text-sm">Recipients</Label>
            <Select value={recipientType} onValueChange={(v: "all" | "couples" | "personal") => setRecipientType(v)}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-sm">All users with verified phone</SelectItem>
                <SelectItem value="couples" className="text-sm">Couples subscribers only</SelectItem>
                <SelectItem value="personal" className="text-sm">Personal/Free users only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Date</Label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Time</Label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          <Button 
            onClick={() => scheduleMutation.mutate()} 
            disabled={scheduleMutation.isPending || !message.trim() || !scheduledDate || !scheduledTime}
            className="w-full md:w-auto"
          >
            {scheduleMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Calendar className="h-4 w-4 mr-2" />
            )}
            Schedule SMS
          </Button>
        </CardContent>
      </Card>

      {/* Pending Messages */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Clock className="h-4 w-4 md:h-5 md:w-5" />
            Pending Messages
            <Badge variant="secondary" className="text-xs">{pendingMessages.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : pendingMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No scheduled messages
            </p>
          ) : (
            <div className="space-y-3">
              {pendingMessages.map((sms) => (
                <div 
                  key={sms.id} 
                  className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 bg-muted/50 rounded-lg gap-3"
                >
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-sm font-medium truncate">{sms.message}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="capitalize text-xs">{sms.recipient_type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(sms.scheduled_at), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => cancelMutation.mutate(sms.id)}
                    disabled={cancelMutation.isPending}
                    className="text-destructive hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="ml-2 md:hidden">Cancel</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sent Messages History */}
      {sentMessages.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">Recent Sent Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sentMessages.slice(0, 5).map((sms) => (
                <div 
                  key={sms.id} 
                  className="flex flex-col md:flex-row md:items-center justify-between p-3 md:p-4 bg-muted/30 rounded-lg gap-2"
                >
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="text-sm truncate">{sms.message}</p>
                    <span className="text-xs text-muted-foreground">
                      Sent: {sms.sent_at ? format(new Date(sms.sent_at), "MMM d, yyyy 'at' h:mm a") : "N/A"}
                    </span>
                  </div>
                  {getStatusBadge(sms.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
