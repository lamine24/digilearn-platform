import { useState } from "react";
import { X, Play, Clock, BarChart3, User, Star, Share2, Heart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CoursePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    id: number;
    title: string;
    description: string;
    shortDescription: string;
    thumbnailUrl: string;
    externalUrl: string;
    instructor?: string;
    duration: number;
    level: string;
    rating: number;
    enrollmentCount: number;
    source?: string;
    categoryId?: number;
    tags?: string;
  };
  onEnroll?: () => void;
  onAddToFavorites?: () => void;
  isFavorited?: boolean;
}

export function CoursePreviewModal({
  isOpen,
  onClose,
  course,
  onEnroll,
  onAddToFavorites,
  isFavorited = false,
}: CoursePreviewModalProps) {
  const [videoError, setVideoError] = useState(false);

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "debutant":
        return "bg-green-100 text-green-800";
      case "intermediaire":
        return "bg-blue-100 text-blue-800";
      case "avance":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level.toLowerCase()) {
      case "debutant":
        return "Débutant";
      case "intermediaire":
        return "Intermédiaire";
      case "avance":
        return "Avancé";
      default:
        return level;
    }
  };

  const extractVideoId = (url: string) => {
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(youtubeRegex);
    return match ? match[1] : null;
  };

  const videoId = extractVideoId(course.externalUrl);
  const videoUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="relative">
          <DialogTitle className="text-2xl">{course.title}</DialogTitle>
          <button
            onClick={onClose}
            className="absolute right-0 top-0 p-1 hover:bg-muted rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="space-y-6">
          {/* Video Preview */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {videoUrl && !videoError ? (
              <iframe
                src={videoUrl}
                className="w-full h-full"
                allowFullScreen
                onError={() => setVideoError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                    <Play className="w-12 h-12 text-white fill-white" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Course Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Durée</p>
                <p className="font-semibold">{course.duration}h</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Niveau</p>
                <p className="font-semibold">{getLevelLabel(course.level)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <div>
                <p className="text-xs text-muted-foreground">Évaluation</p>
                <p className="font-semibold">{course.rating.toFixed(1)}/5</p>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <User className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Inscrits</p>
                <p className="font-semibold">{(course.enrollmentCount / 1000).toFixed(1)}k</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Aperçu</TabsTrigger>
              <TabsTrigger value="details">Détails</TabsTrigger>
              <TabsTrigger value="reviews">Avis</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-3">
              <div>
                <h3 className="font-semibold mb-2">À propos du cours</h3>
                <p className="text-sm text-muted-foreground">{course.description}</p>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-3">
              <div>
                <h3 className="font-semibold mb-2">Informations</h3>
                <div className="space-y-2 text-sm">
                  {course.instructor && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Instructeur:</span>
                      <span className="font-medium">{course.instructor}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Niveau:</span>
                    <Badge className={getLevelColor(course.level)}>
                      {getLevelLabel(course.level)}
                    </Badge>
                  </div>
                  {course.tags && (
                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground">Tags:</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {course.tags.split(",").map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(course.rating)
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-semibold">{course.rating.toFixed(1)}/5</span>
                <span className="text-sm text-muted-foreground">
                  ({course.enrollmentCount.toLocaleString()} avis)
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Les avis des utilisateurs seront affichés ici. Ce cours a reçu une excellente
                évaluation de la part de {course.enrollmentCount.toLocaleString()} utilisateurs.
              </p>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={onEnroll}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              S'inscrire au cours
            </Button>
            <Button
              onClick={onAddToFavorites}
              variant={isFavorited ? "default" : "outline"}
              size="icon"
            >
              <Heart className={`w-5 h-5 ${isFavorited ? "fill-current" : ""}`} />
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
