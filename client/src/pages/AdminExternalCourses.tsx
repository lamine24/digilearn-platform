import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Edit, Plus } from "lucide-react";
import { toast } from "sonner";

export function AdminExternalCourses() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    shortDescription: "",
    thumbnailUrl: "",
    externalUrl: "",
    source: "udemy" as const,
    categoryId: "",
    level: "debutant" as const,
    duration: "",
    instructor: "",
    rating: "",
  });

  const { data: courses, isLoading, refetch } = trpc.externalCourses.list.useQuery();
  const createMutation = trpc.externalCourses.create.useMutation();
  const updateMutation = trpc.externalCourses.update.useMutation();
  const deleteMutation = trpc.externalCourses.delete.useMutation();

  const handleOpenDialog = (course?: any) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        title: course.title,
        slug: course.slug,
        description: course.description || "",
        shortDescription: course.shortDescription || "",
        thumbnailUrl: course.thumbnailUrl || "",
        externalUrl: course.externalUrl,
        source: course.source,
        categoryId: course.categoryId?.toString() || "",
        level: course.level,
        duration: course.duration?.toString() || "",
        instructor: course.instructor || "",
        rating: course.rating?.toString() || "",
      });
    } else {
      setEditingCourse(null);
      setFormData({
        title: "",
        slug: "",
        description: "",
        shortDescription: "",
        thumbnailUrl: "",
        externalUrl: "",
        source: "udemy",
        categoryId: "",
        level: "debutant",
        duration: "",
        instructor: "",
        rating: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingCourse) {
        await updateMutation.mutateAsync({
          id: editingCourse.id,
          title: formData.title,
          description: formData.description,
          level: formData.level,
          isActive: true,
        });
        toast.success("Cours mis à jour avec succès");
      } else {
        await createMutation.mutateAsync({
          title: formData.title,
          slug: formData.slug,
          description: formData.description,
          shortDescription: formData.shortDescription,
          thumbnailUrl: formData.thumbnailUrl,
          externalUrl: formData.externalUrl,
          source: formData.source,
          categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
          level: formData.level,
          duration: formData.duration ? parseInt(formData.duration) : undefined,
          instructor: formData.instructor,
          rating: formData.rating,
        });
        toast.success("Cours créé avec succès");
      }
      setIsDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Une erreur s'est produite");
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce cours ?")) {
      try {
        await deleteMutation.mutateAsync({ id });
        toast.success("Cours supprimé avec succès");
        refetch();
      } catch (error: any) {
        toast.error(error.message || "Une erreur s'est produite");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Cours Externes</h1>
          <p className="text-muted-foreground">Gérez les cours provenant de Udemy, Coursera, YouTube et autres plateformes</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un cours
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Chargement des cours...
          </CardContent>
        </Card>
      ) : !courses || courses.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Aucun cours externe trouvé. Commencez par en ajouter un.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {courses.map((course: any) => (
            <Card key={course.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {course.source.charAt(0).toUpperCase() + course.source.slice(1)} • {course.level} • {course.instructor || "Sans instructeur"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDialog(course)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(course.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {course.description && <p className="text-muted-foreground">{course.description}</p>}
                  <p>
                    <strong>URL :</strong>{" "}
                    <a href={course.externalUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {course.externalUrl}
                    </a>
                  </p>
                  {course.duration && <p><strong>Durée :</strong> {course.duration} heures</p>}
                  {course.rating && <p><strong>Note :</strong> {course.rating}/5</p>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? "Modifier le cours" : "Ajouter un nouveau cours externe"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  disabled={!!editingCourse}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="shortDescription">Description courte</Label>
              <Input
                id="shortDescription"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="externalUrl">URL externe *</Label>
                <Input
                  id="externalUrl"
                  type="url"
                  value={formData.externalUrl}
                  onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="source">Source *</Label>
                <Select value={formData.source} onValueChange={(value: any) => setFormData({ ...formData, source: value })}>
                  <SelectTrigger id="source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="udemy">Udemy</SelectItem>
                    <SelectItem value="coursera">Coursera</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="level">Niveau</Label>
                <Select value={formData.level} onValueChange={(value: any) => setFormData({ ...formData, level: value })}>
                  <SelectTrigger id="level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debutant">Débutant</SelectItem>
                    <SelectItem value="intermediaire">Intermédiaire</SelectItem>
                    <SelectItem value="avance">Avancé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="duration">Durée (heures)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="instructor">Instructeur</Label>
                <Input
                  id="instructor"
                  value={formData.instructor}
                  onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="rating">Note (0-5)</Label>
                <Input
                  id="rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="thumbnailUrl">URL de la miniature</Label>
              <Input
                id="thumbnailUrl"
                type="url"
                value={formData.thumbnailUrl}
                onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingCourse ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
