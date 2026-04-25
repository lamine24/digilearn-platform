import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Eye, X, FileText, Music, Image as ImageIcon, Link as LinkIcon, Video } from "lucide-react";

interface ResourcePreviewProps {
  resource: {
    id: number;
    title: string;
    description?: string;
    resourceType: "video" | "pdf" | "document" | "image" | "audio" | "lien" | "autre";
    fileUrl?: string;
    mimeType?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResourcePreview({ resource, open, onOpenChange }: ResourcePreviewProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getIcon = () => {
    switch (resource.resourceType) {
      case "video":
        return <Video className="w-6 h-6" />;
      case "pdf":
        return <FileText className="w-6 h-6" />;
      case "document":
        return <FileText className="w-6 h-6" />;
      case "image":
        return <ImageIcon className="w-6 h-6" />;
      case "audio":
        return <Music className="w-6 h-6" />;
      case "lien":
        return <LinkIcon className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  const getTypeLabel = () => {
    const labels: Record<string, string> = {
      video: "Vidéo",
      pdf: "PDF",
      document: "Document",
      image: "Image",
      audio: "Audio",
      lien: "Lien",
      autre: "Autre",
    };
    return labels[resource.resourceType] || resource.resourceType;
  };

  const renderPreview = () => {
    switch (resource.resourceType) {
      case "video":
        return (
          <div className="w-full bg-black rounded-lg overflow-hidden">
            <video
              controls
              className="w-full h-auto max-h-96"
              onLoadStart={() => setIsLoading(true)}
              onLoadedData={() => setIsLoading(false)}
            >
              <source src={resource.fileUrl} />
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          </div>
        );
      case "image":
        return (
          <div className="w-full bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={resource.fileUrl}
              alt={resource.title}
              className="w-full h-auto max-h-96 object-contain"
              onLoad={() => setIsLoading(false)}
              onLoadStart={() => setIsLoading(true)}
            />
          </div>
        );
      case "audio":
        return (
          <div className="w-full bg-gray-100 rounded-lg p-6">
            <audio controls className="w-full">
              <source src={resource.fileUrl} />
              Votre navigateur ne supporte pas la lecture audio.
            </audio>
          </div>
        );
      case "pdf":
        return (
          <div className="w-full bg-gray-100 rounded-lg p-6 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">Aperçu PDF</p>
            <Button
              variant="outline"
              onClick={() => window.open(resource.fileUrl, "_blank")}
            >
              <Eye className="w-4 h-4 mr-2" />
              Ouvrir le PDF
            </Button>
          </div>
        );
      case "document":
        return (
          <div className="w-full bg-gray-100 rounded-lg p-6 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">Document</p>
            <Button
              variant="outline"
              onClick={() => window.open(resource.fileUrl, "_blank")}
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
          </div>
        );
      case "lien":
        return (
          <div className="w-full bg-blue-50 rounded-lg p-6 border border-blue-200">
            <LinkIcon className="w-8 h-8 mb-4 text-blue-600" />
            <p className="text-sm text-gray-600 mb-4">Lien externe</p>
            <a
              href={resource.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all text-sm"
            >
              {resource.fileUrl}
            </a>
            <Button
              className="w-full mt-4"
              onClick={() => window.open(resource.fileUrl, "_blank")}
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              Ouvrir le lien
            </Button>
          </div>
        );
      default:
        return (
          <div className="w-full bg-gray-100 rounded-lg p-6 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Type de ressource non prévisualisable</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              {getIcon()}
              <div>
                <DialogTitle>{resource.title}</DialogTitle>
                <Badge className="mt-2">{getTypeLabel()}</Badge>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          {resource.description && (
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Description</h4>
              <p className="text-sm text-gray-600">{resource.description}</p>
            </div>
          )}

          <div>
            <h4 className="font-semibold text-sm text-gray-700 mb-4">Aperçu</h4>
            {isLoading && (
              <div className="w-full bg-gray-100 rounded-lg p-6 text-center">
                <div className="animate-spin inline-block">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full"></div>
                </div>
              </div>
            )}
            {renderPreview()}
          </div>

          {resource.mimeType && (
            <div className="text-xs text-gray-500 pt-2 border-t">
              Type MIME: {resource.mimeType}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Fermer
          </Button>
          {resource.fileUrl && (
            <Button
              className="flex-1"
              onClick={() => {
                const link = document.createElement("a");
                link.href = resource.fileUrl!;
                link.download = resource.title;
                link.click();
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
