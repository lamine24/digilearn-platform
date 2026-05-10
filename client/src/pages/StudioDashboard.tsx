import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, BookOpen, Loader2 } from "lucide-react";

export default function StudioDashboard() {
  // All hooks MUST be called at the top level, before any conditional returns
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    pedagogicalModel: "addie" as const,
    targetAudience: "",
    estimatedDuration: "",
  });

  const projectsQuery = trpc.studio.getUserProjects.useQuery();
  const createProjectMutation = trpc.studio.createProject.useMutation({
    onSuccess: (data) => {
      setFormData({ title: "", description: "", pedagogicalModel: "addie", targetAudience: "", estimatedDuration: "" });
      setIsCreating(false);
      projectsQuery.refetch();
      setLocation(`/studio/${data.slug}`);
    },
  });

  // Conditional rendering happens AFTER hooks
  // Redirect if not formateur or admin
  if (!loading && (!user || (user.role !== "formateur" && user.role !== "admin"))) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const handleCreateProject = async () => {
    if (!formData.title.trim()) return;
    
    createProjectMutation.mutate({
      title: formData.title,
      description: formData.description,
      pedagogicalModel: formData.pedagogicalModel,
      targetAudience: formData.targetAudience,
      estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">DigiLearn Studio</h1>
          <p className="text-lg text-gray-600">Créez des formations interactives avec l'IA</p>
        </div>

        {/* Create Project Button */}
        <div className="mb-8">
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Plus className="mr-2 h-5 w-5" />
                Nouveau Projet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Créer un nouveau projet</DialogTitle>
                <DialogDescription>
                  Commencez par donner un titre à votre projet de formation
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Titre du projet</label>
                  <Input
                    placeholder="Ex: Formation Python Avancée"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <Textarea
                    placeholder="Décrivez votre formation..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Modèle pédagogique</label>
                  <Select value={formData.pedagogicalModel} onValueChange={(value: any) => setFormData({ ...formData, pedagogicalModel: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="addie">ADDIE</SelectItem>
                      <SelectItem value="bloom">Bloom</SelectItem>
                      <SelectItem value="gagne">Gagné</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Public cible</label>
                  <Input
                    placeholder="Ex: Développeurs Python"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Durée estimée (minutes)</label>
                  <Input
                    type="number"
                    placeholder="Ex: 120"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <Button
                  onClick={handleCreateProject}
                  disabled={!formData.title.trim() || createProjectMutation.isPending}
                  className="w-full"
                >
                  {createProjectMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer le projet
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Projects Grid */}
        {projectsQuery.isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : projectsQuery.data?.projects && projectsQuery.data.projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectsQuery.data.projects.map((project: any) => (
              <Card
                key={project.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setLocation(`/studio/${project.slug}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-2">{project.title}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {project.description || "Pas de description"}
                      </CardDescription>
                    </div>
                    <BookOpen className="h-5 w-5 text-blue-600 flex-shrink-0 ml-2" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Modèle:</span> {project.pedagogicalModel?.toUpperCase() || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Statut:</span>
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === "published" ? "bg-green-100 text-green-800" :
                        project.status === "completed" ? "bg-blue-100 text-blue-800" :
                        project.status === "in_progress" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {project.status}
                      </span>
                    </div>
                    {project.estimatedDuration && (
                      <div>
                        <span className="font-medium">Durée:</span> {project.estimatedDuration} min
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun projet</h3>
              <p className="text-gray-600 mb-6">Créez votre premier projet de formation</p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Créer un projet
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
