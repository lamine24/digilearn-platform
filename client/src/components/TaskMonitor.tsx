/**
 * Task Monitor
 * Real-time monitoring of audio generation tasks
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock, Loader2, Trash2, RefreshCw } from 'lucide-react';

interface Task {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: number;
  endTime?: number;
  error?: string;
  metadata?: Record<string, any>;
}

interface TaskMonitorProps {
  tasks?: Task[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

/**
 * Get status badge color
 */
function getStatusColor(status: Task['status']): string {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'processing':
      return 'bg-blue-100 text-blue-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get status icon
 */
function getStatusIcon(status: Task['status']) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'processing':
      return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
    case 'pending':
      return <Clock className="w-4 h-4 text-yellow-600" />;
    case 'failed':
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    default:
      return null;
  }
}

/**
 * Format duration
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/**
 * Task Monitor Component
 */
export function TaskMonitor({ tasks = [], isLoading = false, onRefresh }: TaskMonitorProps) {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const activeTasks = tasks.filter((t) => t.status === 'processing' || t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const failedTasks = tasks.filter((t) => t.status === 'failed');

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{failedTasks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          onClick={onRefresh}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Tasks</CardTitle>
            <CardDescription>Currently processing {activeTasks.length} task(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeTasks.map((task) => (
              <div
                key={task.id}
                className="p-4 border rounded-lg cursor-pointer hover:bg-accent"
                onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(task.status)}
                    <span className="font-medium">{task.name}</span>
                  </div>
                  <Badge className={getStatusColor(task.status)}>
                    {task.status}
                  </Badge>
                </div>

                <Progress value={task.progress} className="mb-2" />

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{task.progress}% complete</span>
                  <span>
                    {formatDuration(Date.now() - task.startTime)} elapsed
                  </span>
                </div>

                {expandedTaskId === task.id && task.metadata && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    {Object.entries(task.metadata).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium">{key}:</span>
                        <span className="text-muted-foreground ml-2">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed Tasks</CardTitle>
            <CardDescription>{completedTasks.length} task(s) completed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">{task.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.endTime ? formatDuration(task.endTime - task.startTime) : 'N/A'}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">Completed</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Failed Tasks */}
      {failedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Failed Tasks</CardTitle>
            <CardDescription>{failedTasks.length} task(s) failed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {failedTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 border rounded-lg hover:bg-accent cursor-pointer"
                onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <div>
                      <p className="font-medium text-sm">{task.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {task.error || 'Unknown error'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="destructive">Failed</Badge>
                </div>

                {expandedTaskId === task.id && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium mb-2">Error Details:</p>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                      {task.error}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {tasks.length === 0 && !isLoading && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">No tasks to display</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <p className="text-muted-foreground">Loading tasks...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default TaskMonitor;
