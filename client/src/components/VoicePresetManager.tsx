/**
 * Voice Preset Manager
 * Manage voice configurations and presets
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { Plus, Trash2, Volume2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PresetFormData {
  id: string;
  name: string;
  voiceId: string;
  pitch: number;
  speakingRate: number;
  volumeGainDb: number;
}

/**
 * Voice Preset Manager Component
 */
export function VoicePresetManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<PresetFormData>({
    id: '',
    name: '',
    voiceId: '',
    pitch: 0,
    speakingRate: 1.0,
    volumeGainDb: 0,
  });

  // API queries
  const voicesQuery = trpc.ttsAdmin.getVoices.useQuery();
  const presetsQuery = trpc.ttsAdmin.getPresets.useQuery();
  const createPresetMutation = trpc.ttsAdmin.createPreset.useMutation();

  const handleCreatePreset = async () => {
    if (!formData.id || !formData.name || !formData.voiceId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createPresetMutation.mutateAsync({
        id: formData.id,
        name: formData.name,
        voiceId: formData.voiceId,
        pitch: formData.pitch,
        speakingRate: formData.speakingRate,
        volumeGainDb: formData.volumeGainDb,
      });

      toast.success('Preset created successfully');
      setIsOpen(false);
      setFormData({
        id: '',
        name: '',
        voiceId: '',
        pitch: 0,
        speakingRate: 1.0,
        volumeGainDb: 0,
      });
      await presetsQuery.refetch();
    } catch (error) {
      toast.error('Failed to create preset');
    }
  };

  return (
    <div className="space-y-4">
      {/* Create Preset Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Create New Preset
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Voice Preset</DialogTitle>
            <DialogDescription>Create a new voice preset with custom settings</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Preset ID */}
            <div>
              <Label htmlFor="preset-id">Preset ID</Label>
              <Input
                id="preset-id"
                placeholder="e.g., custom-professional"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              />
            </div>

            {/* Preset Name */}
            <div>
              <Label htmlFor="preset-name">Preset Name</Label>
              <Input
                id="preset-name"
                placeholder="e.g., Professional Female"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Voice Selection */}
            <div>
              <Label htmlFor="voice-select">Voice</Label>
              <Select value={formData.voiceId} onValueChange={(value) => setFormData({ ...formData, voiceId: value })}>
                <SelectTrigger id="voice-select">
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

            {/* Pitch Slider */}
            <div>
              <Label>Pitch: {formData.pitch}</Label>
              <Slider
                min={-20}
                max={20}
                step={1}
                value={[formData.pitch]}
                onValueChange={(value) => setFormData({ ...formData, pitch: value[0] })}
              />
            </div>

            {/* Speaking Rate Slider */}
            <div>
              <Label>Speaking Rate: {formData.speakingRate.toFixed(1)}x</Label>
              <Slider
                min={0.5}
                max={2.0}
                step={0.1}
                value={[formData.speakingRate]}
                onValueChange={(value) => setFormData({ ...formData, speakingRate: value[0] })}
              />
            </div>

            {/* Volume Gain Slider */}
            <div>
              <Label>Volume Gain: {formData.volumeGainDb} dB</Label>
              <Slider
                min={-10}
                max={10}
                step={0.5}
                value={[formData.volumeGainDb]}
                onValueChange={(value) => setFormData({ ...formData, volumeGainDb: value[0] })}
              />
            </div>

            {/* Create Button */}
            <Button
              onClick={handleCreatePreset}
              disabled={createPresetMutation.isPending}
              className="w-full"
            >
              {createPresetMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Preset
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Presets List */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Presets</CardTitle>
          <CardDescription>Manage your custom voice configurations</CardDescription>
        </CardHeader>
        <CardContent>
          {presetsQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : presetsQuery.data?.data && presetsQuery.data.data.length > 0 ? (
            <div className="space-y-2">
              {presetsQuery.data.data.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4" />
                    <div>
                      <p className="font-medium">{preset.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {preset.voice.name} • Pitch: {preset.pitch} • Rate: {preset.speakingRate}x • Volume: {preset.volumeGainDb} dB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{preset.id}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No presets created yet</p>
          )}
        </CardContent>
      </Card>

      {/* Voice Library */}
      <Card>
        <CardHeader>
          <CardTitle>Available Voices</CardTitle>
          <CardDescription>Browse all available voices for your presets</CardDescription>
        </CardHeader>
        <CardContent>
          {voicesQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {voicesQuery.data?.data?.map((voice) => (
                <div key={voice.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{voice.name}</p>
                      <p className="text-sm text-muted-foreground">{voice.language}</p>
                      <p className="text-xs text-muted-foreground mt-1">{voice.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="outline">{voice.gender}</Badge>
                      <Badge variant="secondary">{voice.naturalness}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default VoicePresetManager;
