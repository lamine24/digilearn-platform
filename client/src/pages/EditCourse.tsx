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
import { GraduationCap, Plus, Trash2, Edit, ArrowLeft, Video, FileText, HelpCircle, PenTool, Link2, Calendar, Clock, Upload, Download, File, Music, Image as ImageIcon, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import { getLoginUrl } from "@/const";
import { ResourcePreview } from "@/components/ResourcePreview";
import { ModuleReorder } from "@/components/ModuleReorder";
import FileUpload from "@/components/FileUpload";

const resourceTypeIcon: Record<string, any> = {
  video: Video,
  pdf: FileText,
  document: FileText,
  image: ImageIcon,
  audio: Music,
  lien: Link2,
  autre: File,
};

const resourceTypeLabel: Record<string, string> = {
  video: "Vidéo",
  pdf: "PDF",
  document: "Document",
  image: "Image",
  audio: "Audio",
  lien: "Lien",
  autre: "Autre",
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

  const [activeModuleId, setActiveModuleId] = useState<number | null>(null);
  const [showAddModule, setShowAddModule] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [showAddResource, setShowAddResource] = useState(false);
  const [previewResource, setPreviewResource] = useState<any | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showReorder, setShowReorder] = useState(false);
  const reorderMutation = trpc.modules.reorder.useMutation({
    onSuccess: () => {
      toast.success("Ordre des modules mis à jour");
      refetchModules();
      setShowReorder(false);
    },
    onError: (err) => toast.error(err.message),
  });

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

  const [newResource, setNewResource] = useState<{
    title: string;
    description: string;
    resourceType: "video" | "pdf" | "document" | "image" | "audio" | "lien" | "autre";
    fileUrl: string;
    mimeType: string;
  }>({
    title: "",
    description: "",
    resourceType: "video",
    fileUrl: "",
    mimeType: "",
  });

  const [moduleResources, setModuleResources] = useState<any[]>([]);
  const { data: resourcesData, refetch: refetchResources } = trpc.moduleResources.byModule.useQuery(
    { moduleId: activeModuleId || 0 },
    { enabled: !!activeModuleId }
  );

  useEffect(() => {
    if (resourcesData) {
      setModuleResources(resourcesData);
    }
  }, [resourcesData]);

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
      setActiveModuleId(null);
      refetchModules();
    },
    onError: (err) => toast.error(err.message),
  });

  const createResourceMutation = trpc.moduleResources.create.useMutation({
    onSuccess: () => {
      toast.success(editingResourceId ? "Ressource mise à jour" : "Ressource créée");
      setShowAddResource(false);
      setEditingResourceId(null);
      setNewResource({ title: "", description: "", resourceType: "video", fileUrl: "", mimeType: "" });
      refetchResources();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateResourceMutation = trpc.moduleResources.update.useMutation({
    onSuccess: () => {
      toast.success("Ressource mise à jour");
      setShowAddResource(false);
      setEditingResourceId(null);
      setNewResource({ title: "", description: "", resourceType: "video", fileUrl: "", mimeType: "" });
      refetchResources();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteResourceMutation = trpc.moduleResources.delete.useMutation({
    onSuccess: () => {
      toast.success("Ressource supprimée");
      refetchResources();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = (e.target?.result as string)?.split(",")[1];
          if (!base64) throw new Error("Failed to read file");

          const response = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file: base64,
              filename: file.name,
              mimetype: file.type,
            }),
          });

          if (!response.ok) throw new Error("Upload failed");
          const data = await response.json();
          
          setNewResource({ ...newResource, fileUrl: data.url, mimeType: file.type });
          toast.success("Fichier uploadé");
        } catch (err) {
          toast.error("Erreur lors de l'upload");
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error("Erreur lors de la lecture du fichier");
      setUploading(false);
    }
  };

  const handleAddResource = () => {
    if (!newResource.title) {
      toast.error("Le titre de la ressource est requis");
      return;
    }
    if (!newResource.fileUrl) {
      toast.error("Veuillez télécharger ou fournir une URL");
      return;
    }

    if (editingResourceId) {
      updateResourceMutation.mutate({
        id: editingResourceId,
        title: newResource.title,
        description: newResource.description,
        resourceType: newResource.resourceType,
        fileUrl: newResource.fileUrl,
        mimeType: newResource.mimeType,
      });
    } else {
      createResourceMutation.mutate({
        moduleId: activeModuleId!,
        title: newResource.title,
        description: newResource.description,
        resourceType: newResource.resourceType,
        fileUrl: newResource.fileUrl,
        mimeType: newResource.mimeType,
      });
    }
  };

  const handleAddModule = () => {
    if (!newModule.title) {
      toast.error("Le titre du module est requis");
      return;
    }

    if (editingModuleId) {
      updateModuleMutation.mutate({
        id: editingModuleId,
        title: newModule.title,
        description: newModule.description,
        contentType: newModule.contentType,
        contentUrl: newModule.contentUrl,
        contentBody: newModule.contentBody,
        duration: newModule.duration,
        isPreview: newModule.isPreview,
      });
    } else {
      createModuleMutation.mutate({
        courseId: courseData?.course?.id!,
        title: newModule.title,
        description: newModule.description,
        contentType: newModule.contentType,
        contentUrl: newModule.contentUrl,
        contentBody: newModule.contentBody,
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
    });
    setShowAddModule(true);
  };

  const handleEditResource = (resource: any) => {
    setEditingResourceId(resource.id);
    setNewResource({
      title: resource.title,
      description: resource.description || "",
      resourceType: resource.resourceType,
      fileUrl: resource.fileUrl || "",
      mimeType: resource.mimeType || "",
    });
    setShowAddResource(true);
  };

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Modules List */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Modules ({modules?.length || 0})</h2>
              <div className="flex gap-2">
                {modules && modules.length > 1 && (
                  <Button size="sm" variant="outline" onClick={() => setShowReorder(!showReorder)}>
                    {showReorder ? "Annuler" : "Réorganiser"}
                  </Button>
                )}
                <Dialog open={showAddModule} onOpenChange={(open) => {
                  setShowAddModule(open);
                  if (!open) {
                    setEditingModuleId(null);
                    setNewModule({ title: "", description: "", contentType: "video", contentUrl: "", contentBody: "", duration: 5, isPreview: false });
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingModuleId ? "Modifier" : "Créer"} un module</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label>Titre *</Label>
                      <Input value={newModule.title} onChange={(e) => setNewModule({ ...newModule, title: e.target.value })} />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea value={newModule.description} onChange={(e) => setNewModule({ ...newModule, description: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label>Type</Label>
                        <Select value={newModule.contentType} onValueChange={(v: any) => setNewModule({ ...newModule, contentType: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
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
                        <Label>Durée (min)</Label>
                        <Input type="number" value={newModule.duration} onChange={(e) => setNewModule({ ...newModule, duration: Number(e.target.value) })} min="1" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="isPreview" checked={newModule.isPreview} onChange={(e) => setNewModule({ ...newModule, isPreview: e.target.checked })} />
                      <Label htmlFor="isPreview" className="cursor-pointer">Aperçu gratuit</Label>
                    </div>
                    {newModule.contentType === "video" && (
                      <div>
                        <Label>Telecharger video</Label>
                        <FileUpload
                          onFileSelect={(file) => {
                            setNewModule({ ...newModule, contentUrl: file.name });
                            toast.success("Fichier video selectionne");
                          }}
                          acceptedTypes={["video/mp4", "video/webm", "video/ogg"]}
                          maxSize={500 * 1024 * 1024}
                        />
                      </div>
                    )}
                    {newModule.contentType === "pdf" && (
                      <div>
                        <Label>Telecharger PDF</Label>
                        <FileUpload
                          onFileSelect={(file) => {
                            setNewModule({ ...newModule, contentUrl: file.name });
                            toast.success("Fichier PDF selectionne");
                          }}
                          acceptedTypes={["application/pdf"]}
                          maxSize={100 * 1024 * 1024}
                        />
                      </div>
                    )}
                    {newModule.contentType === "texte" && (
                      <div>
                        <Label>Contenu texte</Label>
                        <Textarea value={newModule.contentBody} onChange={(e) => setNewModule({ ...newModule, contentBody: e.target.value })} placeholder="Entrez le contenu texte..." />
                      </div>
                    )}
                    <Button className="w-full" onClick={handleAddModule} disabled={createModuleMutation.isPending || updateModuleMutation.isPending}>
                      {createModuleMutation.isPending || updateModuleMutation.isPending ? "..." : editingModuleId ? "Mettre à jour" : "Créer"}
                    </Button>
                  </div>
                </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="space-y-2">
              {!modules || modules.length === 0 ? (
                <Card><CardContent className="p-4 text-center text-sm text-muted-foreground">Aucun module</CardContent></Card>
              ) : showReorder ? (
                <div className="space-y-3">
                  <ModuleReorder
                    modules={modules.map(m => ({ id: m.id, title: m.title, completed: false }))}
                    onReorder={(reordered) => {
                      reorderMutation.mutate({
                        courseId: courseData?.course?.id || 0,
                        moduleIds: reordered.map(m => m.id),
                      });
                    }}
                  />
                  <Button variant="outline" onClick={() => setShowReorder(false)} className="w-full">
                    Annuler
                  </Button>
                </div>
              ) : (
                modules.map((mod, idx) => (
                  <Card key={mod.id} className={`cursor-pointer border transition-colors ${activeModuleId === mod.id ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50"}`} onClick={() => setActiveModuleId(mod.id)}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-muted-foreground">Module {idx + 1}</div>
                          <h3 className="font-medium text-sm line-clamp-1">{mod.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">{mod.description}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEditModule(mod); }}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteModuleMutation.mutate({ id: mod.id }); }}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )
              }
            </div>
          </div>

          {/* Resources for Active Module */}
          <div className="lg:col-span-2">
            {activeModuleId ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Ressources ({moduleResources.length})</h2>
                  <Dialog open={showAddResource} onOpenChange={(open) => {
                    setShowAddResource(open);
                    if (!open) {
                      setEditingResourceId(null);
                      setNewResource({ title: "", description: "", resourceType: "video", fileUrl: "", mimeType: "" });
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-3 w-3 mr-1" /> Ressource
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{editingResourceId ? "Modifier" : "Ajouter"} une ressource</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Titre *</Label>
                          <Input value={newResource.title} onChange={(e) => setNewResource({ ...newResource, title: e.target.value })} placeholder="Ex: Vidéo d'introduction" />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea value={newResource.description} onChange={(e) => setNewResource({ ...newResource, description: e.target.value })} placeholder="Décrivez la ressource" />
                        </div>
                        <div>
                          <Label>Type de ressource</Label>
                          <Select value={newResource.resourceType} onValueChange={(v: any) => setNewResource({ ...newResource, resourceType: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="video">Vidéo</SelectItem>
                              <SelectItem value="pdf">PDF</SelectItem>
                              <SelectItem value="document">Document</SelectItem>
                              <SelectItem value="image">Image</SelectItem>
                              <SelectItem value="audio">Audio</SelectItem>
                              <SelectItem value="lien">Lien externe</SelectItem>
                              <SelectItem value="autre">Autre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>URL ou lien</Label>
                          <Input value={newResource.fileUrl} onChange={(e) => setNewResource({ ...newResource, fileUrl: e.target.value })} placeholder="https://..." />
                        </div>
                        <div>
                          <Label>Ou télécharger un fichier</Label>
                          <div className="border-2 border-dashed rounded-lg p-4">
                            <input type="file" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} className="hidden" id="resource-upload" disabled={uploading} />
                            <label htmlFor="resource-upload" className="cursor-pointer flex items-center gap-2">
                              <Upload className="h-4 w-4" />
                              <span className="text-sm">{uploading ? "Upload..." : "Cliquez pour télécharger"}</span>
                            </label>
                          </div>
                        </div>
                        <Button className="w-full" onClick={handleAddResource} disabled={createResourceMutation.isPending || updateResourceMutation.isPending || uploading}>
                          {createResourceMutation.isPending || updateResourceMutation.isPending ? "..." : editingResourceId ? "Mettre à jour" : "Ajouter"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-3">
                  {moduleResources.length === 0 ? (
                    <Card><CardContent className="p-8 text-center text-muted-foreground">Aucune ressource. Ajoutez-en une pour ce module.</CardContent></Card>
                  ) : (
                    moduleResources.map((res) => {
                      const Icon = resourceTypeIcon[res.resourceType] || File;
                      return (
                        <Card key={res.id} className="border-border/50 hover:border-primary/50 transition-colors">
                          <CardContent className="p-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{resourceTypeLabel[res.resourceType]}</Badge>
                              </div>
                              <h3 className="font-medium">{res.title}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-1">{res.description}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button size="sm" variant="ghost" onClick={() => { setPreviewResource(res); setShowPreview(true); }}>
                                <Eye className="h-4 w-4 text-green-600" />
                              </Button>
                              {res.fileUrl && (
                                <a href={res.fileUrl} target="_blank" rel="noopener noreferrer">
                                  <Button size="sm" variant="ghost">
                                    <Download className="h-4 w-4 text-blue-600" />
                                  </Button>
                                </a>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => handleEditResource(res)}>
                                <Edit className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteResourceMutation.mutate({ id: res.id })} disabled={deleteResourceMutation.isPending}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <Card><CardContent className="p-8 text-center text-muted-foreground">Sélectionnez un module pour gérer ses ressources</CardContent></Card>
            )}
          </div>
        </div>
      </div>

      {previewResource && (
        <ResourcePreview
          resource={previewResource}
          open={showPreview}
          onOpenChange={setShowPreview}
        />
      )}
    </div>
  );
}
