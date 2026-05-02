import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, Users, Star, ExternalLink, Lock, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";

export function ExternalCourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Fetch course details
  const { data: course, isLoading: courseLoading, error: courseError } = trpc.externalCourses.getDetail.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  // Check subscription status
  const { data: isSubscribed } = trpc.subscriptions.isSubscribed.useQuery(undefined, { enabled: !!user });

  // Fetch similar courses
  const { data: similarCourses = [] } = trpc.externalCourses.getSimilar.useQuery(
    { courseId: course?.id || 0, limit: 3 },
    { enabled: !!course?.id }
  );

  // Fetch related courses
  const { data: relatedCourses = [] } = trpc.externalCourses.getRelated.useQuery(
    { courseId: course?.id || 0, limit: 3 },
    { enabled: !!course?.id }
  );

  if (courseLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement du cours...</p>
        </div>
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Le cours demandé n'a pas été trouvé.</AlertDescription>
          </Alert>
          <Button onClick={() => setLocation("/external-courses")} className="mt-4">
            Retour au catalogue
          </Button>
        </div>
      </div>
    );
  }

  const handleAccessCourse = () => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }

    if (course.requiresSubscription && !isSubscribed) {
      setLocation("/subscription");
      return;
    }

    // Redirect to external course
    setIsRedirecting(true);
    window.open(course.externalUrl, "_blank");
  };

  const platformIcons: Record<string, string> = {
    udemy: "🎓",
    coursera: "📚",
    youtube: "▶️",
    other: "🔗",
  };

  const platformNames: Record<string, string> = {
    udemy: "Udemy",
    coursera: "Coursera",
    youtube: "YouTube",
    other: "Autre plateforme",
  };

  const levelLabels: Record<string, string> = {
    debutant: "Débutant",
    intermediaire: "Intermédiaire",
    avance: "Avancé",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-3xl">{platformIcons[course.source]}</span>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  {platformNames[course.source]}
                </Badge>
              </div>
              <h1 className="text-4xl font-bold mb-3">{course.title}</h1>
              <p className="text-blue-100 text-lg">{course.shortDescription}</p>
            </div>
            {course.thumbnailUrl && (
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-48 h-48 object-cover rounded-lg shadow-lg"
              />
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-blue-100 text-sm">Niveau</div>
              <div className="font-semibold">{levelLabels[course.level]}</div>
            </div>
            <div>
              <div className="text-blue-100 text-sm">Durée</div>
              <div className="font-semibold flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {course.duration} heures
              </div>
            </div>
            <div>
              <div className="text-blue-100 text-sm">Évaluation</div>
              <div className="font-semibold flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-300" />
                {course.rating}/5
              </div>
            </div>
            <div>
              <div className="text-blue-100 text-sm">Inscriptions</div>
              <div className="font-semibold flex items-center gap-1">
                <Users className="h-4 w-4" />
                {course.enrollmentCount?.toLocaleString() || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Course Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>À propos du cours</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {course.description}
                </p>
              </CardContent>
            </Card>

            {/* Instructor */}
            {course.instructor && (
              <Card>
                <CardHeader>
                  <CardTitle>Instructeur</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                      {course.instructor.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{course.instructor}</p>
                      <p className="text-sm text-muted-foreground">Instructeur certifié</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Similar Courses */}
            {similarCourses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Cours similaires</CardTitle>
                  <CardDescription>Basés sur le même niveau de compétence</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {similarCourses.map((similar: any) => (
                      <div
                        key={similar.id}
                        onClick={() => setLocation(`/external-course/${similar.slug}`)}
                        className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      >
                        <p className="font-medium text-sm">{similar.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{platformNames[similar.source]}</span>
                          <span>•</span>
                          <span>{similar.duration} heures</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Courses */}
            {relatedCourses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Autres cours sur {platformNames[course.source]}</CardTitle>
                  <CardDescription>De la même plateforme</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {relatedCourses.map((related: any) => (
                      <div
                        key={related.id}
                        onClick={() => setLocation(`/external-course/${related.slug}`)}
                        className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      >
                        <p className="font-medium text-sm">{related.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400" />
                            {related.rating}/5
                          </span>
                          <span>•</span>
                          <span>{related.duration} heures</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - CTA */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Accéder au cours</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Subscription Alert */}
                {course.requiresSubscription && !isSubscribed && (
                  <Alert>
                    <Lock className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Abonnement requis pour accéder à ce cours
                    </AlertDescription>
                  </Alert>
                )}

                {/* Subscription Status */}
                {isSubscribed && (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700 font-medium">Accès déverrouillé</span>
                  </div>
                )}

                {/* Main CTA */}
                <Button
                  onClick={handleAccessCourse}
                  disabled={isRedirecting}
                  className="w-full h-12 text-base"
                  size="lg"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {isRedirecting ? "Redirection..." : "Accéder au cours"}
                </Button>

                {/* Subscription CTA */}
                {course.requiresSubscription && !isSubscribed && (
                  <Button
                    onClick={() => setLocation("/subscription")}
                    variant="outline"
                    className="w-full"
                  >
                    S'abonner maintenant
                  </Button>
                )}

                {/* Course Info */}
                <div className="space-y-3 pt-4 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Plateforme</p>
                    <p className="font-medium">{platformNames[course.source]}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Niveau</p>
                    <p className="font-medium">{levelLabels[course.level]}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Durée estimée</p>
                    <p className="font-medium">{course.duration} heures</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Évaluation</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{course.rating}/5</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
