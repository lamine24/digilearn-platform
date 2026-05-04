import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, BookOpen } from "lucide-react";
import { platformConfig, levelConfig, getPlatformConfig, getLevelLabel } from "@/lib/platformConfig";

interface FreeResourceCardProps {
  id: number;
  title: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  externalUrl: string;
  platform: "khan_academy" | "mit_ocw" | "statlearning" | "open_learning_campus" | "canal_u" | "openlearn" | "saylor_academy" | "auf" | "unesco_oer" | "bookdown" | "fun_mooc" | "other";
  category?: string;
  level?: "debutant" | "intermediaire" | "avance";
  duration?: number;
  language?: string;
  rating?: number;
  enrollmentCount?: number;
  onViewDetails?: (slug: string) => void;
}

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
  const platformInfo = getPlatformConfig(platform);
  const levelLabel = getLevelLabel(level);
  
  // Normalize numeric values from DB (may come as strings)
  const ratingNum = typeof rating === 'number' ? rating : rating ? Number(rating) : null;
  const enrollmentNum = typeof enrollmentCount === 'number' ? enrollmentCount : enrollmentCount ? Number(enrollmentCount) : null;
  const durationNum = typeof duration === 'number' ? duration : duration ? Number(duration) : null;

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
          <Badge className={platformInfo?.color || "bg-gray-100 text-gray-800"}>
            {platformInfo?.icon || "📖"} {platformInfo?.label || "Ressource"}
          </Badge>
          <Badge variant="outline">{levelLabel}</Badge>
        </div>

        <CardTitle className="line-clamp-2 text-lg">{title}</CardTitle>
        {category && <CardDescription className="text-xs text-muted-foreground">{category}</CardDescription>}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3">
        {shortDescription && <p className="text-sm text-muted-foreground line-clamp-2">{shortDescription}</p>}

        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {durationNum != null && !Number.isNaN(durationNum) && <span>⏱️ {durationNum}h</span>}
          {language && <span>🌐 {language.toUpperCase()}</span>}
          {enrollmentNum != null && !Number.isNaN(enrollmentNum) && <span>👥 {enrollmentNum.toLocaleString()} inscrits</span>}
          {ratingNum != null && !Number.isNaN(ratingNum) && <span>⭐ {ratingNum.toFixed(1)}/5</span>}
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
