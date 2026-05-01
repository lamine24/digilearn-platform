import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { getLoginUrl } from "@/const";

export default function CreateCourse() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "data-science",
    level: "debutant",
    price: 0,
    maxStudents: 50,
    image: "",
  });

  const createCourseMutation = trpc.courses.create.useMutation({
    onSuccess: (data) => {
      toast.success("Formation créée avec succès");
      navigate(`/formateur/dashboard`);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title) {
      toast.error("Le titre est requis");
      return;
    }

    if (!formData.description) {
      toast.error("La description est requise");
      return;
    }

    // Generate slug from title
    const slug = formData.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    createCourseMutation.mutate({
      title: formData.title,
      slug: slug,
      description: formData.description,
      price: formData.price.toString(),
      level: formData.level as any,
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Button onClick={() => (window.location.href = getLoginUrl())}>Se connecter</Button>
      </div>
    );
  }

  if (user?.role !== "formateur") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Accès refusé</h1>
          <p className="text-muted-foreground mb-4">Seuls les formateurs peuvent créer des formations</p>
          <Link href="/">
            <Button>Retour à l'accueil</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/formateur/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Retour</span>
          </Link>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            <span className="font-semibold">Créer une formation</span>
          </div>
          <div className="w-20"></div>
        </div>
      </nav>

      <div className="container py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle Formation</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Titre de la formation *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Data Science Avancé"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez votre formation..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="data-science">Data Science</SelectItem>
                      <SelectItem value="web-dev">Développement Web</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="management">Management</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="level">Niveau</Label>
                  <Select value={formData.level} onValueChange={(val) => setFormData({ ...formData, level: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debutant">Débutant</SelectItem>
                      <SelectItem value="intermediaire">Intermédiaire</SelectItem>
                      <SelectItem value="avance">Avancé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Prix (FCFA)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <Label htmlFor="maxStudents">Nombre max d'apprenants</Label>
                  <Input
                    id="maxStudents"
                    type="number"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: parseInt(e.target.value) || 50 })}
                    placeholder="50"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="image">URL de l'image</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={createCourseMutation.isPending}
                  className="flex-1"
                >
                  {createCourseMutation.isPending ? "Création..." : "Créer la formation"}
                </Button>
                <Link href="/formateur/dashboard">
                  <Button type="button" variant="outline" className="flex-1">
                    Annuler
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
