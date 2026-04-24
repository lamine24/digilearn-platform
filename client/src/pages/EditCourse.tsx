import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { GraduationCap, Plus, Trash2, Edit, ArrowLeft, Video, FileText, HelpCircle, PenTool } from "lucide-react";
import { useState } from "react";
import { getLoginUrl } from "@/const";

const contentTypeIcon: Record<string, any> = {
  video: Video,
  texte: FileText,
  quiz: HelpCircle,
  exercice: PenTool,
  pdf: FileText,
};

export default function EditCourse() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated, loading } = useAuth();
  const { data: courseData } = trpc.courses.bySlug.useQuery({ slug: slug || "" }, { enabled: !!slug });
  const { data: modules, refetch: refetchModules } = trpc.modules.byCourse.useQuery(
    { courseId: courseData?.course?.id || 0 },
    { enabled: !!courseData?.course?.id }
  );

  const [showAddModule, setShowAddModule] = useState(false);
  const [newModule, setNewModule] = useState<{
    title: string;
    description: string;
    contentType: "video" | "texte" | "quiz" | "exercice" | "pdf";
    contentUrl: string;
    contentBody: string;
    duration: number;
    isPreview: boolean;
  }>({
    title: "",
    description: "",
    contentType: "video",
    contentUrl: "",
    contentBody: "",
    duration: 5,
    isPreview: false,
  });

  const createModuleMutation = trpc.modules.create.useMutation({
    onSuccess: () => {
      toast.success("Module créé");
      setShowAddModule(false);
      setNewModule({ title: "", description: "", contentType: "video", contentUrl: "", contentBody: "", duration: 5, isPreview: false });
      refetchModules();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteModuleMutation = trpc.modules.delete.useMutation({
    onSuccess: () => {
      toast.success("Module supprimé");
      refetchModules();
    },
    onError: (err) => toast.error(err.message),
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center animate-pulse">Chargement...</div>;
  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }
  if (!courseData) return <div className="min-h-screen flex items-center justify-center">Formation introuvable</div>;

  const { course } = courseData;
  const isFormateur = user?.role === "formateur" || user?.role === "admin";
  const isOwner = isFormateur && (course.formateurId === user?.id || user?.role === "admin");

  if (!isOwner) {
    navigate("/dashboard");
    return null;
  }

  const handleAddModule = () => {
    if (!newModule.title) {
      toast.error("Le titre du module est requis");
      return;
    }
    createModuleMutation.mutate({
      courseId: course.id,
      ...newModule,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/formateur" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">DigiLearn</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/formateur">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" /> Retour
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="container py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">Édition</Badge>
            <Badge variant={course.status === "publie" ? "default" : "outline"}>{course.status}</Badge>
          </div>
          <h1 className="text-3xl font-bold mb-2">{course.title}</h1>
          <p className="text-muted-foreground">{course.description}</p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Modules ({modules?.length || 0})</h2>
            <Dialog open={showAddModule} onOpenChange={setShowAddModule}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-1 h-4 w-4" /> Ajouter un module
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Créer un module</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Titre du module</Label>
                    <Input
                      value={newModule.title}
                      onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                      placeholder="Ex: Introduction aux bases"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newModule.description}
                      onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                      placeholder="Décrivez le contenu du module"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Type de contenu</Label>
                      <Select value={newModule.contentType} onValueChange={(v: any) => setNewModule({ ...newModule, contentType: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Vidéo</SelectItem>
                          <SelectItem value="texte">Texte</SelectItem>
                          <SelectItem value="quiz">Quiz</SelectItem>
                          <SelectItem value="exercice">Exercice</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Durée (minutes)</Label>
                      <Input
                        type="number"
                        value={newModule.duration}
                        onChange={(e) => setNewModule({ ...newModule, duration: Number(e.target.value) })}
                        min="1"
                      />
                    </div>
                  </div>
                  {(newModule.contentType as string) === "video" && (
                    <div>
                      <Label>URL de la vidéo</Label>
                      <Input
                        value={newModule.contentUrl}
                        onChange={(e) => setNewModule({ ...newModule, contentUrl: e.target.value })}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>
                  )}
                  {((newModule.contentType as string) === "texte" || (newModule.contentType as string) === "quiz") && (
                    <div>
                      <Label>Contenu</Label>
                      <Textarea
                        value={newModule.contentBody}
                        onChange={(e) => setNewModule({ ...newModule, contentBody: e.target.value })}
                        placeholder="Entrez le contenu du module"
                        rows={6}
                      />
                    </div>
                  )}
                  {(newModule.contentType as string) === "pdf" && (
                    <div>
                      <Label>URL du PDF</Label>
                      <Input
                        value={newModule.contentUrl}
                        onChange={(e) => setNewModule({ ...newModule, contentUrl: e.target.value })}
                        placeholder="https://example.com/document.pdf"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPreview"
                      checked={newModule.isPreview}
                      onChange={(e) => setNewModule({ ...newModule, isPreview: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="isPreview" className="cursor-pointer">Aperçu gratuit</Label>
                  </div>
                  <Button className="w-full" onClick={handleAddModule} disabled={createModuleMutation.isPending}>
                    {createModuleMutation.isPending ? "Création..." : "Créer le module"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {!modules || modules.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold mb-1">Aucun module</h3>
                <p className="text-sm text-muted-foreground">Créez votre premier module pour cette formation.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {modules.map((mod, idx) => {
                const Icon = contentTypeIcon[mod.contentType] || FileText;
                return (
                  <Card key={mod.id} className="border-border/50">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Module {idx + 1}</span>
                          {mod.isPreview && <Badge variant="secondary" className="text-xs">Aperçu</Badge>}
                        </div>
                        <h3 className="font-medium">{mod.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{mod.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{mod.duration} min</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteModuleMutation.mutate({ id: mod.id })}
                          disabled={deleteModuleMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
