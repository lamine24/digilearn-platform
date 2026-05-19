/**
 * Capsule Preview Modal Component
 * Display capsule content before generation
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock,
  FileText,
  Users,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';

export interface CapsuleContent {
  id: string;
  name: string;
  description?: string;
  model?: string;
  publicCible?: string;
  estimatedDuration?: number;
  sections?: Array<{
    id: string;
    title: string;
    content: string;
    duration?: number;
  }>;
  contentStructure?: {
    narration?: string;
    sections?: Array<{
      title: string;
      content: string;
    }>;
  };
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CapsulePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  capsule: CapsuleContent | null;
  onGenerate?: () => void;
  isGenerating?: boolean;
}

/**
 * Capsule Preview Modal Component
 */
export function CapsulePreviewModal({
  isOpen,
  onClose,
  capsule,
  onGenerate,
  isGenerating = false,
}: CapsulePreviewModalProps) {
  if (!capsule) return null;

  const sections = capsule.sections || capsule.contentStructure?.sections || [];
  const narration = capsule.contentStructure?.narration || '';

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    if (minutes < 1) return `${Math.round(minutes * 60)}s`;
    return `${minutes}min`;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="text-2xl">{capsule.name}</DialogTitle>
          <DialogDescription className="text-base mt-2">
            {capsule.description || 'Prévisualisation du contenu de la capsule'}
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Durée estimée</span>
                </div>
                <p className="font-semibold text-lg">
                  {formatDuration(capsule.estimatedDuration)}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BookOpen className="w-4 h-4" />
                  <span>Modèle</span>
                </div>
                <p className="font-semibold text-lg">
                  {capsule.model || 'N/A'}
                </p>
              </div>

              {capsule.publicCible && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>Public cible</span>
                  </div>
                  <p className="font-semibold">{capsule.publicCible}</p>
                </div>
              )}

              {capsule.status && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Statut</span>
                  </div>
                  <Badge className={getStatusColor(capsule.status)}>
                    {capsule.status}
                  </Badge>
                </div>
              )}
            </div>

            {/* Narration */}
            {narration && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Narration
                </h3>
                <div className="bg-muted p-4 rounded-lg text-sm leading-relaxed max-h-40 overflow-y-auto">
                  {narration}
                </div>
              </div>
            )}

            {/* Sections */}
            {sections.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Sections ({sections.length})
                </h3>
                <div className="space-y-3">
                  {sections.map((section, index) => (
                    <div
                      key={section.id || index}
                      className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm">
                          {index + 1}. {section.title || 'Section sans titre'}
                        </h4>
                        {section.duration && (
                          <Badge variant="outline" className="text-xs">
                            {section.duration}s
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {section.content || 'Pas de contenu'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {sections.length === 0 && !narration && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Aucun contenu disponible pour cette capsule
                </p>
              </div>
            )}

            {/* Metadata Footer */}
            <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
              {capsule.createdAt && (
                <p>Créée le: {new Date(capsule.createdAt).toLocaleDateString('fr-FR')}</p>
              )}
              {capsule.updatedAt && (
                <p>Mise à jour: {new Date(capsule.updatedAt).toLocaleDateString('fr-FR')}</p>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isGenerating}
          >
            Fermer
          </Button>
          {onGenerate && (
            <Button
              onClick={onGenerate}
              disabled={isGenerating}
              className="bg-primary hover:bg-primary/90"
            >
              {isGenerating ? 'Génération en cours...' : 'Générer la vidéo'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CapsulePreviewModal;
