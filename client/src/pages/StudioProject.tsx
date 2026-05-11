import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, Upload, Zap, FileText, Trash2 } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useEffect, useState } from "react";

export default function StudioProject() {
  // All hooks MUST be called at the top level, before any conditional returns
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [slug, setSlug] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingScenario, setIsGeneratingScenario] = useState(false);
  const [isCreatingCapsule, setIsCreatingCapsule] = useState(false);

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
  const exportScenarioMutation = trpc.studio.exportScenario.useMutation();

  const scenariosQuery = trpc.studio.getProjectScenarios.useQuery(
    { projectId: projectQuery.data?.id || 0 },
    { enabled: !!projectQuery.data?.id }
  );

  const capsulesQuery = trpc.studio.getProjectCapsules.useQuery(
    { projectId: projectQuery.data?.id || 0 },
    { enabled: !!projectQuery.data?.id }
  );

  // Extract slug from URL using useEffect, not during render
  useEffect(() => {
    if (!slug) {
      const path = window.location.pathname;
      const match = path.match(/\/studio\/([^/]+)/);
      if (match) {
        // Decode URL-encoded slug (e.g., %C3%A9 -> é)
        const decodedSlug = decodeURIComponent(match[1]);
        setSlug(decodedSlug);
      }
    }
  }, [slug]);

  // Conditional rendering happens AFTER hooks
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
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.details || errorData.error || "Scenario generation failed";
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("Scenario generated successfully:", result);
      
      // Refresh scenarios list
      scenariosQuery.refetch();
      // Show success message
      alert("Scénario généré avec succès !");
    } catch (error) {
      console.error("Scenario generation failed:", error);
      const errorMessage = (error as Error).message || "Erreur lors de la génération du scénario";
      alert(`Erreur: ${errorMessage}\n\nLe système va réessayer automatiquement...`);
    } finally {
      setIsGeneratingScenario(false);
    }
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

    setIsCreatingCapsule(true);
    try {
      const project = projectQuery.data as any;
      const firstScenario = scenariosQuery.data[0] as any;
      
      // Call backend API to create capsule
      const response = await fetch("/api/studio/create-capsule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: project.id,
          scenarioId: firstScenario.id,
          title: `Capsule ${new Date().toLocaleDateString()}`,
          description: "Nouvelle capsule vidéo",
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
      alert("Erreur lors de la création de la capsule");
    } finally {
      setIsCreatingCapsule(false);
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
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                onClick={handleGenerateScenario}
                disabled={isGeneratingScenario || !documentsQuery.data?.length}
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
              {!documentsQuery.data?.length && (
                <p className="text-xs text-amber-600 mt-2">
                  ⚠️ Téléchargez d'abord un document
                </p>
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

        {/* Scenarios Section */}
        {scenariosQuery.data && scenariosQuery.data.length > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="mr-2 h-5 w-5 text-amber-600" />
                  Scénarios Générés ({scenariosQuery.data.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scenariosQuery.data.map((scenario: any) => (
                    <div
                      key={scenario.id}
                      className="p-4 bg-amber-50 rounded-lg border border-amber-200 hover:bg-amber-100 transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {scenario.title || `Scénario ${scenario.id}`}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Créé le {new Date(scenario.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-2 flex-wrap justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportScenario(scenario.id, 'pdf')}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Exporter en PDF"
                          >
                            📄 PDF
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportScenario(scenario.id, 'docx')}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Exporter en Word"
                          >
                            📝 Word
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newTitle = prompt("Nouveau titre:", scenario.title);
                              if (newTitle) {
                                updateScenarioMutation.mutate(
                                  { scenarioId: scenario.id, title: newTitle },
                                  {
                                    onSuccess: () => scenariosQuery.refetch()
                                  }
                                );
                              }
                            }}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            ✏️
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm("Confirmer la suppression du scénario ?")) {
                                deleteScenarioMutation.mutate(
                                  { scenarioId: scenario.id },
                                  {
                                    onSuccess: () => scenariosQuery.refetch()
                                  }
                                );
                              }
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {scenario.description && (
                        <div className="mt-3 pt-3 border-t border-amber-200">
                          <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-48 overflow-y-auto bg-white rounded p-2 border border-amber-100">
                            {scenario.description}
                          </div>
                          {scenario.description && scenario.description.length > 1000 && (
                            <p className="text-xs text-amber-600 mt-2">... (Contenu complet disponible dans l'export PDF/Word)</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Capsules Section */}
        {capsulesQuery.data && capsulesQuery.data.length > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-purple-600" />
                  Capsules Vidéo ({capsulesQuery.data.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {capsulesQuery.data.map((capsule: any) => (
                    <div
                      key={capsule.id}
                      className="p-4 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {capsule.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {capsule.description || "Capsule vidéo"}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Statut: <span className="font-semibold">{capsule.videoStatus || "pending"}</span>
                          </p>
                        </div>
                        <div className="flex gap-2 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => alert("Édition de capsule en développement")}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            ✏️
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => alert("Suppression de capsule en développement")}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Documents List Section */}
        {documentsQuery.data && documentsQuery.data.length > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-blue-600" />
                  Documents Téléchargés ({documentsQuery.data.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {documentsQuery.data.map((doc: any) => (
                    <div key={doc.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition">
                        <div className="flex items-center flex-1">
                          <FileText className="h-4 w-4 text-blue-600 mr-3" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {doc.fileName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(doc.fileSize / 1024).toFixed(2)} KB • {doc.fileType.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            doc.extractionStatus === 'completed' ? 'bg-green-100 text-green-800' :
                            doc.extractionStatus === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {doc.extractionStatus || "pending"}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDocument(doc.id, doc.fileName)}
                            disabled={deleteDocumentMutation.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {doc.extractedContent && doc.extractionStatus === 'completed' && (
                        <div className="p-4 bg-white border-t border-gray-200">
                          <p className="text-xs font-semibold text-gray-700 mb-2">Contenu Extrait (Scénarisation):</p>
                          <div className="bg-gray-50 p-3 rounded border border-gray-200 max-h-64 overflow-y-auto">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                              {doc.extractedContent.substring(0, 1000)}
                              {doc.extractedContent.length > 1000 && (
                                <span className="text-gray-500">... [+{doc.extractedContent.length - 1000} caractères]</span>
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
