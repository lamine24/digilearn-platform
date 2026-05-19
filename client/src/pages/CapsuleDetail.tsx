/**
 * Capsule Detail Page
 * View and generate capsule videos
 */

import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CapsulePreviewModal } from '@/components/CapsulePreviewModal';
import { trpc } from '@/lib/trpc';
import {
  Play,
  Download,
  Settings,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Volume2,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

interface CapsuleDetailProps {
  capsuleId?: string;
}

/**
 * Capsule Detail Component
 */
export function CapsuleDetail() {
  const [location] = useLocation();
  const capsuleId = location.split('/').pop();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('voiceover');
  const [equalizerPreset, setEqualizerPreset] = useState('voiceover');
  const [showPreview, setShowPreview] = useState(false);

  // API queries
  const capsuleQuery = trpc.studio.getCapsule.useQuery(
    { id: capsuleId || '' },
    { enabled: !!capsuleId }
  );
  const voicesQuery = trpc.ttsAdmin.getVoices.useQuery();
  const generateMutation = trpc.studio.generateCapsuleVideo.useMutation();

  // Simulate progress updates
  useEffect(() => {
    if (!isGenerating) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 15;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleGenerateVideo = async () => {
    if (!capsuleId) {
      toast.error('Capsule ID not found');
      return;
    }

    if (!selectedVoice) {
      toast.error('Please select a voice');
      return;
    }

    setIsGenerating(true);
    setProgress(0);

    try {
      await generateMutation.mutateAsync({
        capsuleId,
        voiceId: selectedVoice,
        processingPreset: selectedPreset,
        equalizerPreset,
      });

      setProgress(100);
      toast.success('Video generation completed!');
      
      // Refresh capsule data
      await capsuleQuery.refetch();
    } catch (error) {
      toast.error('Failed to generate video');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadVideo = () => {
    if (capsuleQuery.data?.videoUrl) {
      window.open(capsuleQuery.data.videoUrl, '_blank');
      toast.success('Download started');
    }
  };

  if (capsuleQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!capsuleQuery.data) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Capsule not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const capsule = capsuleQuery.data;
  const isCompleted = capsule.status === 'completed';
  const isFailed = capsule.status === 'failed';

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">{capsule.name}</h1>
          <p className="text-muted-foreground">{capsule.description}</p>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isCompleted && <CheckCircle className="w-5 h-5 text-green-600" />}
                {isFailed && <AlertCircle className="w-5 h-5 text-red-600" />}
                {!isCompleted && !isFailed && <Clock className="w-5 h-5 text-yellow-600" />}
                <span className="font-medium">
                  {capsule.status === 'completed' && 'Completed'}
                  {capsule.status === 'failed' && 'Failed'}
                  {capsule.status === 'pending' && 'Pending'}
                  {capsule.status === 'processing' && 'Processing'}
                </span>
              </div>
              <Badge
                variant={
                  isCompleted ? 'default' : isFailed ? 'destructive' : 'secondary'
                }
              >
                {capsule.status}
              </Badge>
            </div>

            {capsule.estimatedDuration && (
              <div>
                <p className="text-sm text-muted-foreground">Estimated Duration</p>
                <p className="text-lg font-semibold">{capsule.estimatedDuration} min</p>
              </div>
            )}

            {capsule.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{capsule.error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Generation Configuration */}
        {!isCompleted && (
          <Card>
            <CardHeader>
              <CardTitle>Video Generation Settings</CardTitle>
              <CardDescription>Configure voice and audio effects</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Voice Selection */}
              <div>
                <label className="text-sm font-medium">Voice</label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {voicesQuery.data?.data?.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name} ({voice.language})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Processing Preset */}
              <div>
                <label className="text-sm font-medium">Processing Preset</label>
                <Select value={selectedPreset} onValueChange={setSelectedPreset}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="podcast">Podcast</SelectItem>
                    <SelectItem value="audiobook">Audiobook</SelectItem>
                    <SelectItem value="voiceover">Voice Over</SelectItem>
                    <SelectItem value="educational">Educational</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Equalizer Preset */}
              <div>
                <label className="text-sm font-medium">Equalizer Preset</label>
                <Select value={equalizerPreset} onValueChange={setEqualizerPreset}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bright">Bright</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="podcast">Podcast</SelectItem>
                    <SelectItem value="voiceover">Voice Over</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Progress */}
              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Generation Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowPreview(true)}
                  disabled={isGenerating}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Prévisualiser
                </Button>
                <Button
                  onClick={handleGenerateVideo}
                  disabled={isGenerating || !selectedVoice}
                  className="flex-1"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Générer Vidéo
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Video Preview */}
        {isCompleted && capsule.videoUrl && (
          <Card>
            <CardHeader>
              <CardTitle>Video Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <video
                src={capsule.videoUrl}
                controls
                className="w-full rounded-lg bg-black"
                style={{ maxHeight: '500px' }}
              />

              <Button onClick={handleDownloadVideo} className="w-full" size="lg">
                <Download className="w-4 h-4 mr-2" />
                Download Video
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Model</p>
                <p className="font-medium">{capsule.model || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Public Cible</p>
                <p className="font-medium">{capsule.publicCible || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">
                  {new Date(capsule.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Updated</p>
                <p className="font-medium">
                  {new Date(capsule.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Modal */}
        {capsuleQuery.data && (
          <CapsulePreviewModal
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            capsule={{
              id: capsuleQuery.data.id,
              name: capsuleQuery.data.name,
              description: capsuleQuery.data.description,
              model: capsuleQuery.data.model,
              publicCible: capsuleQuery.data.publicCible,
              estimatedDuration: capsuleQuery.data.estimatedDuration,
              status: capsuleQuery.data.status,
              createdAt: capsuleQuery.data.createdAt?.toString(),
              updatedAt: capsuleQuery.data.updatedAt?.toString(),
              contentStructure: capsuleQuery.data.contentStructure,
            }}
            onGenerate={handleGenerateVideo}
            isGenerating={isGenerating}
          />
        )}
      </div>
    </div>
  );
}

export default CapsuleDetail;
