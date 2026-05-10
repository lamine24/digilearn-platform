import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Upload, Zap, FileText } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function StudioProject() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [slug, setSlug] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const [isCreatingCapsule, setIsCreatingCapsule] = useState(false);

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

  // Upload document handler
  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !projectQuery.data) return;

    const file = files[0];
    const project = projectQuery.data as any;
    const projectId = project.id || project.projectId;

    if (!projectId) {
      alert("Erreur: L'ID du projet est manquant. Veuillez rafraichir la page.");
      return;
    }

    setIsUploading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", String(projectId));

      console.log("Uploading document with projectId:", projectId);
      
      // Call backend API to upload document
      const response = await fetch("/api/studio/upload-document", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `Upload failed with status ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Document uploaded successfully:", result);
      
      // Show success message
      alert(`Document "${result.fileName}" telecharge avec succes!`);
      
      // Refresh project data to show new document
      projectQuery.refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors du telechargement";
      console.error("Upload failed:", error);
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Generate scenario handler
  const handleGenerateScenario = async () => {
    if (!projectQuery.data) return;

    setIsGeneratingScenario(true);
    try {
      const project = projectQuery.data as any;
      
      // Call backend API to generate scenario using LLM
      const response = await fetch("/api/studio/generate-scenario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: project.id,
          pedagogicalModel: project.pedagogicalModel || "ADDIE",
          targetAudience: project.targetAudience,
          estimatedDuration: project.estimatedDuration,
        }),
      });

      if (!response.ok) {
        throw new Error("Scenario generation failed");
      }

      const result = await response.json();
      console.log("Scenario generated successfully:", result);
      
      // Refresh project data to show new scenario
      projectQuery.refetch();
    } catch (error) {
      console.error("Scenario generation failed:", error);
    } finally {
      setIsGeneratingScenario(false);
    }
  };

  // Create capsule handler
  const handleCreateCapsule = async () => {
    if (!projectQuery.data) return;

    setIsCreatingCapsule(true);
    try {
      const project = projectQuery.data as any;
      
      // Call backend API to create capsule video
      const response = await fetch("/api/studio/create-capsule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: project.id,
          title: project.title,
          description: project.description,
        }),
      });

      if (!response.ok) {
        throw new Error("Capsule creation failed");
      }

      const result = await response.json();
      console.log("Capsule created successfully:", result);
      
      // Redirect to capsule preview
      if (result.capsuleId) {
        setLocation(`/studio/capsule/${result.capsuleId}`);
      } else {
        projectQuery.refetch();
      }
    } catch (error) {
      console.error("Capsule creation failed:", error);
    } finally {
      setIsCreatingCapsule(false);
    }
  };

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
        <Breadcrumbs items={[
          { label: "Studio", path: "/studio" },
          { label: project.title, isActive: true }
        ]} />
        
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
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Modèle</p>
                <p className="font-semibold">{project.pedagogicalModel?.toUpperCase() || "ADDIE"}</p>
              </div>
              <div>
                <p className="text-gray-600">Public Cible</p>
                <p className="font-semibold">{project.targetAudience || "N/A"}</p>
              </div>
              <div>
                <p className="text-gray-600">Durée Estimée</p>
                <p className="font-semibold">{project.estimatedDuration || 0} min</p>
              </div>
              <div>
                <p className="text-gray-600">Statut</p>
                <p className="font-semibold capitalize">{project.status || "draft"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="mr-2 h-5 w-5 text-blue-600" />
                Documents
              </CardTitle>
              <CardDescription>
                Gérez les documents de votre projet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <input
                  type="file"
                  id="document-upload"
                  accept=".pdf,.docx,.pptx,.txt"
                  onChange={handleUploadDocument}
                  disabled={isUploading}
                  className="hidden"
                />
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  onClick={() => document.getElementById("document-upload")?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Téléchargement...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Ajouter un document
                    </>
                  )}
                </Button>
              </div>
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
                onClick={handleGenerateScenario}
                disabled={isGeneratingScenario}
              >
                {isGeneratingScenario ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Générer un scénario
                  </>
                )}
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
                <FileText className="mr-2 h-5 w-5 text-purple-600" />
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
                onClick={handleCreateCapsule}
                disabled={isCreatingCapsule}
              >
                {isCreatingCapsule ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Créer une capsule
                  </>
                )}
              </Button>
              <p className="text-sm text-gray-600 mt-4">
                Générez des vidéos interactives avec l'IA
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
