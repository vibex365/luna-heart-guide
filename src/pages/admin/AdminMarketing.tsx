import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Save, Copy, Eye, MessageCircle, TrendingUp, Users, Download, RefreshCw, Send, Loader2, Plus, TestTube, Heart } from "lucide-react";
import { format } from "date-fns";

interface Segment {
  id: string;
  slug: string;
  name: string;
  headline: string;
  subheadline: string;
  pain_points: string[];
  cta_text: string;
  is_active: boolean;
}

interface Lead {
  id: string;
  subscriber_id: string;
  first_name: string | null;
  email: string | null;
  phone: string | null;
  segment: string;
  source: string;
  status: string;
  interaction_count: number;
  created_at: string;
  last_interaction_at: string;
  converted_at: string | null;
}

const AdminMarketing = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [leadFilter, setLeadFilter] = useState<{ segment: string; status: string; funnelType: string }>({
    segment: "all",
    status: "all",
    funnelType: "all",
  });
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [sendingFollowUp, setSendingFollowUp] = useState(false);
  const [creatingTestLead, setCreatingTestLead] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookTestData, setWebhookTestData] = useState({
    subscriber_id: `test_${Date.now()}`,
    first_name: "Test User",
    email: "test@example.com",
    keyword: "overthinking",
  });

  const baseUrl = window.location.origin;

  // Check if segment is for couples
  const isCouplesSegment = (segment: string) => segment.startsWith('couples-');

  const { data: segments, isLoading } = useQuery({
    queryKey: ['dm-segments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dm_segments')
        .select('*')
        .order('slug');
      
      if (error) throw error;
      return data as Segment[];
    },
  });

  // Separate segments into singles and couples
  const singlesSegments = segments?.filter(s => !isCouplesSegment(s.slug)) || [];
  const couplesSegments = segments?.filter(s => isCouplesSegment(s.slug)) || [];

  const { data: leads, isLoading: leadsLoading, refetch: refetchLeads } = useQuery({
    queryKey: ['leads', leadFilter],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (leadFilter.segment !== "all") {
        query = query.eq('segment', leadFilter.segment);
      }
      if (leadFilter.status !== "all") {
        query = query.eq('status', leadFilter.status);
      }
      if (leadFilter.funnelType !== "all") {
        if (leadFilter.funnelType === "singles") {
          query = query.not('segment', 'like', 'couples-%');
        } else if (leadFilter.funnelType === "couples") {
          query = query.like('segment', 'couples-%');
        }
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Lead[];
    },
  });

  const { data: leadStats } = useQuery({
    queryKey: ['lead-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('segment, status');
      
      if (error) throw error;
      
      const stats = {
        total: data?.length || 0,
        new: data?.filter(l => l.status === 'new').length || 0,
        followedUp: data?.filter(l => l.status === 'followed_up').length || 0,
        converted: data?.filter(l => l.status === 'converted').length || 0,
        singles: data?.filter(l => !l.segment.startsWith('couples-')).length || 0,
        couples: data?.filter(l => l.segment.startsWith('couples-')).length || 0,
        bySegment: {} as Record<string, number>,
      };
      
      data?.forEach(lead => {
        stats.bySegment[lead.segment] = (stats.bySegment[lead.segment] || 0) + 1;
      });
      
      return stats;
    },
  });

  const { data: segmentStats } = useQuery({
    queryKey: ['segment-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnel_events')
        .select('segment, event_type, funnel_type')
        .in('funnel_type', ['dm', 'couples_dm'])
        .not('segment', 'is', null);
      
      if (error) throw error;
      
      const stats: Record<string, { views: number; checkouts: number; conversions: number }> = {};
      data?.forEach(event => {
        const seg = event.segment || 'none';
        if (!stats[seg]) {
          stats[seg] = { views: 0, checkouts: 0, conversions: 0 };
        }
        if (event.event_type === 'page_view') stats[seg].views++;
        if (event.event_type === 'checkout_start') stats[seg].checkouts++;
        if (event.event_type === 'checkout_complete') stats[seg].conversions++;
      });
      
      return stats;
    },
  });

  const updateSegment = useMutation({
    mutationFn: async (segment: Segment) => {
      const { error } = await supabase
        .from('dm_segments')
        .update({
          headline: segment.headline,
          subheadline: segment.subheadline,
          pain_points: segment.pain_points,
          cta_text: segment.cta_text,
          is_active: segment.is_active,
        })
        .eq('id', segment.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dm-segments'] });
      setEditingSegment(null);
      toast({ title: "Segment updated successfully" });
    },
    onError: (error) => {
      toast({ title: "Error updating segment", description: error.message, variant: "destructive" });
    },
  });

  const updateLeadStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: Record<string, unknown> = { status };
      if (status === 'converted') {
        updateData.converted_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
      toast({ title: "Lead status updated" });
    },
  });

  const triggerFollowUp = async (leadIds: string[], followUpType: "24h" | "72h") => {
    setSendingFollowUp(true);
    try {
      const response = await supabase.functions.invoke('lead-followup', {
        body: { lead_ids: leadIds, follow_up_type: followUpType },
      });
      
      if (response.error) throw response.error;
      
      const data = response.data;
      toast({
        title: "Follow-up DMs sent",
        description: `Sent: ${data.followUp24h?.sent || 0 + data.followUp72h?.sent || 0}, Failed: ${data.followUp24h?.failed || 0 + data.followUp72h?.failed || 0}`,
      });
      
      setSelectedLeads([]);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
    } catch (error) {
      toast({
        title: "Error sending follow-ups",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSendingFollowUp(false);
    }
  };

  const triggerAutomatedFollowUp = async () => {
    setSendingFollowUp(true);
    try {
      const response = await supabase.functions.invoke('lead-followup');
      
      if (response.error) throw response.error;
      
      const data = response.data;
      toast({
        title: "Automated follow-up completed",
        description: `24h: ${data.followUp24h?.sent || 0} sent, 72h: ${data.followUp72h?.sent || 0} sent`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
    } catch (error) {
      toast({
        title: "Error running follow-up",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSendingFollowUp(false);
    }
  };

  const createTestLead = async (isCouples = false) => {
    setCreatingTestLead(true);
    try {
      const segment = isCouples ? "couples-communication" : "overthinking";
      const { error } = await supabase.from('leads').insert({
        subscriber_id: `test_${Date.now()}`,
        first_name: "Test User",
        email: "test@example.com",
        segment,
        source: "manual",
        status: "new",
        utm_source: "admin",
        utm_medium: "test",
        utm_campaign: isCouples ? "manual_test_couples" : "manual_test",
      });
      
      if (error) throw error;
      
      toast({ title: `Test ${isCouples ? 'couples' : 'singles'} lead created` });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
    } catch (error) {
      toast({
        title: "Error creating test lead",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setCreatingTestLead(false);
    }
  };

  const testWebhook = async () => {
    setTestingWebhook(true);
    try {
      const response = await supabase.functions.invoke('manychat-webhook', {
        body: webhookTestData,
      });
      
      if (response.error) throw response.error;
      
      toast({ 
        title: "Webhook test successful",
        description: "Check the leads table for the new entry",
      });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead-stats'] });
      
      // Update subscriber_id for next test
      setWebhookTestData(prev => ({
        ...prev,
        subscriber_id: `test_${Date.now()}`,
      }));
    } catch (error) {
      toast({
        title: "Webhook test failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setTestingWebhook(false);
    }
  };

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  const selectAllLeads = () => {
    if (!leads) return;
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map(l => l.id));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const exportLeads = () => {
    if (!leads?.length) return;
    
    const csv = [
      ['ID', 'First Name', 'Email', 'Phone', 'Segment', 'Status', 'Source', 'Created', 'Interactions'].join(','),
      ...leads.map(lead => [
        lead.subscriber_id,
        lead.first_name || '',
        lead.email || '',
        lead.phone || '',
        lead.segment,
        lead.status,
        lead.source,
        format(new Date(lead.created_at), 'yyyy-MM-dd HH:mm'),
        lead.interaction_count,
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ title: "Leads exported" });
  };

  // DM Templates for singles
  const singlesDmTemplates = [
    {
      segment: "overthinking",
      keyword: "overthinking",
      message: `Hey {{first_name}} 👋

That loop of replaying every conversation... analyzing every pause...

Luna gets it. She's an AI companion who helps you untangle the spiral without judgment.

Thousands of women use her at 2am when their brain won't stop.

Want to try her for 30 days?

👇 Tap below`,
      link: `${baseUrl}/dm?segment=overthinking&utm_source=instagram&utm_medium=dm&utm_campaign=manychat`,
    },
    {
      segment: "breakup",
      keyword: "breakup",
      message: `Hey {{first_name}} 💔

Breakups are hard. Especially when everyone says "just move on" but your heart isn't ready.

Luna is an AI companion who helps you heal at your own pace. No timeline. No judgment.

She's helped thousands of women process heartbreak when friends got tired of listening.

Ready to start healing?

👇 Tap below`,
      link: `${baseUrl}/dm?segment=breakup&utm_source=instagram&utm_medium=dm&utm_campaign=manychat`,
    },
    {
      segment: "anxiety",
      keyword: "anxiety",
      message: `Hey {{first_name}} 💕

That anxious feeling about where you stand in your relationship... the constant need for reassurance...

Luna understands. She's an AI companion designed to help you find calm in the uncertainty.

No judgment. Available 24/7 for those 3am spirals.

Want to feel more at peace?

👇 Tap below`,
      link: `${baseUrl}/dm?segment=anxiety&utm_source=instagram&utm_medium=dm&utm_campaign=manychat`,
    },
  ];

  // DM Templates for couples
  const couplesDmTemplates = [
    {
      segment: "couples-communication",
      keyword: "communication",
      message: `Hey {{first_name}} 💕

Having the same argument on repeat? That's exhausting for both of you.

Luna for Couples helps you break the cycle — together.

Real tools. No awkward silences. One subscription for both of you.

Ready to reconnect?

👇 Tap below`,
      link: `${baseUrl}/couples-funnel?segment=couples-communication&utm_source=instagram&utm_medium=dm&utm_campaign=manychat_couples`,
    },
    {
      segment: "couples-disconnected",
      keyword: "disconnected",
      message: `Hey {{first_name}} 💫

Feeling more like roommates than partners? You're not alone.

Luna for Couples helps you rediscover each other — one conversation at a time.

Thousands of couples use it to find their way back to each other.

Ready to feel connected again?

👇 Tap below`,
      link: `${baseUrl}/couples-funnel?segment=couples-disconnected&utm_source=instagram&utm_medium=dm&utm_campaign=manychat_couples`,
    },
    {
      segment: "couples-trust",
      keyword: "trust",
      message: `Hey {{first_name}} 💜

Rebuilding trust isn't easy. But you don't have to figure it out alone.

Luna for Couples gives you both the tools to heal — together.

No blame. No shame. Just progress.

Ready to start healing?

👇 Tap below`,
      link: `${baseUrl}/couples-funnel?segment=couples-trust&utm_source=instagram&utm_medium=dm&utm_campaign=manychat_couples`,
    },
  ];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'new': return 'default';
      case 'followed_up': return 'secondary';
      case 'followed_up_72h': return 'secondary';
      case 'converted': return 'outline';
      default: return 'secondary';
    }
  };

  const getSegmentPreviewUrl = (segment: Segment) => {
    const isCouples = isCouplesSegment(segment.slug);
    return isCouples 
      ? `${baseUrl}/couples-funnel?segment=${segment.slug}`
      : `${baseUrl}/dm?segment=${segment.slug}`;
  };

  const renderSegmentCard = (segment: Segment) => (
    <Card key={segment.id}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">{segment.name}</CardTitle>
            <Badge variant={segment.is_active ? "default" : "secondary"}>
              {segment.is_active ? "Active" : "Inactive"}
            </Badge>
            {isCouplesSegment(segment.slug) && (
              <Badge variant="outline" className="gap-1">
                <Heart className="w-3 h-3" />
                Couples
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(getSegmentPreviewUrl(segment), '_blank')}
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditingSegment(segment)}
            >
              Edit
            </Button>
          </div>
        </div>
        <CardDescription>
          URL: {getSegmentPreviewUrl(segment)}
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 h-6 px-2"
            onClick={() => copyToClipboard(getSegmentPreviewUrl(segment))}
          >
            <Copy className="w-3 h-3" />
          </Button>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {editingSegment?.id === segment.id ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Headline</Label>
              <Input
                value={editingSegment.headline}
                onChange={(e) => setEditingSegment({
                  ...editingSegment,
                  headline: e.target.value,
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Subheadline</Label>
              <Textarea
                value={editingSegment.subheadline}
                onChange={(e) => setEditingSegment({
                  ...editingSegment,
                  subheadline: e.target.value,
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Pain Points (one per line)</Label>
              <Textarea
                rows={4}
                value={editingSegment.pain_points.join('\n')}
                onChange={(e) => setEditingSegment({
                  ...editingSegment,
                  pain_points: e.target.value.split('\n').filter(p => p.trim()),
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>CTA Button Text</Label>
              <Input
                value={editingSegment.cta_text}
                onChange={(e) => setEditingSegment({
                  ...editingSegment,
                  cta_text: e.target.value,
                })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={editingSegment.is_active}
                onCheckedChange={(checked) => setEditingSegment({
                  ...editingSegment,
                  is_active: checked,
                })}
              />
              <Label>Active</Label>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => updateSegment.mutate(editingSegment)}
                disabled={updateSegment.isPending}
              >
                <Save className="w-4 h-4 mr-1" />
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditingSegment(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-muted-foreground">Headline:</span>
              <p className="font-medium">{segment.headline}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Subheadline:</span>
              <p>{segment.subheadline}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Pain Points:</span>
              <ul className="list-disc list-inside">
                {segment.pain_points.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
            <div>
              <span className="text-muted-foreground">CTA:</span>
              <p className="font-medium">{segment.cta_text}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderDmTemplates = (templates: typeof singlesDmTemplates, title: string, isCouples: boolean) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isCouples ? <Heart className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
          {title}
        </CardTitle>
        <CardDescription>
          Copy these messages into ManyChat. Keywords: {templates.map(t => t.keyword).join(', ')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {templates.map((template, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {template.segment}
                </Badge>
                <Badge variant="secondary">Keyword: {template.keyword}</Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(template.message)}
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy Message
              </Button>
            </div>
            <pre className="bg-muted p-3 rounded text-sm whitespace-pre-wrap font-mono">
              {template.message}
            </pre>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Button Link:</span>
              <code className="bg-muted px-2 py-1 rounded text-xs flex-1 truncate">
                {template.link}
              </code>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={() => copyToClipboard(template.link)}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Marketing & Segments</h1>
          <p className="text-muted-foreground">Manage DM funnel segments, leads, and copy for singles & couples</p>
        </div>

        <Tabs defaultValue="leads" className="space-y-6">
          <TabsList>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="segments">Segment Content</TabsTrigger>
            <TabsTrigger value="dm-templates">DM Templates</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-4">
            {/* Test Tools */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Test Tools</CardTitle>
                <CardDescription>Create test data to verify the leads pipeline</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4 items-end">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => createTestLead(false)}
                    disabled={creatingTestLead}
                  >
                    {creatingTestLead ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
                    Singles Lead
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => createTestLead(true)}
                    disabled={creatingTestLead}
                  >
                    {creatingTestLead ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Heart className="w-4 h-4 mr-1" />}
                    Couples Lead
                  </Button>
                </div>
                <div className="flex gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Keyword</Label>
                    <Select
                      value={webhookTestData.keyword}
                      onValueChange={(value) => setWebhookTestData(prev => ({ ...prev, keyword: value }))}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overthinking">overthinking</SelectItem>
                        <SelectItem value="breakup">breakup</SelectItem>
                        <SelectItem value="anxiety">anxiety</SelectItem>
                        <SelectItem value="communication">communication</SelectItem>
                        <SelectItem value="disconnected">disconnected</SelectItem>
                        <SelectItem value="trust">trust</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input 
                      value={webhookTestData.first_name}
                      onChange={(e) => setWebhookTestData(prev => ({ ...prev, first_name: e.target.value }))}
                      className="w-[120px]"
                    />
                  </div>
                  <Button 
                    onClick={testWebhook}
                    disabled={testingWebhook}
                  >
                    {testingWebhook ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <TestTube className="w-4 h-4 mr-1" />}
                    Test Webhook
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Lead Stats */}
            <div className="grid gap-4 md:grid-cols-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Leads</CardDescription>
                  <CardTitle className="text-3xl">{leadStats?.total || 0}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Singles</CardDescription>
                  <CardTitle className="text-3xl text-purple-500">{leadStats?.singles || 0}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Couples</CardDescription>
                  <CardTitle className="text-3xl text-pink-500">{leadStats?.couples || 0}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>New</CardDescription>
                  <CardTitle className="text-3xl text-blue-500">{leadStats?.new || 0}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Followed Up</CardDescription>
                  <CardTitle className="text-3xl text-yellow-500">{leadStats?.followedUp || 0}</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Converted</CardDescription>
                  <CardTitle className="text-3xl text-green-500">{leadStats?.converted || 0}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-4 flex-wrap">
                <Select
                  value={leadFilter.funnelType}
                  onValueChange={(value) => setLeadFilter(prev => ({ ...prev, funnelType: value }))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Funnel type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Funnels</SelectItem>
                    <SelectItem value="singles">Singles</SelectItem>
                    <SelectItem value="couples">Couples</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={leadFilter.segment}
                  onValueChange={(value) => setLeadFilter(prev => ({ ...prev, segment: value }))}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by segment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Segments</SelectItem>
                    <SelectItem value="overthinking">Overthinking</SelectItem>
                    <SelectItem value="breakup">Breakup</SelectItem>
                    <SelectItem value="anxiety">Anxiety</SelectItem>
                    <SelectItem value="couples-communication">Couples - Communication</SelectItem>
                    <SelectItem value="couples-disconnected">Couples - Disconnected</SelectItem>
                    <SelectItem value="couples-trust">Couples - Trust</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select
                  value={leadFilter.status}
                  onValueChange={(value) => setLeadFilter(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="followed_up">Followed Up (24h)</SelectItem>
                    <SelectItem value="followed_up_72h">Followed Up (72h)</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {selectedLeads.length > 0 && (
                  <>
                    <Button 
                      size="sm" 
                      onClick={() => triggerFollowUp(selectedLeads, "24h")}
                      disabled={sendingFollowUp}
                    >
                      {sendingFollowUp ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                      Send 24h Follow-up ({selectedLeads.length})
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => triggerFollowUp(selectedLeads, "72h")}
                      disabled={sendingFollowUp}
                    >
                      {sendingFollowUp ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                      Send 72h Follow-up ({selectedLeads.length})
                    </Button>
                  </>
                )}
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={triggerAutomatedFollowUp}
                  disabled={sendingFollowUp}
                >
                  {sendingFollowUp ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Send className="w-4 h-4 mr-1" />}
                  Run Auto Follow-ups
                </Button>
                <Button variant="outline" size="sm" onClick={() => refetchLeads()}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" onClick={exportLeads} disabled={!leads?.length}>
                  <Download className="w-4 h-4 mr-1" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Leads Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input 
                          type="checkbox" 
                          checked={leads?.length ? selectedLeads.length === leads.length : false}
                          onChange={selectAllLeads}
                          className="rounded border-muted-foreground/50"
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Segment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Interactions</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leadsLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Loading leads...
                        </TableCell>
                      </TableRow>
                    ) : !leads?.length ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No leads found
                        </TableCell>
                      </TableRow>
                    ) : (
                      leads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <input 
                              type="checkbox" 
                              checked={selectedLeads.includes(lead.id)}
                              onChange={() => toggleLeadSelection(lead.id)}
                              className="rounded border-muted-foreground/50"
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {lead.first_name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {lead.email && <div>{lead.email}</div>}
                              {lead.phone && <div className="text-muted-foreground">{lead.phone}</div>}
                              {!lead.email && !lead.phone && <span className="text-muted-foreground">—</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="capitalize">
                                {lead.segment.replace('couples-', '')}
                              </Badge>
                              {isCouplesSegment(lead.segment) && (
                                <Heart className="w-3 h-3 text-pink-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(lead.status)}>
                              {lead.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>{lead.interaction_count}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {format(new Date(lead.created_at), 'MMM d, HH:mm')}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={lead.status}
                              onValueChange={(value) => updateLeadStatus.mutate({ id: lead.id, status: value })}
                            >
                              <SelectTrigger className="w-[140px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="followed_up">Followed Up (24h)</SelectItem>
                                <SelectItem value="followed_up_72h">Followed Up (72h)</SelectItem>
                                <SelectItem value="converted">Converted</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Segment Content Tab */}
          <TabsContent value="segments" className="space-y-6">
            {isLoading ? (
              <p>Loading segments...</p>
            ) : (
              <>
                {/* Singles Segments */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Singles Segments
                  </h2>
                  <div className="grid gap-4">
                    {singlesSegments.map(renderSegmentCard)}
                  </div>
                </div>

                {/* Couples Segments */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Couples Segments
                  </h2>
                  <div className="grid gap-4">
                    {couplesSegments.map(renderSegmentCard)}
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          {/* DM Templates Tab */}
          <TabsContent value="dm-templates" className="space-y-6">
            {renderDmTemplates(singlesDmTemplates, "Singles DM Templates", false)}
            {renderDmTemplates(couplesDmTemplates, "Couples DM Templates", true)}
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Segment Performance
                </CardTitle>
                <CardDescription>
                  Track views, checkouts, and conversions by segment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Segment</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Leads</TableHead>
                      <TableHead className="text-right">Page Views</TableHead>
                      <TableHead className="text-right">Checkouts</TableHead>
                      <TableHead className="text-right">Conversions</TableHead>
                      <TableHead className="text-right">Conv. Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {segments?.map((segment) => {
                      const stats = segmentStats?.[segment.slug] || { views: 0, checkouts: 0, conversions: 0 };
                      const leads = leadStats?.bySegment[segment.slug] || 0;
                      const convRate = stats.views > 0 
                        ? ((stats.conversions / stats.views) * 100).toFixed(1)
                        : '0.0';
                      const isCouples = isCouplesSegment(segment.slug);
                      
                      return (
                        <TableRow key={segment.id}>
                          <TableCell className="font-medium">{segment.name}</TableCell>
                          <TableCell>
                            <Badge variant={isCouples ? "outline" : "secondary"}>
                              {isCouples ? "Couples" : "Singles"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{leads}</TableCell>
                          <TableCell className="text-right">{stats.views}</TableCell>
                          <TableCell className="text-right">{stats.checkouts}</TableCell>
                          <TableCell className="text-right">{stats.conversions}</TableCell>
                          <TableCell className="text-right">{convRate}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminMarketing;
