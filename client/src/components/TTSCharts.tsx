/**
 * TTS Charts and Visualizations
 * Charts for voice statistics and performance metrics
 */

import React from 'react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface VoiceStats {
  voicesByGender: Record<string, number>;
  voicesByLanguage: Record<string, number>;
}

interface PerformanceMetric {
  timestamp: number;
  cacheHitRate: number;
  errorRate: number;
  throughput: number;
  renderTime: number;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

/**
 * Voice Distribution by Gender Chart
 */
export function VoiceGenderChart({ data }: { data?: Record<string, number> }) {
  if (!data) return null;

  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voices by Gender</CardTitle>
        <CardDescription>Distribution of voices across genders</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Voice Distribution by Language Chart
 */
export function VoiceLanguageChart({ data }: { data?: Record<string, number> }) {
  if (!data) return null;

  const chartData = Object.entries(data)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Languages</CardTitle>
        <CardDescription>Voices available per language</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Performance Metrics Chart
 */
export function PerformanceMetricsChart({ data }: { data?: PerformanceMetric[] }) {
  if (!data || data.length === 0) return null;

  const chartData = data.map((metric) => ({
    time: new Date(metric.timestamp).toLocaleTimeString(),
    cacheHitRate: (metric.cacheHitRate * 100).toFixed(1),
    errorRate: (metric.errorRate * 100).toFixed(2),
    throughput: metric.throughput.toFixed(2),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Over Time</CardTitle>
        <CardDescription>Real-time performance metrics</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="cacheHitRate" stroke="#10b981" name="Cache Hit Rate %" />
            <Line type="monotone" dataKey="errorRate" stroke="#ef4444" name="Error Rate %" />
            <Line type="monotone" dataKey="throughput" stroke="#3b82f6" name="Throughput (req/s)" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * Render Time Distribution Chart
 */
export function RenderTimeChart({ data }: { data?: PerformanceMetric[] }) {
  if (!data || data.length === 0) return null;

  const chartData = data.map((metric, index) => ({
    index,
    renderTime: metric.renderTime,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Render Time Distribution</CardTitle>
        <CardDescription>Average render time in milliseconds</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="index" />
            <YAxis />
            <Tooltip formatter={(value) => `${value}ms`} />
            <Line type="monotone" dataKey="renderTime" stroke="#f59e0b" name="Render Time (ms)" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

/**
 * System Health Dashboard
 */
export function SystemHealthDashboard({
  cacheHitRate,
  errorRate,
  throughput,
  avgRenderTime,
}: {
  cacheHitRate: number;
  errorRate: number;
  throughput: number;
  avgRenderTime: number;
}) {
  const getHealthStatus = (metric: number, type: 'cache' | 'error' | 'throughput' | 'renderTime') => {
    switch (type) {
      case 'cache':
        if (metric >= 0.8) return { status: 'Excellent', color: 'text-green-600' };
        if (metric >= 0.6) return { status: 'Good', color: 'text-blue-600' };
        if (metric >= 0.4) return { status: 'Fair', color: 'text-yellow-600' };
        return { status: 'Poor', color: 'text-red-600' };
      case 'error':
        if (metric <= 0.01) return { status: 'Excellent', color: 'text-green-600' };
        if (metric <= 0.05) return { status: 'Good', color: 'text-blue-600' };
        if (metric <= 0.1) return { status: 'Fair', color: 'text-yellow-600' };
        return { status: 'Poor', color: 'text-red-600' };
      case 'throughput':
        if (metric >= 100) return { status: 'Excellent', color: 'text-green-600' };
        if (metric >= 50) return { status: 'Good', color: 'text-blue-600' };
        if (metric >= 10) return { status: 'Fair', color: 'text-yellow-600' };
        return { status: 'Poor', color: 'text-red-600' };
      case 'renderTime':
        if (metric <= 100) return { status: 'Excellent', color: 'text-green-600' };
        if (metric <= 500) return { status: 'Good', color: 'text-blue-600' };
        if (metric <= 1000) return { status: 'Fair', color: 'text-yellow-600' };
        return { status: 'Poor', color: 'text-red-600' };
      default:
        return { status: 'Unknown', color: 'text-gray-600' };
    }
  };

  const cacheHealth = getHealthStatus(cacheHitRate, 'cache');
  const errorHealth = getHealthStatus(errorRate, 'error');
  const throughputHealth = getHealthStatus(throughput, 'throughput');
  const renderTimeHealth = getHealthStatus(avgRenderTime, 'renderTime');

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health</CardTitle>
        <CardDescription>Overall system status and health indicators</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <p className="text-sm font-medium">Cache Hit Rate</p>
            <p className={`text-2xl font-bold mt-2 ${cacheHealth.color}`}>
              {(cacheHitRate * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">{cacheHealth.status}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm font-medium">Error Rate</p>
            <p className={`text-2xl font-bold mt-2 ${errorHealth.color}`}>
              {(errorRate * 100).toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">{errorHealth.status}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm font-medium">Throughput</p>
            <p className={`text-2xl font-bold mt-2 ${throughputHealth.color}`}>
              {throughput.toFixed(2)} req/s
            </p>
            <p className="text-xs text-muted-foreground mt-1">{throughputHealth.status}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <p className="text-sm font-medium">Avg Render Time</p>
            <p className={`text-2xl font-bold mt-2 ${renderTimeHealth.color}`}>
              {avgRenderTime.toFixed(0)}ms
            </p>
            <p className="text-xs text-muted-foreground mt-1">{renderTimeHealth.status}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
