import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, BookOpen } from "lucide-react";

interface FreeResourceCardProps {
  id: number;
  title: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  externalUrl: string;
  platform: "khan_academy" | "mit_ocw" | "statlearning" | "open_learning_campus" | "canal_u" | "other";
  category?: string;
  level?: "debutant" | "intermediaire" | "avance";
  duration?: number;
  language?: string;
  rating?: number;
  enrollmentCount?: number;
  onViewDetails?: (slug: string) => void;
}

const platformConfig: Record<string, { label: string; color: string; icon: string }> = {
  khan_academy: { label: "Khan Academy", color: "bg-blue-100 text-blue-800", icon: "📚" },
  mit_ocw: { label: "MIT OCW", color: "bg-red-100 text-red-800", icon: "🎓" },
  statlearning: { label: "StatLearning", color: "bg-purple-100 text-purple-800", icon: "📊" },
  open_learning_campus: { label: "Open Learning Campus", color: "bg-green-100 text-green-800", icon: "🌍" },
  canal_u: { label: "Canal-U", color: "bg-indigo-100 text-indigo-800", icon: "🎬" },
  other: { label: "Autre", color: "bg-gray-100 text-gray-800", icon: "📖" },
};

const levelConfig: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

export function FreeResourceCard({
  id,
  title,
  slug,
  description,
  shortDescription,
  thumbnailUrl,
  externalUrl,
  platform,
  category,
  level = "debutant",
  duration,
  language = "fr",
  rating,
  enrollmentCount,
  onViewDetails,
}: FreeResourceCardProps) {
  const platformInfo = platformConfig[platform];
  const levelLabel = levelConfig[level];

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      {thumbnailUrl && (
        <div className="h-40 bg-gradient-to-br from-blue-100 to-indigo-100 overflow-hidden">
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover hover:scale-105 transition-transform"
          />
        </div>
      )}

      <CardHeader className="flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Badge className={platformInfo.color}>
            {platformInfo.icon} {platformInfo.label}
          </Badge>
          <Badge variant="outline">{levelLabel}</Badge>
        </div>

        <CardTitle className="line-clamp-2 text-lg">{title}</CardTitle>
        {category && <CardDescription className="text-xs text-muted-foreground">{category}</CardDescription>}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3">
        {shortDescription && <p className="text-sm text-muted-foreground line-clamp-2">{shortDescription}</p>}

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {duration && <span>⏱️ {duration}h</span>}
          {language && <span>🌐 {language.toUpperCase()}</span>}
          {enrollmentCount !== undefined && <span>👥 {enrollmentCount.toLocaleString()} inscrits</span>}
          {rating && <span>⭐ {rating.toFixed(1)}/5</span>}
        </div>

        <div className="flex gap-2 mt-auto pt-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onViewDetails?.(slug)}
          >
            <BookOpen className="w-4 h-4 mr-1" />
            Détails
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={() => window.open(externalUrl, "_blank")}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Accéder
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
