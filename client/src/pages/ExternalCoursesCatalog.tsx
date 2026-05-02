import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { ExternalLink, Lock, CheckCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const SOURCE_ICONS: Record<string, string> = {
  udemy: "🎓",
  coursera: "📚",
  youtube: "▶️",
  other: "🔗",
};

const LEVEL_LABELS: Record<string, string> = {
  debutant: "Débutant",
  intermediaire: "Intermédiaire",
  avance: "Avancé",
};

export default function ExternalCoursesCatalog() {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const { data: courses, isLoading } = trpc.externalCourses.list.useQuery({
    source: selectedSource || undefined,
    level: selectedLevel || undefined,
  });

  const { data: isSubscribed } = trpc.subscriptions.isSubscribed.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const filteredCourses = courses?.filter((course: any) =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleAccessCourse = (course: any) => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    if (course.requiresSubscription && !isSubscribed) {
      window.location.href = "/subscription";
      return;
    }

    // Open external course in new tab
    window.open(course.externalUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Cours Externes</h1>
          <p className="text-lg text-muted-foreground mb-6">
            Accédez à des milliers de cours de Udemy, Coursera, YouTube et autres plateformes
          </p>

          {isAuthenticated && !isSubscribed && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                📌 <strong>Abonnement requis :</strong> Vous devez vous abonner pour accéder à ces cours.{" "}
                <Link href="/subscription" className="font-semibold underline hover:no-underline">
                  S'abonner maintenant
                </Link>
              </p>
            </div>
          )}

          {isAuthenticated && isSubscribed && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-900">
                <CheckCircle className="inline mr-2 h-4 w-4" />
                <strong>Accès illimité :</strong> Vous avez accès à tous les cours externes
              </p>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <Input
            placeholder="Rechercher un cours..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />

          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-2">
              <span className="text-sm font-semibold text-muted-foreground pt-2">Plateforme :</span>
              {["udemy", "coursera", "youtube", "other"].map((source) => (
                <Button
                  key={source}
                  variant={selectedSource === source ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSource(selectedSource === source ? null : source)}
                >
                  {SOURCE_ICONS[source]} {source.charAt(0).toUpperCase() + source.slice(1)}
                </Button>
              ))}
            </div>

            <div className="flex gap-2">
              <span className="text-sm font-semibold text-muted-foreground pt-2">Niveau :</span>
              {["debutant", "intermediaire", "avance"].map((level) => (
                <Button
                  key={level}
                  variant={selectedLevel === level ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedLevel(selectedLevel === level ? null : level)}
                >
                  {LEVEL_LABELS[level]}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Courses Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 h-64 bg-muted" />
              </Card>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground text-lg">
                {courses?.length === 0
                  ? "Aucun cours externe disponible pour le moment"
                  : "Aucun cours ne correspond à votre recherche"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course: any) => (
              <Card key={course.id} className="flex flex-col hover:shadow-lg transition-shadow">
                {course.thumbnailUrl && (
                  <div className="w-full h-40 bg-muted overflow-hidden rounded-t-lg">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <CardHeader className="flex-1">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <Badge variant="outline">
                      {SOURCE_ICONS[course.source]} {course.source}
                    </Badge>
                    {course.requiresSubscription && !isSubscribed && (
                      <Lock className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <CardDescription>{LEVEL_LABELS[course.level]}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs">
                    {course.instructor && (
                      <Badge variant="secondary">{course.instructor}</Badge>
                    )}
                    {course.duration && (
                      <Badge variant="secondary">{course.duration}h</Badge>
                    )}
                    {course.rating && (
                      <Badge variant="secondary">⭐ {course.rating}/5</Badge>
                    )}
                  </div>

                  <Button
                    onClick={() => handleAccessCourse(course)}
                    className="w-full"
                  >
                    {!isAuthenticated ? (
                      "Se connecter"
                    ) : course.requiresSubscription && !isSubscribed ? (
                      "S'abonner pour accéder"
                    ) : (
                      <>
                        Accéder au cours <ExternalLink className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
