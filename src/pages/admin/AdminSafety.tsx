import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye,
  MessageSquare,
  Shield,
  XCircle
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FlaggedConversation {
  id: string;
  conversation_id: string | null;
  user_id: string;
  flag_type: string;
  severity: string;
  trigger_phrase: string | null;
  message_content: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
}

export default function AdminSafety() {
  const queryClient = useQueryClient();
  const [selectedFlag, setSelectedFlag] = useState<FlaggedConversation | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: flags, isLoading } = useQuery({
    queryKey: ["flagged-conversations", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("flagged_conversations")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FlaggedConversation[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from("flagged_conversations")
        .update({
          status,
          notes,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flagged-conversations"] });
      toast.success("Flag status updated");
      setSelectedFlag(null);
      setReviewNotes("");
    },
    onError: () => {
      toast.error("Failed to update status");
    },
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-destructive text-destructive-foreground";
      case "high":
        return "bg-orange-500 text-white";
      case "medium":
        return "bg-yellow-500 text-black";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "reviewed":
        return <Eye className="h-4 w-4" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4" />;
      case "dismissed":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const pendingCount = flags?.filter((f) => f.status === "pending").length || 0;
  const criticalCount = flags?.filter((f) => f.severity === "critical" && f.status === "pending").length || 0;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-8 w-8 text-accent" />
            <h1 className="text-2xl font-bold">Safety & Crisis Management</h1>
          </div>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-accent" />
        <h1 className="text-2xl font-bold">Safety & Crisis Management</h1>
      </div>

      {/* Alert Banner */}
      {criticalCount > 0 && (
        <Card className="mb-6 border-destructive bg-destructive/10">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div>
              <p className="font-semibold text-destructive">
                {criticalCount} Critical Alert{criticalCount > 1 ? "s" : ""} Requiring Immediate Attention
              </p>
              <p className="text-sm text-muted-foreground">
                Please review these conversations as soon as possible.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Flags</p>
                <p className="text-2xl font-bold text-destructive">{criticalCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved Today</p>
                <p className="text-2xl font-bold">
                  {flags?.filter((f) => {
                    const today = new Date().toDateString();
                    return f.status === "resolved" && new Date(f.reviewed_at || "").toDateString() === today;
                  }).length || 0}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Flags</p>
                <p className="text-2xl font-bold">{flags?.length || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="pending">
            Pending {pendingCount > 0 && <Badge variant="destructive" className="ml-2">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Flags List */}
      <div className="space-y-4">
        {flags?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No flagged conversations found</p>
            </CardContent>
          </Card>
        ) : (
          flags?.map((flag) => (
            <Card
              key={flag.id}
              className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                flag.severity === "critical" && flag.status === "pending"
                  ? "border-destructive"
                  : ""
              }`}
              onClick={() => {
                setSelectedFlag(flag);
                setReviewNotes(flag.notes || "");
              }}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getSeverityColor(flag.severity)}>
                        {flag.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {getStatusIcon(flag.status)}
                        {flag.status}
                      </Badge>
                      <Badge variant="secondary">{flag.flag_type}</Badge>
                    </div>
                    {flag.trigger_phrase && (
                      <p className="text-sm mb-1">
                        <span className="text-muted-foreground">Trigger: </span>
                        <span className="font-medium">"{flag.trigger_phrase}"</span>
                      </p>
                    )}
                    {flag.message_content && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {flag.message_content}
                      </p>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{new Date(flag.created_at).toLocaleDateString()}</p>
                    <p>{new Date(flag.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Review Sheet */}
      <Sheet open={!!selectedFlag} onOpenChange={() => setSelectedFlag(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Review Flagged Conversation
            </SheetTitle>
            <SheetDescription>
              Review the details and take appropriate action.
            </SheetDescription>
          </SheetHeader>

          {selectedFlag && (
            <div className="mt-6 space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-2">Severity & Type</h4>
                <div className="flex gap-2">
                  <Badge className={getSeverityColor(selectedFlag.severity)}>
                    {selectedFlag.severity.toUpperCase()}
                  </Badge>
                  <Badge variant="secondary">{selectedFlag.flag_type}</Badge>
                </div>
              </div>

              {selectedFlag.trigger_phrase && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Trigger Phrase</h4>
                  <p className="text-sm bg-muted p-3 rounded-md">
                    "{selectedFlag.trigger_phrase}"
                  </p>
                </div>
              )}

              {selectedFlag.message_content && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Message Content</h4>
                  <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                    {selectedFlag.message_content}
                  </p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium mb-2">Flagged At</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedFlag.created_at).toLocaleString()}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Review Notes</h4>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about this review..."
                  rows={3}
                />
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Update Status</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        id: selectedFlag.id,
                        status: "reviewed",
                        notes: reviewNotes,
                      })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Mark Reviewed
                  </Button>
                  <Button
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        id: selectedFlag.id,
                        status: "resolved",
                        notes: reviewNotes,
                      })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolve
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      updateStatusMutation.mutate({
                        id: selectedFlag.id,
                        status: "dismissed",
                        notes: reviewNotes,
                      })
                    }
                    disabled={updateStatusMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}
