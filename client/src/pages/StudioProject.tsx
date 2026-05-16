import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Upload, Zap, FileText, Trash2 } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ScenarioPreviewModal } from "@/components/ScenarioPreviewModal";
import { ScenarioEditor } from "@/components/ScenarioEditor";
import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function StudioProject() {
  // All hooks MUST be called at the top level, before any conditional returns
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { slug: urlSlug } = useParams();
  const [slug, setSlug] = useState<string>(urlSlug || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const [isCreatingCapsule, setIsCreatingCapsule] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewScenario, setPreviewScenario] = useState<any>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [editingScenarioId, setEditingScenarioId] = useState<number | null>(null);
  const [editingScenario, setEditingScenario] = useState<any>(null);

  const projectQuery = trpc.studio.getProjectBySlug.useQuery(
    { slug },
    { enabled: !!slug }
  );

  const documentsQuery = trpc.studio.getProjectDocuments.useQuery(
    { projectId: projectQuery.data?.id || 0 },
    { enabled: !!projectQuery.data?.id }
  );

  const deleteProjectMutation = trpc.studio.deleteProject.useMutation();
  const deleteDocumentMutation = trpc.studio.deleteDocument.useMutation();
  const deleteScenarioMutation = trpc.studio.deleteScenario.useMutation();
  const updateScenarioMutation = trpc.studio.updateScenario.useMutation();
  const updateScenarioContentMutation = trpc.studio.updateScenarioContent.useMutation();
  const exportScenarioMutation = trpc.studio.exportScenario.useMutation();
  const createCapsuleMutation = trpc.studio.createCapsule.useMutation();

  const scenariosQuery = trpc.studio.getProjectScenarios.useQuery(
    { projectId: projectQuery.data?.id || 0 },
    { enabled: !!projectQuery.data?.id }
  );

  const capsulesQuery = trpc.studio.getProjectCapsules.useQuery(
    { projectId: projectQuery.data?.id || 0 },
    { enabled: !!projectQuery.data?.id }
  );

  // Sync slug from URL params
  useEffect(() => {
    if (urlSlug && urlSlug !== slug) {
      setSlug(decodeURIComponent(urlSlug));
    }
  }, [urlSlug, slug]);

  // Preview scenario mutation
  const previewScenarioMutation = trpc.studio.previewScenario.useMutation();

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

  // Preview scenario handler
  const handlePreviewScenario = async () => {
    if (!projectQuery.data) return;

    setIsPreviewLoading(true);
    try {
      const project = projectQuery.data as any;
      const result = await previewScenarioMutation.mutateAsync({
        projectId: project.id,
        pedagogicalModel: (project.pedagogicalModel || "professional") as any,
        targetAudience: project.targetAudience,
        estimatedDuration: project.estimatedDuration,
      });

      if (result.success && result.preview) {
        setPreviewScenario(result.preview);
        setShowPreview(true);
      }
    } catch (error) {
      console.error("Preview generation failed:", error);
      const errorMessage = (error as Error).message || "Erreur lors de la génération de l'aperçu";
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Generate scenario handler (now uses preview)
  const handleGenerateScenario = async () => {
    await handlePreviewScenario();
  };

  // Delete project handler
  const handleDeleteProject = async () => {
    if (!projectQuery.data) return;
    
    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible."
    );
    if (!confirmed) return;

    try {
      const project = projectQuery.data as any;
      await deleteProjectMutation.mutateAsync({ projectId: project.id });
      alert("Projet supprimé avec succès");
      setLocation("/studio");
    } catch (error) {
      console.error("Delete project failed:", error);
      alert("Erreur lors de la suppression du projet");
    }
  };

  // Delete document handler
  const handleDeleteDocument = async (documentId: number, fileName: string) => {
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer "${fileName}" ? Cette action est irréversible.`
    );
    if (!confirmed) return;

    try {
      await deleteDocumentMutation.mutateAsync({ documentId });
      documentsQuery.refetch();
      alert("Document supprimé avec succès");
    } catch (error) {
      console.error("Delete document failed:", error);
      alert("Erreur lors de la suppression du document");
    }
  };

  // Create capsule handler
  const handleCreateCapsule = async () => {
    if (!projectQuery.data || !scenariosQuery.data?.length) return;

    const project = projectQuery.data as any;
    const firstScenario = scenariosQuery.data[0] as any;
    
    try {
      const result = await createCapsuleMutation.mutateAsync({
        projectId: project.id,
        scenarioId: firstScenario.id,
        title: `Capsule ${new Date().toLocaleDateString()}`,
        description: "Nouvelle capsule vidéo",
      });

      console.log("Capsule created successfully:", result);
      
      // Redirect to capsule preview
      if (result.capsule?.id) {
        setLocation(`/studio/capsule/${result.capsule.id}`);
      } else {
        capsulesQuery.refetch();
      }
    } catch (error) {
      console.error("Capsule creation failed:", error);
      alert("Erreur lors de la création de la capsule: " + (error instanceof Error ? error.message : "Erreur inconnue"));
    }
  };

  const handleExportScenario = async (scenarioId: number, format: 'pdf' | 'docx') => {
    try {
      const result = await exportScenarioMutation.mutateAsync({
        scenarioId,
        format,
      });

      if (result.success && result.buffer) {
        const binaryString = atob(result.buffer);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], {
          type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Erreur lors de l\'export du scenario');
    }
  };

  // Render loading state while extracting slug
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

  // Render auth check - Allow admin and formateur roles
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

  // Render loading state while fetching project
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

  // Render error state
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
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteProject}
                disabled={deleteProjectMutation.isPending}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
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
                      Télécharger Document
                    </>
                  )}
                </Button>
              </div>

              {documentsQuery.data && documentsQuery.data.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Documents ({documentsQuery.data.length})</p>
                  {documentsQuery.data.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div className="flex items-center flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                        <span className="text-sm text-gray-700 truncate">{doc.filename}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDocument(doc.id, doc.filename)}
                        disabled={deleteDocumentMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Scenario Generation Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="mr-2 h-5 w-5 text-yellow-600" />
                Scénario
              </CardTitle>
              <CardDescription>
                Générez un scénario pédagogique
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
                onClick={handleGenerateScenario}
                disabled={isGeneratingScenario || isPreviewLoading}
              >
                {isPreviewLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Générer Scénario
                  </>
                )}
              </Button>

              {scenariosQuery.data && scenariosQuery.data.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Scénarios ({scenariosQuery.data.length})</p>
                  {scenariosQuery.data.map((scenario: any) => (
                    <div key={scenario.id} className="bg-gray-50 p-3 rounded mb-2">
                      <p className="text-sm font-medium text-gray-800">{scenario.title}</p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExportScenario(scenario.id, 'pdf')}
                          disabled={exportScenarioMutation.isPending}
                        >
                          PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleExportScenario(scenario.id, 'docx')}
                          disabled={exportScenarioMutation.isPending}
                        >
                          DOCX
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                Créez des capsules vidéo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={handleCreateCapsule}
                disabled={isCreatingCapsule || !scenariosQuery.data?.length}
              >
                {isCreatingCapsule ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Créer Capsule
                  </>
                )}
              </Button>

              {capsulesQuery.data && capsulesQuery.data.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Capsules ({capsulesQuery.data.length})</p>
                  {capsulesQuery.data.map((capsule: any) => (
                    <div key={capsule.id} className="bg-gray-50 p-3 rounded mb-2">
                      <p className="text-sm font-medium text-gray-800">{capsule.title}</p>
                      <p className="text-xs text-gray-600 mt-1">Statut: {capsule.videoStatus}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview Modal */}
        {showPreview && previewScenario && (
          <ScenarioPreviewModal
            scenario={previewScenario}
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
          />
        )}

        {/* Scenario Editor Modal */}
        {editingScenarioId && editingScenario && (
          <ScenarioEditor
            scenario={editingScenario}
            isOpen={!!editingScenarioId}
            onClose={() => {
              setEditingScenarioId(null);
              setEditingScenario(null);
            }}
            onSave={async (updatedScenario) => {
              try {
                await updateScenarioContentMutation.mutateAsync({
                  scenarioId: editingScenarioId,
                  content: updatedScenario,
                });
                scenariosQuery.refetch();
                setEditingScenarioId(null);
                setEditingScenario(null);
              } catch (error) {
                console.error("Update failed:", error);
                alert("Erreur lors de la mise à jour du scénario");
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
