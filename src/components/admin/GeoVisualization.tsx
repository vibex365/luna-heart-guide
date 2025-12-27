import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Globe, 
  MousePointer, 
  BarChart3, 
  Bell, 
  Image as ImageIcon, 
  MapPin,
  RefreshCw,
  Copy,
  Check,
  Send,
  Users,
  Clock,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00C49F'];

// Format time to EST 12-hour
const formatTimeEST = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const GeoVisualization = () => {
  const [activeTab, setActiveTab] = useState('live');
  const [copied, setCopied] = useState<string | null>(null);
  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody] = useState('');
  const [pushUrl, setPushUrl] = useState('/');
  const queryClient = useQueryClient();

  const projectId = 'vbfccooslnruiyhtrbrm';
  const pixelBaseUrl = `https://${projectId}.supabase.co/functions/v1/tracking-pixel`;

  // Fetch live visitors
  const { data: visitors, refetch: refetchVisitors, isLoading: loadingVisitors } = useQuery({
    queryKey: ['live-visitors'],
    queryFn: async () => {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('visitor_locations')
        .select('*')
        .gte('created_at', thirtyMinutesAgo)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Fetch tracking events
  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ['tracking-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tracking_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  // Fetch push subscriptions
  const { data: pushSubscriptions } = useQuery({
    queryKey: ['push-subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
  });

  // Fetch automated campaigns
  const { data: campaigns, refetch: refetchCampaigns } = useQuery({
    queryKey: ['automated-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automated_push_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch push logs
  const { data: pushLogs } = useQuery({
    queryKey: ['push-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automated_push_logs')
        .select('id, campaign_id, status, created_at, session_id')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  // Toggle campaign mutation
  const toggleCampaignMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('automated_push_campaigns')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automated-campaigns'] });
      toast.success('Campaign updated');
    },
  });

  // Realtime subscription for events
  useEffect(() => {
    const channel = supabase
      .channel('tracking-events-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tracking_events' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tracking-events'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Process events for charts
  const buttonClicksData = React.useMemo(() => {
    if (!events) return [];
    const buttonClicks = events.filter(e => e.event_type === 'button_click');
    const countByName: Record<string, number> = {};
    buttonClicks.forEach(e => {
      countByName[e.event_name] = (countByName[e.event_name] || 0) + 1;
    });
    return Object.entries(countByName)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [events]);

  const pixelSourcesData = React.useMemo(() => {
    if (!events) return [];
    const pixelViews = events.filter(e => e.event_type === 'pixel_view');
    const countBySource: Record<string, number> = {};
    pixelViews.forEach(e => {
      const source = (e.event_data as Record<string, string>)?.source || 'unknown';
      countBySource[source] = (countBySource[source] || 0) + 1;
    });
    return Object.entries(countBySource).map(([name, value]) => ({ name, value }));
  }, [events]);

  const eventTrendData = React.useMemo(() => {
    if (!events) return [];
    const last7Days: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      last7Days[format(date, 'MMM dd')] = 0;
    }
    events.forEach(e => {
      const date = format(new Date(e.created_at), 'MMM dd');
      if (last7Days[date] !== undefined) {
        last7Days[date]++;
      }
    });
    return Object.entries(last7Days).map(([date, count]) => ({ date, count }));
  }, [events]);

  const eventTypeDistribution = React.useMemo(() => {
    if (!events) return [];
    const countByType: Record<string, number> = {};
    events.forEach(e => {
      countByType[e.event_type] = (countByType[e.event_type] || 0) + 1;
    });
    return Object.entries(countByType).map(([name, value]) => ({ name, value }));
  }, [events]);

  // Analytics stats
  const analyticsStats = React.useMemo(() => {
    if (!visitors || !events) return null;
    
    const countries: Record<string, number> = {};
    const browsers: Record<string, number> = {};
    const referrers: Record<string, number> = {};
    
    visitors.forEach(v => {
      if (v.country) countries[v.country] = (countries[v.country] || 0) + 1;
      
      const ua = v.user_agent || '';
      let browser = 'Other';
      if (ua.includes('Chrome')) browser = 'Chrome';
      else if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Safari')) browser = 'Safari';
      else if (ua.includes('Edge')) browser = 'Edge';
      browsers[browser] = (browsers[browser] || 0) + 1;
      
      const ref = v.referrer || 'Direct';
      try {
        const refHost = v.referrer ? new URL(v.referrer).hostname : 'Direct';
        referrers[refHost] = (referrers[refHost] || 0) + 1;
      } catch {
        referrers[ref] = (referrers[ref] || 0) + 1;
      }
    });

    return {
      totalVisitors: visitors.length,
      totalEvents: events.length,
      topCountries: Object.entries(countries)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      browsers: Object.entries(browsers)
        .sort((a, b) => b[1] - a[1]),
      referrers: Object.entries(referrers)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    };
  }, [visitors, events]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(null), 2000);
  };

  const generatePixelUrl = (source: string, campaignId: string) => {
    return `${pixelBaseUrl}?src=${source}&cid=${campaignId}`;
  };

  const generateHtmlEmbed = (source: string, campaignId: string) => {
    const url = generatePixelUrl(source, campaignId);
    return `<img src="${url}" width="1" height="1" style="display:none" alt="" />`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Visitor Tracking & Marketing Automation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="live" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Live
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-1">
              <MousePointer className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="push" className="flex items-center gap-1">
              <Bell className="h-4 w-4" />
              Push
            </TabsTrigger>
            <TabsTrigger value="pixel" className="flex items-center gap-1">
              <ImageIcon className="h-4 w-4" />
              Pixel
            </TabsTrigger>
          </TabsList>

          {/* Live Tab */}
          <TabsContent value="live" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Live Visitors ({visitors?.length || 0})
              </h3>
              <Button size="sm" variant="outline" onClick={() => refetchVisitors()}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loadingVisitors ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : visitors?.length === 0 ? (
                <p className="text-muted-foreground">No visitors in the last 30 minutes</p>
              ) : (
                visitors?.map((visitor) => (
                  <div key={visitor.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-primary" />
                      <div>
                        <p className="font-medium">
                          {visitor.city || 'Unknown'}, {visitor.region || ''} {visitor.country_code || ''}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {visitor.page_path}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">
                        {visitor.user_agent?.includes('Mobile') ? 'Mobile' : 'Desktop'}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatTimeEST(visitor.created_at)} EST
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Button Clicks */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Button Clicks</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={buttonClicksData}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Pixel Impressions by Source */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Pixel Impressions by Source</CardTitle>
                </CardHeader>
                <CardContent>
                  {pixelSourcesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={pixelSourcesData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={60}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        >
                          {pixelSourcesData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No pixel data yet</p>
                  )}
                </CardContent>
              </Card>

              {/* Event Trends */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Event Trends (7 days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={eventTrendData}>
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#8884d8" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Event Type Distribution */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Event Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={eventTypeDistribution}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        label={({ name }) => name}
                      >
                        {eventTypeDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Events Table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Location</th>
                        <th className="text-left p-2">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events?.slice(0, 20).map((event) => (
                        <tr key={event.id} className="border-b">
                          <td className="p-2">
                            <Badge variant="outline">{event.event_type}</Badge>
                          </td>
                          <td className="p-2">{event.event_name}</td>
                          <td className="p-2">{event.city || 'Unknown'}, {event.country_code}</td>
                          <td className="p-2">{formatTimeEST(event.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            {analyticsStats && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">{analyticsStats.totalVisitors}</div>
                      <p className="text-sm text-muted-foreground">Recent Visitors</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">{analyticsStats.totalEvents}</div>
                      <p className="text-sm text-muted-foreground">Total Events</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">{pushSubscriptions?.length || 0}</div>
                      <p className="text-sm text-muted-foreground">Push Subscribers</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold">{campaigns?.filter(c => c.is_active).length || 0}</div>
                      <p className="text-sm text-muted-foreground">Active Campaigns</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Top Countries</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analyticsStats.topCountries.map(([country, count]) => (
                        <div key={country} className="flex justify-between py-1">
                          <span>{country}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Browsers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analyticsStats.browsers.map(([browser, count]) => (
                        <div key={browser} className="flex justify-between py-1">
                          <span>{browser}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Top Referrers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analyticsStats.referrers.map(([referrer, count]) => (
                        <div key={referrer} className="flex justify-between py-1">
                          <span className="truncate max-w-32">{referrer}</span>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Push Tab */}
          <TabsContent value="push" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Manual Push */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Send Push Notification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="Title"
                    value={pushTitle}
                    onChange={(e) => setPushTitle(e.target.value)}
                  />
                  <Textarea
                    placeholder="Body message"
                    value={pushBody}
                    onChange={(e) => setPushBody(e.target.value)}
                  />
                  <Input
                    placeholder="URL (e.g., /subscription)"
                    value={pushUrl}
                    onChange={(e) => setPushUrl(e.target.value)}
                  />
                  <Button className="w-full" disabled={!pushTitle || !pushBody}>
                    <Send className="h-4 w-4 mr-2" />
                    Send to {pushSubscriptions?.length || 0} subscribers
                  </Button>
                </CardContent>
              </Card>

              {/* Active Campaigns */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Automated Campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {campaigns?.map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {campaign.trigger_type} • {campaign.delay_minutes}min delay
                          </p>
                        </div>
                        <Switch
                          checked={campaign.is_active}
                          onCheckedChange={(checked) => 
                            toggleCampaignMutation.mutate({ id: campaign.id, isActive: checked })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Push Logs */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent Push Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 overflow-y-auto">
                  {pushLogs?.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No push logs yet</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Campaign</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pushLogs?.map((log) => (
                          <tr key={log.id} className="border-b">
                            <td className="p-2">{log.campaign_id?.slice(0, 8) || 'Unknown'}</td>
                            <td className="p-2">
                              <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                                {log.status}
                              </Badge>
                            </td>
                            <td className="p-2">{formatTimeEST(log.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pixel Tab */}
          <TabsContent value="pixel" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tracking Pixel Generator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Use these tracking pixels to monitor impressions from ads, emails, and other campaigns.
                </p>

                {/* Facebook */}
                <div className="space-y-2">
                  <h4 className="font-medium">Facebook Ads</h4>
                  <div className="flex gap-2">
                    <Input value={generatePixelUrl('facebook', 'fb_campaign1')} readOnly />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(generatePixelUrl('facebook', 'fb_campaign1'), 'fb-url')}
                    >
                      {copied === 'fb-url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input value={generateHtmlEmbed('facebook', 'fb_campaign1')} readOnly className="text-xs" />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(generateHtmlEmbed('facebook', 'fb_campaign1'), 'fb-html')}
                    >
                      {copied === 'fb-html' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Google */}
                <div className="space-y-2">
                  <h4 className="font-medium">Google Ads</h4>
                  <div className="flex gap-2">
                    <Input value={generatePixelUrl('google', 'google_campaign1')} readOnly />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(generatePixelUrl('google', 'google_campaign1'), 'google-url')}
                    >
                      {copied === 'google-url' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <h4 className="font-medium">Email Campaigns</h4>
                  <div className="flex gap-2">
                    <Input value={generateHtmlEmbed('email', 'email_newsletter1')} readOnly className="text-xs" />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => copyToClipboard(generateHtmlEmbed('email', 'email_newsletter1'), 'email-html')}
                    >
                      {copied === 'email-html' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Custom */}
                <div className="space-y-2">
                  <h4 className="font-medium">Custom Source</h4>
                  <p className="text-xs text-muted-foreground">
                    Format: {pixelBaseUrl}?src=SOURCE&cid=CAMPAIGN_ID&uid=USER_ID
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default GeoVisualization;
