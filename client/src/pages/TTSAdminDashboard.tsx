/**
 * TTS Admin Dashboard
 * Manage voices, presets, and monitor audio generation tasks
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { Loader2, Volume2, Settings, BarChart3, RefreshCw } from 'lucide-react';

interface VoiceStats {
  totalVoices: number;
  totalLanguages: number;
  totalPresets: number;
  voicesByGender: Record<string, number>;
  voicesByLanguage: Record<string, number>;
}

interface PerformanceStats {
  cacheHitRate: number;
  errorRate: number;
  throughput: number;
  averageRenderTime: number;
}

/**
 * TTS Admin Dashboard Component
 */
export function TTSAdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // API queries
  const dashboardQuery = trpc.ttsAdmin.getDashboardSummary.useQuery();
  const voicesQuery = trpc.ttsAdmin.getVoices.useQuery();
  const presetsQuery = trpc.ttsAdmin.getPresets.useQuery();
  const languagesQuery = trpc.ttsAdmin.getLanguages.useQuery();
  const performanceQuery = trpc.ttsAdmin.getPerformanceStats.useQuery();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await dashboardQuery.refetch();
    await voicesQuery.refetch();
    await presetsQuery.refetch();
    await languagesQuery.refetch();
    await performanceQuery.refetch();
    setIsRefreshing(false);
  };

  if (dashboardQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const summary = dashboardQuery.data?.data?.summary;
  const voiceStats = dashboardQuery.data?.data?.voices;
  const performanceStats = dashboardQuery.data?.data?.performance;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">TTS Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Manage voices, presets, and monitor audio generation tasks
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="lg"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Voices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.totalVoices || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary?.totalLanguages || 0} languages
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Presets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.totalPresets || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Custom configurations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((summary?.cacheHitRate || 0) * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Performance metric</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {((summary?.errorRate || 0) * 100).toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">System health</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="voices">Voices</TabsTrigger>
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
                <CardDescription>High-level statistics and metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Voices by Gender</p>
                    <div className="mt-2 space-y-1">
                      {voiceStats?.voicesByGender &&
                        Object.entries(voiceStats.voicesByGender).map(([gender, count]) => (
                          <div key={gender} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{gender}</span>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Voices by Language</p>
                    <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                      {voiceStats?.voicesByLanguage &&
                        Object.entries(voiceStats.voicesByLanguage).map(([language, count]) => (
                          <div key={language} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{language}</span>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Voices Tab */}
          <TabsContent value="voices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Available Voices</CardTitle>
                <CardDescription>
                  {voicesQuery.data?.count || 0} voices available
                </CardDescription>
              </CardHeader>
              <CardContent>
                {voicesQuery.isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {voicesQuery.data?.data?.map((voice) => (
                      <div
                        key={voice.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                      >
                        <div className="flex items-center gap-3">
                          <Volume2 className="w-4 h-4" />
                          <div>
                            <p className="font-medium">{voice.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {voice.language} - {voice.gender}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">{voice.naturalness}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Presets Tab */}
          <TabsContent value="presets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Voice Presets</CardTitle>
                <CardDescription>
                  {presetsQuery.data?.count || 0} presets configured
                </CardDescription>
              </CardHeader>
              <CardContent>
                {presetsQuery.isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {presetsQuery.data?.data?.map((preset) => (
                      <div
                        key={preset.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                      >
                        <div>
                          <p className="font-medium">{preset.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {preset.voice.name} • Pitch: {preset.pitch} • Rate: {preset.speakingRate}x
                          </p>
                        </div>
                        <Badge variant="secondary">{preset.id}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>System performance and health indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium">Cache Hit Rate</p>
                    <p className="text-2xl font-bold mt-2">
                      {((performanceStats?.cacheHitRate || 0) * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium">Error Rate</p>
                    <p className="text-2xl font-bold mt-2">
                      {((performanceStats?.errorRate || 0) * 100).toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium">Throughput</p>
                    <p className="text-2xl font-bold mt-2">
                      {(performanceStats?.throughput || 0).toFixed(2)} req/s
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm font-medium">Avg Render Time</p>
                    <p className="text-2xl font-bold mt-2">
                      {(performanceStats?.averageRenderTime || 0).toFixed(0)}ms
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default TTSAdminDashboard;
