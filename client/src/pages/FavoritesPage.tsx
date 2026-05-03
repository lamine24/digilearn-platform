import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { Heart, Trash2, ExternalLink } from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";

export default function FavoritesPage() {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("all");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Mes Favoris</h1>
          <p className="text-muted-foreground mb-6">Connectez-vous pour voir vos cours favoris</p>
          <Button asChild>
            <a href="/login">Se connecter</a>
          </Button>
        </div>
      </div>
    );
  }

  // Fetch all favorites
  const { data: favData, isLoading: allLoading } = trpc.favorites.list.useQuery();
  const allFavorites = favData?.favorites || [];

  // Fetch favorite internal courses
  const { data: internalData, isLoading: internalLoading } = trpc.favorites.listCourses.useQuery();
  const internalCourses = internalData?.courses || [];

  // Fetch favorite external courses
  const { data: externalData, isLoading: externalLoading } = trpc.favorites.listExternalCourses.useQuery();
  const externalCourses = externalData?.courses || [];

  // Get count
  const { data: countData } = trpc.favorites.count.useQuery();
  const count = countData?.count || 0;

  const isLoading = allLoading || internalLoading || externalLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement de vos favoris...</p>
        </div>
      </div>
    );
  }

  const renderCourseCard = (course: any, type: "internal" | "external") => {
    if (type === "internal") {
      return (
        <Card key={`internal-${course.course_id}`} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <CardTitle className="text-lg">{course.title}</CardTitle>
                <CardDescription>{course.formateurName}</CardDescription>
              </div>
              <FavoriteButton
                courseId={course.course_id}
                courseType="internal"
                size="sm"
                variant="ghost"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Badge variant="outline">{course.level}</Badge>
              <Badge variant="outline">{course.price} XOF</Badge>
            </div>
            <Button asChild className="w-full">
              <Link href={`/course/${course.slug}`}>Voir le cours</Link>
            </Button>
          </CardContent>
        </Card>
      );
    } else {
      return (
        <Card key={`external-${course.external_course_id}`} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                <CardTitle className="text-lg">{course.external_title}</CardTitle>
                <CardDescription>{course.instructor}</CardDescription>
              </div>
              <FavoriteButton
                externalCourseId={course.external_course_id}
                courseType="external"
                size="sm"
                variant="ghost"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Badge variant="outline">{course.external_level}</Badge>
              {course.rating && (
                <Badge variant="outline">⭐ {course.rating.toFixed(1)}</Badge>
              )}
            </div>
            <Button asChild className="w-full">
              <Link href={`/external-course/${course.external_slug}`}>Voir le cours</Link>
            </Button>
          </CardContent>
        </Card>
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="h-8 w-8 text-red-500 fill-current" />
            <h1 className="text-4xl font-bold">Mes Favoris</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            {count === 0 ? "Vous n'avez pas encore de favoris" : `Vous avez ${count} cours en favoris`}
          </p>
        </div>

        {/* Empty State */}
        {count === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg mb-6">
                Explorez nos cours et ajoutez vos favoris en cliquant sur l'icône cœur
              </p>
              <Button asChild>
                <Link href="/catalog">Découvrir les cours</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Tous ({count})</TabsTrigger>
              <TabsTrigger value="internal">Cours internes ({(internalCourses as any[]).length})</TabsTrigger>
              <TabsTrigger value="external">Cours externes ({(externalCourses as any[]).length})</TabsTrigger>
            </TabsList>

            {/* All Favorites */}
            <TabsContent value="all" className="space-y-6">
              {allFavorites.length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <p className="text-muted-foreground">Aucun favori pour le moment</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allFavorites.map((fav: any) =>
                    fav.courseType === "internal"
                      ? renderCourseCard(fav, "internal")
                      : renderCourseCard(fav, "external")
                  )}
                </div>
              )}
            </TabsContent>

            {/* Internal Courses */}
            <TabsContent value="internal" className="space-y-6">
              {internalCourses.length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <p className="text-muted-foreground">Aucun cours interne en favoris</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {internalCourses.map((course: any) => renderCourseCard(course, "internal"))}
                </div>
              )}
            </TabsContent>

            {/* External Courses */}
            <TabsContent value="external" className="space-y-6">
              {externalCourses.length === 0 ? (
                <Card className="text-center py-8">
                  <CardContent>
                    <p className="text-muted-foreground">Aucun cours externe en favoris</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {externalCourses.map((course: any) => renderCourseCard(course, "external"))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
