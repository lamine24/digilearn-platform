// This file contains the preview handlers to be integrated into StudioProject.tsx
// Add these handlers after the state declarations

export const previewHandlers = {
  // Preview scenario handler
  handlePreviewScenario: async (projectQuery: any, trpc: any, setIsPreviewLoading: any, setPreviewScenario: any, setShowPreview: any) => {
    if (!projectQuery.data) return;

    setIsPreviewLoading(true);
    try {
      const project = projectQuery.data as any;
      const result = await trpc.studio.previewScenario.mutate({
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
  },

  // Save preview scenario handler
  handleSavePreview: async (projectQuery: any, previewScenario: any, setIsGeneratingScenario: any, scenariosQuery: any, setShowPreview: any) => {
    if (!projectQuery.data || !previewScenario) return;

    setIsGeneratingScenario(true);
    try {
      const project = projectQuery.data as any;
      
      // Call backend API to save the scenario
      const response = await fetch("/api/studio/save-scenario", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: project.id,
          title: previewScenario.title,
          description: previewScenario.description,
          pedagogicalModel: project.pedagogicalModel || "professional",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.details || errorData.error || "Scenario save failed";
        throw new Error(errorMessage);
      }

      // Refresh scenarios list
      scenariosQuery.refetch();
      setShowPreview(false);
      alert("Scénario sauvegardé avec succès !");
    } catch (error) {
      console.error("Scenario save failed:", error);
      const errorMessage = (error as Error).message || "Erreur lors de la sauvegarde du scénario";
      alert(`Erreur: ${errorMessage}`);
    } finally {
      setIsGeneratingScenario(false);
    }
  },
};
