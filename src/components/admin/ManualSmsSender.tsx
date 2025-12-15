import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Send, Loader2, Users, User, Smartphone } from "lucide-react";

interface UserWithPhone {
  user_id: string;
  display_name: string | null;
  phone_number: string | null;
  phone_verified: boolean | null;
}

interface ManualSmsSenderProps {
  initialMessage?: string | null;
}

export function ManualSmsSender({ initialMessage }: ManualSmsSenderProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [recipientType, setRecipientType] = useState<"all" | "selected" | "single">("single");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedSingleUser, setSelectedSingleUser] = useState<string>("");
  const [isSending, setIsSending] = useState(false);

  // Update message when template is selected
  useEffect(() => {
    if (initialMessage) {
      setMessage(initialMessage);
    }
  }, [initialMessage]);

  // Fetch users with verified phone numbers
  const { data: usersWithPhone = [], isLoading } = useQuery({
    queryKey: ["users-with-phone"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, display_name, phone_number, phone_verified")
        .eq("phone_verified", true)
        .not("phone_number", "is", null);
      
      if (error) throw error;
      return data as UserWithPhone[];
    },
  });

  const handleSendSms = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    let recipients: string[] = [];

    if (recipientType === "all") {
      recipients = usersWithPhone.map(u => u.user_id);
    } else if (recipientType === "selected") {
      recipients = selectedUsers;
    } else if (recipientType === "single" && selectedSingleUser) {
      recipients = [selectedSingleUser];
    }

    if (recipients.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    setIsSending(true);

    try {
      let successCount = 0;
      let failCount = 0;
      const fullMessage = `💜 Luna: ${message}`;

      for (const recipientUserId of recipients) {
        const recipientUser = usersWithPhone.find(u => u.user_id === recipientUserId);
        
        const { data, error } = await supabase.functions.invoke("send-sms", {
          body: {
            action: "send-notification",
            userId: recipientUserId,
            message: fullMessage,
          },
        });

        // Log the delivery
        const logStatus = error || data?.error ? "failed" : "delivered";
        await supabase.from("sms_delivery_logs").insert({
          user_id: recipientUserId,
          phone_number: recipientUser?.phone_number || "unknown",
          message: fullMessage,
          status: logStatus,
          twilio_sid: data?.sid || null,
          error_message: error?.message || data?.error || null,
          sent_by: user?.id,
        });

        if (error || data?.error) {
          failCount++;
          console.error(`Failed to send SMS to ${recipientUserId}:`, error || data?.error);
        } else {
          successCount++;
        }
      }

      // Refresh delivery logs
      queryClient.invalidateQueries({ queryKey: ["sms-delivery-logs"] });

      if (successCount > 0) {
        toast.success(`SMS sent to ${successCount} user(s)`);
      }
      if (failCount > 0) {
        toast.error(`Failed to send to ${failCount} user(s)`);
      }

      // Reset form on success
      if (successCount > 0) {
        setMessage("");
        setSelectedUsers([]);
        setSelectedSingleUser("");
      }
    } catch (error) {
      console.error("Error sending SMS:", error);
      toast.error("Failed to send SMS");
    } finally {
      setIsSending(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllUsers = () => {
    setSelectedUsers(usersWithPhone.map(u => u.user_id));
  };

  const deselectAllUsers = () => {
    setSelectedUsers([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Send Manual SMS
        </CardTitle>
        <CardDescription>
          Send custom SMS notifications to users with verified phone numbers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recipient Type Selection */}
        <div className="space-y-2">
          <Label>Recipients</Label>
          <Select value={recipientType} onValueChange={(v) => setRecipientType(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Single User
                </div>
              </SelectItem>
              <SelectItem value="selected">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Selected Users
                </div>
              </SelectItem>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  All Users with Phone ({usersWithPhone.length})
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Single User Selection */}
        {recipientType === "single" && (
          <div className="space-y-2">
            <Label>Select User</Label>
            <Select value={selectedSingleUser} onValueChange={setSelectedSingleUser}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {usersWithPhone.map((user) => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {user.display_name || "Unknown"} - {user.phone_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Multiple User Selection */}
        {recipientType === "selected" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select Users ({selectedUsers.length} selected)</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllUsers}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAllUsers}>
                  Deselect All
                </Button>
              </div>
            </div>
            <ScrollArea className="h-48 border rounded-lg p-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : usersWithPhone.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No users with verified phone numbers
                </p>
              ) : (
                <div className="space-y-2">
                  {usersWithPhone.map((user) => (
                    <div
                      key={user.user_id}
                      className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                      onClick={() => toggleUserSelection(user.user_id)}
                    >
                      <Checkbox
                        checked={selectedUsers.includes(user.user_id)}
                        onCheckedChange={() => toggleUserSelection(user.user_id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {user.display_name || "Unknown User"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.phone_number}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* All Users Info */}
        {recipientType === "all" && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm">
              This will send the SMS to <strong>{usersWithPhone.length}</strong> users with verified phone numbers.
            </p>
          </div>
        )}

        {/* Message Input */}
        <div className="space-y-2">
          <Label htmlFor="sms-message">Message</Label>
          <Textarea
            id="sms-message"
            placeholder="Enter your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={320}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Messages are prefixed with "💜 Luna:"</span>
            <span>{message.length}/320 characters</span>
          </div>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSendSms}
          disabled={isSending || !message.trim() || (recipientType === "single" && !selectedSingleUser) || (recipientType === "selected" && selectedUsers.length === 0)}
          className="w-full"
        >
          {isSending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Send SMS
              {recipientType === "all" && ` to ${usersWithPhone.length} users`}
              {recipientType === "selected" && selectedUsers.length > 0 && ` to ${selectedUsers.length} users`}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
