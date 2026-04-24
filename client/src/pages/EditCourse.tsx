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
import { GraduationCap, Plus, Trash2, Edit, ArrowLeft, Video, FileText, HelpCircle, PenTool, Link2, Calendar, Clock, Upload } from "lucide-react";
import { useState } from "react";
import { getLoginUrl } from "@/const";

const contentTypeIcon: Record<string, any> = {
  video: Video,
  texte: FileText,
  quiz: HelpCircle,
  exercice: PenTool,
  pdf: FileText,
  zoom: Link2,
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
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [newModule, setNewModule] = useState<{
    title: string;
    description: string;
    contentType: "video" | "texte" | "quiz" | "exercice" | "pdf" | "zoom";
    contentUrl: string;
    contentBody: string;
    duration: number;
    isPreview: boolean;
    zoomLink?: string;
    zoomDate?: string;
    zoomTime?: string;
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
      toast.success(editingModuleId ? "Module mis à jour" : "Module créé");
      setShowAddModule(false);
      setEditingModuleId(null);
      setNewModule({ title: "", description: "", contentType: "video", contentUrl: "", contentBody: "", duration: 5, isPreview: false });
      refetchModules();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateModuleMutation = trpc.modules.update.useMutation({
    onSuccess: () => {
      toast.success("Module mis à jour");
      setShowAddModule(false);
      setEditingModuleId(null);
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

    const contentType = (newModule.contentType === "zoom" ? "video" : newModule.contentType) as any;
    const contentUrl = newModule.contentType === "zoom" ? newModule.zoomLink : newModule.contentUrl;
    const contentBody = newModule.contentType === "zoom" ? JSON.stringify({ zoomLink: newModule.zoomLink, zoomDate: newModule.zoomDate, zoomTime: newModule.zoomTime }) : newModule.contentBody;

    if (editingModuleId) {
      updateModuleMutation.mutate({
        id: editingModuleId,
        title: newModule.title,
        description: newModule.description,
        contentType,
        contentUrl,
        contentBody,
        duration: newModule.duration,
        isPreview: newModule.isPreview,
      });
    } else {
      createModuleMutation.mutate({
        courseId: course.id,
        title: newModule.title,
        description: newModule.description,
        contentType,
        contentUrl,
        contentBody,
        duration: newModule.duration,
        isPreview: newModule.isPreview,
      });
    }
  };

  const handleEditModule = (mod: any) => {
    setEditingModuleId(mod.id);
    setNewModule({
      title: mod.title,
      description: mod.description || "",
      contentType: mod.contentType,
      contentUrl: mod.contentUrl || "",
      contentBody: mod.contentBody || "",
      duration: mod.duration,
      isPreview: mod.isPreview,
      zoomLink: mod.contentUrl,
      zoomDate: mod.zoomDate,
      zoomTime: mod.zoomTime,
    });
    setShowAddModule(true);
  };

  const handleFileUpload = async (file: File, type: "video" | "resource") => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      
      if (type === "video") {
        setNewModule({ ...newModule, contentUrl: data.url });
        toast.success("Vidéo uploadée");
      } else {
        setNewModule({ ...newModule, contentUrl: data.url });
        toast.success("Ressource uploadée");
      }
    } catch (err) {
      toast.error("Erreur lors de l'upload");
    }
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
            <Dialog open={showAddModule} onOpenChange={(open) => {
              setShowAddModule(open);
              if (!open) {
                setEditingModuleId(null);
                setNewModule({ title: "", description: "", contentType: "video", contentUrl: "", contentBody: "", duration: 5, isPreview: false });
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-1 h-4 w-4" /> {editingModuleId ? "Modifier" : "Ajouter un module"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingModuleId ? "Modifier le module" : "Créer un module"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Titre du module *</Label>
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
                          <SelectItem value="zoom">Zoom/Visioconférence</SelectItem>
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

                  {/* Vidéo */}
                  {(newModule.contentType as string) === "video" && (
                    <div className="space-y-3">
                      <div>
                        <Label>URL de la vidéo</Label>
                        <Input
                          value={newModule.contentUrl}
                          onChange={(e) => setNewModule({ ...newModule, contentUrl: e.target.value })}
                          placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                        />
                      </div>
                      <div>
                        <Label>Ou télécharger une vidéo</Label>
                        <div className="border-2 border-dashed rounded-lg p-4">
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "video")}
                            className="hidden"
                            id="video-upload"
                          />
                          <label htmlFor="video-upload" className="cursor-pointer flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            <span className="text-sm">Cliquez pour télécharger une vidéo</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Zoom */}
                  {(newModule.contentType as string) === "zoom" && (
                    <div className="space-y-3 bg-blue-50 p-4 rounded-lg">
                      <div>
                        <Label>Lien Zoom</Label>
                        <Input
                          value={newModule.zoomLink || ""}
                          onChange={(e) => setNewModule({ ...newModule, zoomLink: e.target.value })}
                          placeholder="https://zoom.us/j/..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Date de la session</Label>
                          <Input
                            type="date"
                            value={newModule.zoomDate || ""}
                            onChange={(e) => setNewModule({ ...newModule, zoomDate: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Heure de la session</Label>
                          <Input
                            type="time"
                            value={newModule.zoomTime || ""}
                            onChange={(e) => setNewModule({ ...newModule, zoomTime: e.target.value })}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Les apprenants verront le lien et la date/heure de la session Zoom</p>
                    </div>
                  )}

                  {/* Texte ou Quiz */}
                  {((newModule.contentType as string) === "texte" || (newModule.contentType as string) === "quiz") && (
                    <div>
                      <Label>Contenu</Label>
                      <Textarea
                        value={newModule.contentBody}
                        onChange={(e) => setNewModule({ ...newModule, contentBody: e.target.value })}
                        placeholder="Entrez le contenu du module (Markdown supporté)"
                        rows={8}
                      />
                    </div>
                  )}

                  {/* PDF */}
                  {(newModule.contentType as string) === "pdf" && (
                    <div className="space-y-3">
                      <div>
                        <Label>URL du PDF</Label>
                        <Input
                          value={newModule.contentUrl}
                          onChange={(e) => setNewModule({ ...newModule, contentUrl: e.target.value })}
                          placeholder="https://example.com/document.pdf"
                        />
                      </div>
                      <div>
                        <Label>Ou télécharger un PDF</Label>
                        <div className="border-2 border-dashed rounded-lg p-4">
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "resource")}
                            className="hidden"
                            id="pdf-upload"
                          />
                          <label htmlFor="pdf-upload" className="cursor-pointer flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            <span className="text-sm">Cliquez pour télécharger un PDF</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Exercice */}
                  {(newModule.contentType as string) === "exercice" && (
                    <div className="space-y-3">
                      <div>
                        <Label>Description de l'exercice</Label>
                        <Textarea
                          value={newModule.contentBody}
                          onChange={(e) => setNewModule({ ...newModule, contentBody: e.target.value })}
                          placeholder="Décrivez l'exercice et les instructions"
                          rows={6}
                        />
                      </div>
                      <div>
                        <Label>Ressource d'exercice (optionnel)</Label>
                        <div className="border-2 border-dashed rounded-lg p-4">
                          <input
                            type="file"
                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], "resource")}
                            className="hidden"
                            id="exercise-upload"
                          />
                          <label htmlFor="exercise-upload" className="cursor-pointer flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            <span className="text-sm">Télécharger un fichier (template, données, etc.)</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="isPreview"
                      checked={newModule.isPreview}
                      onChange={(e) => setNewModule({ ...newModule, isPreview: e.target.checked })}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="isPreview" className="cursor-pointer">Aperçu gratuit (visible sans inscription)</Label>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handleAddModule} 
                    disabled={createModuleMutation.isPending || updateModuleMutation.isPending}
                  >
                    {createModuleMutation.isPending || updateModuleMutation.isPending 
                      ? "Traitement..." 
                      : editingModuleId ? "Mettre à jour le module" : "Créer le module"}
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
                  <Card key={mod.id} className="border-border/50 hover:border-primary/50 transition-colors">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Module {idx + 1}</span>
                          {mod.isPreview && <Badge variant="secondary" className="text-xs">Aperçu</Badge>}
                          <Badge variant="outline" className="text-xs">{mod.contentType}</Badge>
                        </div>
                        <h3 className="font-medium">{mod.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">{mod.description}</p>
                        {(mod.contentType as string) === "zoom" && (mod as any).zoomDate && (
                          <div className="flex items-center gap-2 text-xs text-blue-600 mt-1">
                            <Calendar className="h-3 w-3" />
                            {(mod as any).zoomDate} {(mod as any).zoomTime && `à ${(mod as any).zoomTime}`}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {mod.duration} min
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditModule(mod)}
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
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
