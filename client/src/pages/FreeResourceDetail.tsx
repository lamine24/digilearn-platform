import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { BackButton } from "@/components/BackButton";
import { SocialShareButton } from "@/components/SocialShareButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink, BookOpen, Clock, Users, Star } from "lucide-react";
import { platformConfig, levelConfig, getPlatformConfig, getLevelLabel } from "@/lib/platformConfig";

export function FreeResourceDetail() {
  const params = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const slug = params?.slug || "";

  const { data: resource, isLoading } = trpc.freeResources.getBySlug.useQuery({ slug });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Ressource non trouvée</h1>
            <Button onClick={() => navigate("/free-resources")}>Retour aux ressources</Button>
          </div>
        </div>
      </div>
    );
  }

  const platformInfo = getPlatformConfig(resource.platform);
  const levelLabel = getLevelLabel(resource.level);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <BackButton label="Retour aux ressources" />
        </div>

        {/* Header Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={platformInfo.color}>{platformInfo.label}</Badge>
                  <Badge variant="outline">{levelLabel}</Badge>
                </div>
                <CardTitle className="text-3xl mb-2">{resource.title}</CardTitle>
                <CardDescription className="text-base">{resource.category}</CardDescription>
              </div>
            </div>
          </CardHeader>

          {resource.thumbnailUrl && (
            <div className="px-6 mb-4">
              <img
                src={resource.thumbnailUrl}
                alt={resource.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}

          <CardContent className="space-y-6">
            {/* Description */}
            {resource.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{resource.description}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {resource.duration && (
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Durée</p>
                    <p className="font-semibold text-gray-900">{resource.duration}h</p>
                  </div>
                </div>
              )}
              {resource.language && (
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Langue</p>
                    <p className="font-semibold text-gray-900">{resource.language.toUpperCase()}</p>
                  </div>
                </div>
              )}
              {resource.enrollmentCount && (
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Inscrits</p>
                    <p className="font-semibold text-gray-900">{(resource.enrollmentCount as number).toLocaleString()}</p>
                  </div>
                </div>
              )}
              {resource.rating && (
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <div>
                    <p className="text-xs text-gray-500">Note</p>
                    <p className="font-semibold text-gray-900">{(typeof resource.rating === 'number' ? resource.rating : parseFloat(resource.rating as string)).toFixed(1)}/5</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            {resource.tags && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {resource.tags.split(",").map((tag: string) => (
                    <Badge key={tag.trim()} variant="secondary">
                      {tag.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="pt-4 border-t space-y-3">
              <Button
                size="lg"
                className="w-full"
                onClick={() => window.open(resource.externalUrl, "_blank")}
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Accéder à la ressource
              </Button>
              <SocialShareButton
                title={resource.title}
                description={resource.shortDescription || ""}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
