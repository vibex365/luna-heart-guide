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
import { useToast } from "@/hooks/use-toast";
import { Save, Copy, ExternalLink, MessageCircle, Eye, TrendingUp } from "lucide-react";

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

const AdminMarketing = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);

  const baseUrl = window.location.origin;

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

  const { data: segmentStats } = useQuery({
    queryKey: ['segment-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnel_events')
        .select('segment, event_type')
        .eq('funnel_type', 'dm')
        .not('segment', 'is', null);
      
      if (error) throw error;
      
      // Calculate stats per segment
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const dmTemplates = [
    {
      segment: "overthinking",
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
      message: `Hey {{first_name}} 💕

That anxious feeling about where you stand in your relationship... the constant need for reassurance...

Luna understands. She's an AI companion designed to help you find calm in the uncertainty.

No judgment. Available 24/7 for those 3am spirals.

Want to feel more at peace?

👇 Tap below`,
      link: `${baseUrl}/dm?segment=anxiety&utm_source=instagram&utm_medium=dm&utm_campaign=manychat`,
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Marketing & Segments</h1>
          <p className="text-muted-foreground">Manage DM funnel segments and copy</p>
        </div>

        <Tabs defaultValue="segments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="segments">Segment Content</TabsTrigger>
            <TabsTrigger value="dm-templates">DM Templates</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Segment Content Tab */}
          <TabsContent value="segments" className="space-y-4">
            {isLoading ? (
              <p>Loading segments...</p>
            ) : (
              <div className="grid gap-4">
                {segments?.map((segment) => (
                  <Card key={segment.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">{segment.name}</CardTitle>
                          <Badge variant={segment.is_active ? "default" : "secondary"}>
                            {segment.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`${baseUrl}/dm?segment=${segment.slug}`, '_blank')}
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
                        URL: {baseUrl}/dm?segment={segment.slug}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-6 px-2"
                          onClick={() => copyToClipboard(`${baseUrl}/dm?segment=${segment.slug}`)}
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
                ))}
              </div>
            )}
          </TabsContent>

          {/* DM Templates Tab */}
          <TabsContent value="dm-templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  ManyChat DM Templates
                </CardTitle>
                <CardDescription>
                  Copy these messages into your ManyChat flow for each button
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {dmTemplates.map((template, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="capitalize">
                        {template.segment}
                      </Badge>
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
                        onClick={() => copyToClipboard(template.link)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(template.link, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ManyChat Setup Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <ol className="list-decimal list-inside space-y-3">
                  <li>Create a new Flow in ManyChat triggered by "Comment Automation" or "Story Reply"</li>
                  <li>Add a "Send Message" block with the question: "What's been on your mind lately?"</li>
                  <li>Add 3 Quick Reply buttons:
                    <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                      <li><strong>😵‍💫 Overthinking</strong></li>
                      <li><strong>💔 Breakup</strong></li>
                      <li><strong>😰 Relationship Anxiety</strong></li>
                    </ul>
                  </li>
                  <li>For each button, create a new message block with the corresponding template above</li>
                  <li>Add a "Button" block under each message with the link and text "Talk to Luna Now"</li>
                  <li>Test the flow before publishing</li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {segments?.map((segment) => {
                const stats = segmentStats?.[segment.slug] || { views: 0, checkouts: 0, conversions: 0 };
                const conversionRate = stats.views > 0 
                  ? ((stats.checkouts / stats.views) * 100).toFixed(1) 
                  : '0.0';
                
                return (
                  <Card key={segment.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        {segment.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Page Views</span>
                        <span className="font-medium">{stats.views}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Checkout Starts</span>
                        <span className="font-medium">{stats.checkouts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Conversions</span>
                        <span className="font-medium">{stats.conversions}</span>
                      </div>
                      <div className="pt-2 border-t flex justify-between">
                        <span className="text-muted-foreground">Conversion Rate</span>
                        <span className="font-bold text-primary">{conversionRate}%</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminMarketing;
