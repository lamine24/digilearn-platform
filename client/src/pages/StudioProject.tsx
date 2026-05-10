import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Upload, Zap, FileText } from "lucide-react";

export default function StudioProject() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [slug, setSlug] = useState<string>("");

  // Redirect if not formateur or admin
  if (!authLoading && (!user || (user.role !== "formateur" && user.role !== "admin"))) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Accès Refusé</h1>
          <p className="text-muted-foreground mb-6">Seuls les formateurs et administrateurs peuvent accéder au Studio.</p>
          <Button onClick={() => setLocation("/dashboard")}>Retour au Dashboard</Button>
        </div>
      </div>
    );
  }

  // Get slug from URL
  if (!slug) {
    const path = window.location.pathname;
    const match = path.match(/\/studio\/([^/]+)/);
    if (match) {
      setSlug(match[1]);
    }
  }

  const projectQuery = trpc.studio.getProjectBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  if (!slug) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du projet...</p>
        </div>
      </div>
    );
  }

  if (projectQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du projet...</p>
        </div>
      </div>
    );
  }

  if (projectQuery.isError || !projectQuery.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-12">
          <Button
            variant="ghost"
            onClick={() => setLocation("/studio")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au Studio
          </Button>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-800">
                Erreur: Le projet n'a pas pu être chargé. Veuillez réessayer.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const project = projectQuery.data as any;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/studio")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au Studio
          </Button>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {project.title}
                </h1>
                <p className="text-gray-600">{project.description}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  project.status === "published"
                    ? "bg-green-100 text-green-800"
                    : project.status === "completed"
                      ? "bg-blue-100 text-blue-800"
                      : project.status === "in_progress"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                }`}
              >
                {project.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
              <div>
                <p className="text-sm text-gray-600">Modèle pédagogique</p>
                <p className="font-semibold text-gray-900">
                  {project.pedagogicalModel?.toUpperCase() || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Public cible</p>
                <p className="font-semibold text-gray-900">
                  {project.targetAudience || "Non spécifié"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Durée estimée</p>
                <p className="font-semibold text-gray-900">
                  {project.estimatedDuration ? `${project.estimatedDuration} min` : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Langue</p>
                <p className="font-semibold text-gray-900">
                  {project.language?.toUpperCase() || "FR"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Actions */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Documents Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-blue-600" />
                    Documents
                  </CardTitle>
                  <CardDescription>
                    Gérez les documents de votre projet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Ajouter un document
                  </Button>
                  <p className="text-sm text-gray-600 mt-4">
                    Formats supportés: PDF, DOCX, PPTX, TXT
                  </p>
                </CardContent>
              </Card>

              {/* Scenario Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="mr-2 h-5 w-5 text-amber-600" />
                    Scénario Pédagogique
                  </CardTitle>
                  <CardDescription>
                    Générez un scénario basé sur vos documents
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    variant="outline"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Générer un scénario
                  </Button>
                  <p className="text-sm text-gray-600 mt-4">
                    Modèle: {project.pedagogicalModel?.toUpperCase() || "ADDIE"}
                  </p>
                </CardContent>
              </Card>

              {/* Capsule Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Loader2 className="mr-2 h-5 w-5 text-purple-600" />
                    Capsules Vidéo
                  </CardTitle>
                  <CardDescription>
                    Créez et gérez vos capsules vidéo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    className="w-full"
                    variant="outline"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Créer une capsule
                  </Button>
                  <p className="text-sm text-gray-600 mt-4">
                    Générez des vidéos interactives avec l'IA
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Info */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Informations du Projet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">ID</p>
                  <p className="font-mono text-sm text-gray-900">{project.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Slug</p>
                  <p className="font-mono text-sm text-gray-900 break-all">
                    {project.slug}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Créé</p>
                  <p className="text-sm text-gray-900">
                    {new Date(project.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mis à jour</p>
                  <p className="text-sm text-gray-900">
                    {new Date(project.updatedAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full">
                  Éditer le projet
                </Button>
                <Button variant="outline" className="w-full">
                  Dupliquer
                </Button>
                <Button variant="destructive" className="w-full">
                  Supprimer
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
