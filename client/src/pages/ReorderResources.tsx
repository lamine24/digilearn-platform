import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleResourceReorder } from "@/components/SimpleResourceReorder";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";

export default function ReorderResources() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const [, navigate] = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const [orderedIds, setOrderedIds] = useState<number[]>([]);

  const { data: resources, isLoading } = trpc.moduleResources.byModule.useQuery(
    { moduleId: parseInt(moduleId || "0") },
    { enabled: !!moduleId }
  );

  const reorderMutation = trpc.moduleResources.reorder.useMutation({
    onSuccess: () => {
      toast.success("Ressources réorganisées avec succès");
      navigate(`/formateur/modules/${moduleId}`);
    },
    onError: (err) => {
      toast.error(err.message || "Erreur lors de la réorganisation");
      setIsSaving(false);
    },
  });

  useEffect(() => {
    if (resources) {
      setOrderedIds(resources.map((r) => r.id));
    }
  }, [resources]);

  const handleReorder = (newOrderedIds: number[]) => {
    setOrderedIds(newOrderedIds);
  };

  const handleSave = async () => {
    if (!moduleId) return;
    setIsSaving(true);
    reorderMutation.mutate({
      moduleId: parseInt(moduleId as string),
      resourceIds: orderedIds,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Chargement des ressources...</p>
      </div>
    );
  }

  if (!resources || resources.length === 0) {
    return (
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate("/formateur/dashboard")} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Aucune ressource à réorganiser</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Button variant="ghost" onClick={() => navigate("/formateur/dashboard")} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" /> Retour
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Réorganiser les ressources</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Glissez-déposez ou utilisez les boutons pour changer l'ordre des ressources
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <SimpleResourceReorder
            resources={resources.map((r) => ({
              id: r.id,
              title: r.title,
              type: r.resourceType,
              order: r.sortOrder || 0,
            }))}
            onReorder={handleReorder}
          />

          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={isSaving || JSON.stringify(orderedIds) === JSON.stringify(resources.map((r) => r.id))}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
            <Button variant="outline" onClick={() => navigate("/formateur/dashboard")}>
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
