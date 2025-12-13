import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, Users, CreditCard, Eye, ArrowRight, Target, Link2, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfDay } from 'date-fns';

interface FunnelEvent {
  id: string;
  event_type: string;
  funnel_type: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  created_at: string;
}

interface FunnelMetrics {
  pageViews: number;
  checkoutStarts: number;
  checkoutCompletes: number;
  viewToCheckoutRate: number;
  checkoutConversionRate: number;
  overallConversionRate: number;
}

interface SourceMetrics {
  source: string;
  pageViews: number;
  checkoutStarts: number;
  checkoutCompletes: number;
  conversionRate: number;
}

const COLORS = ['hsl(330, 70%, 65%)', 'hsl(350, 60%, 70%)', 'hsl(280, 60%, 65%)', 'hsl(200, 70%, 60%)', 'hsl(150, 60%, 50%)'];

const AdminFunnelAnalytics = () => {
  const [dateRange, setDateRange] = useState('7');
  const [selectedFunnel, setSelectedFunnel] = useState<'all' | 'dm' | 'couples'>('all');
  const { toast } = useToast();

  // Get the base URL for funnel links
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  
  const funnelUrls = [
    {
      name: 'DM Funnel',
      path: '/dm',
      fullUrl: `${baseUrl}/dm`,
      instagramUrl: `${baseUrl}/dm?utm_source=instagram&utm_medium=dm&utm_campaign=main`,
      tiktokUrl: `${baseUrl}/dm?utm_source=tiktok&utm_medium=dm&utm_campaign=main`,
    },
    {
      name: 'Couples Funnel',
      path: '/couples-funnel',
      fullUrl: `${baseUrl}/couples-funnel`,
      instagramUrl: `${baseUrl}/couples-funnel?utm_source=instagram&utm_medium=dm&utm_campaign=couples`,
      tiktokUrl: `${baseUrl}/couples-funnel?utm_source=tiktok&utm_medium=dm&utm_campaign=couples`,
    }
  ];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} URL copied to clipboard`,
    });
  };

  const { data: events, isLoading } = useQuery({
    queryKey: ['funnel-events', dateRange, selectedFunnel],
    queryFn: async () => {
      const startDate = startOfDay(subDays(new Date(), parseInt(dateRange)));
      
      let query = supabase
        .from('funnel_events')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });
      
      if (selectedFunnel !== 'all') {
        query = query.eq('funnel_type', selectedFunnel);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as FunnelEvent[];
    }
  });

  // Calculate overall metrics
  const calculateMetrics = (events: FunnelEvent[]): FunnelMetrics => {
    const pageViews = events.filter(e => e.event_type === 'page_view').length;
    const checkoutStarts = events.filter(e => e.event_type === 'checkout_start').length;
    const checkoutCompletes = events.filter(e => e.event_type === 'checkout_complete').length;
    
    return {
      pageViews,
      checkoutStarts,
      checkoutCompletes,
      viewToCheckoutRate: pageViews > 0 ? (checkoutStarts / pageViews) * 100 : 0,
      checkoutConversionRate: checkoutStarts > 0 ? (checkoutCompletes / checkoutStarts) * 100 : 0,
      overallConversionRate: pageViews > 0 ? (checkoutCompletes / pageViews) * 100 : 0
    };
  };

  // Calculate metrics by source
  const calculateSourceMetrics = (events: FunnelEvent[]): SourceMetrics[] => {
    const sourceMap = new Map<string, { pageViews: number; checkoutStarts: number; checkoutCompletes: number }>();
    
    events.forEach(event => {
      const source = event.utm_source || 'direct';
      if (!sourceMap.has(source)) {
        sourceMap.set(source, { pageViews: 0, checkoutStarts: 0, checkoutCompletes: 0 });
      }
      const data = sourceMap.get(source)!;
      if (event.event_type === 'page_view') data.pageViews++;
      if (event.event_type === 'checkout_start') data.checkoutStarts++;
      if (event.event_type === 'checkout_complete') data.checkoutCompletes++;
    });
    
    return Array.from(sourceMap.entries()).map(([source, data]) => ({
      source,
      ...data,
      conversionRate: data.pageViews > 0 ? (data.checkoutCompletes / data.pageViews) * 100 : 0
    })).sort((a, b) => b.pageViews - a.pageViews);
  };

  // Calculate daily trends
  const calculateDailyTrends = (events: FunnelEvent[]) => {
    const dailyMap = new Map<string, { date: string; pageViews: number; checkoutStarts: number; checkoutCompletes: number }>();
    
    events.forEach(event => {
      const date = format(new Date(event.created_at), 'MMM dd');
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { date, pageViews: 0, checkoutStarts: 0, checkoutCompletes: 0 });
      }
      const data = dailyMap.get(date)!;
      if (event.event_type === 'page_view') data.pageViews++;
      if (event.event_type === 'checkout_start') data.checkoutStarts++;
      if (event.event_type === 'checkout_complete') data.checkoutCompletes++;
    });
    
    return Array.from(dailyMap.values()).reverse();
  };

  const metrics = events ? calculateMetrics(events) : null;
  const sourceMetrics = events ? calculateSourceMetrics(events) : [];
  const dailyTrends = events ? calculateDailyTrends(events) : [];

  // Funnel comparison data
  const funnelComparison = events ? (() => {
    const dmEvents = events.filter(e => e.funnel_type === 'dm');
    const couplesEvents = events.filter(e => e.funnel_type === 'couples');
    return [
      { name: 'DM Funnel', ...calculateMetrics(dmEvents) },
      { name: 'Couples Funnel', ...calculateMetrics(couplesEvents) }
    ];
  })() : [];

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Funnel Analytics</h1>
        <p className="text-muted-foreground">Track conversion rates and performance across funnels</p>
      </div>

      {/* Funnel URLs Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Funnel URLs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelUrls.map((funnel) => (
              <div key={funnel.path} className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{funnel.name}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(funnel.fullUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                </div>
                
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20">Base URL:</span>
                    <code className="flex-1 text-xs bg-background px-2 py-1 rounded border truncate">
                      {funnel.fullUrl}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => copyToClipboard(funnel.fullUrl, funnel.name)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20">Instagram:</span>
                    <code className="flex-1 text-xs bg-background px-2 py-1 rounded border truncate">
                      {funnel.instagramUrl}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => copyToClipboard(funnel.instagramUrl, `${funnel.name} (Instagram)`)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-20">TikTok:</span>
                    <code className="flex-1 text-xs bg-background px-2 py-1 rounded border truncate">
                      {funnel.tiktokUrl}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => copyToClipboard(funnel.tiktokUrl, `${funnel.name} (TikTok)`)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last 24 hours</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={selectedFunnel} onValueChange={(v) => setSelectedFunnel(v as 'all' | 'dm' | 'couples')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select funnel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Funnels</SelectItem>
            <SelectItem value="dm">DM Funnel</SelectItem>
            <SelectItem value="couples">Couples Funnel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.pageViews.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total funnel visits</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Checkout Starts</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.checkoutStarts.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.viewToCheckoutRate.toFixed(1)}% of visitors
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversions</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.checkoutCompletes.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.checkoutConversionRate.toFixed(1)}% checkout completion
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <Target className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {metrics?.overallConversionRate.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">Overall funnel conversion</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="sources" className="space-y-4">
            <TabsList>
              <TabsTrigger value="sources">By Source</TabsTrigger>
              <TabsTrigger value="trends">Daily Trends</TabsTrigger>
              <TabsTrigger value="comparison">Funnel Comparison</TabsTrigger>
            </TabsList>

            {/* By Source Tab */}
            <TabsContent value="sources" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Source Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Performance by UTM Source</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {sourceMetrics.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">No data available</p>
                      ) : (
                        sourceMetrics.map((source, index) => (
                          <div key={source.source} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <div>
                                <p className="font-medium capitalize">{source.source}</p>
                                <p className="text-xs text-muted-foreground">
                                  {source.pageViews} views → {source.checkoutStarts} starts → {source.checkoutCompletes} conversions
                                </p>
                              </div>
                            </div>
                            <Badge variant={source.conversionRate > 5 ? 'default' : 'secondary'}>
                              {source.conversionRate.toFixed(1)}%
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Source Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Traffic Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sourceMetrics.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={sourceMetrics}
                            dataKey="pageViews"
                            nameKey="source"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={({ source, percent }) => `${source} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {sourceMetrics.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        No data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Daily Trends Tab */}
            <TabsContent value="trends">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Daily Funnel Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {dailyTrends.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={dailyTrends}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="pageViews" name="Page Views" fill="hsl(330, 70%, 65%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="checkoutStarts" name="Checkout Starts" fill="hsl(280, 60%, 65%)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="checkoutCompletes" name="Conversions" fill="hsl(150, 60%, 50%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Funnel Comparison Tab */}
            <TabsContent value="comparison">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {funnelComparison.map((funnel) => (
                  <Card key={funnel.name}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {funnel.name}
                        <Badge variant="outline">{funnel.overallConversionRate.toFixed(2)}% CVR</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Funnel visualization */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                              <div 
                                className="h-full bg-primary/80 flex items-center justify-end pr-2 text-xs text-primary-foreground font-medium"
                                style={{ width: '100%' }}
                              >
                                {funnel.pageViews}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                              <div 
                                className="h-full bg-primary/60 flex items-center justify-end pr-2 text-xs font-medium"
                                style={{ width: `${funnel.pageViews > 0 ? (funnel.checkoutStarts / funnel.pageViews) * 100 : 0}%`, minWidth: funnel.checkoutStarts > 0 ? '40px' : '0' }}
                              >
                                {funnel.checkoutStarts}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <div className="flex-1 bg-muted rounded-full h-6 overflow-hidden">
                              <div 
                                className="h-full bg-green-500 flex items-center justify-end pr-2 text-xs text-white font-medium"
                                style={{ width: `${funnel.pageViews > 0 ? (funnel.checkoutCompletes / funnel.pageViews) * 100 : 0}%`, minWidth: funnel.checkoutCompletes > 0 ? '40px' : '0' }}
                              >
                                {funnel.checkoutCompletes}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                          <div className="text-center">
                            <p className="text-lg font-bold">{funnel.pageViews}</p>
                            <p className="text-xs text-muted-foreground">Views</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold">{funnel.viewToCheckoutRate.toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground">Start Rate</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold">{funnel.checkoutConversionRate.toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground">Close Rate</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminFunnelAnalytics;
