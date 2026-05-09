import { useParams, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Download, Share2, Eye, Clock, Layers } from "lucide-react";

export function CapsulePreview() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const capsuleId = parseInt(params?.id || "0");
  const [watchDuration, setWatchDuration] = useState(0);

  // Fetch capsule preview data
  const { data: capsule, isLoading, error } = trpc.studio.getCapsulePreview.useQuery(
    { capsuleId },
    { enabled: capsuleId > 0 }
  ) as any;

  // Fetch capsule metadata
  const { data: metadata } = trpc.studio.getCapsuleMetadata.useQuery(
    { capsuleId },
    { enabled: capsuleId > 0 }
  );

  // Fetch capsule exports
  const { data: exports } = trpc.studio.getCapsuleExports.useQuery(
    { capsuleId },
    { enabled: capsuleId > 0 }
  );

  // Record view mutation
  const recordViewMutation = trpc.studio.recordCapsuleView.useMutation();

  // Track watch duration
  useEffect(() => {
    if (!capsuleId) return;

    const interval = setInterval(() => {
      setWatchDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [capsuleId]);

  // Record view on unmount
  useEffect(() => {
    return () => {
      if (watchDuration > 0 && capsuleId > 0) {
        recordViewMutation.mutate({ capsuleId, watchDuration });
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error || !capsule) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Capsule non trouvée</h1>
          <Button onClick={() => setLocation("/studio")}>Retour au Studio</Button>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setLocation("/studio")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Partager
            </Button>
            <Button size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Video Player */}
            <Card className="mb-6 overflow-hidden">
              <div className="bg-black aspect-video flex items-center justify-center">
                {capsule.capsule?.videoUrl ? (
                  <video
                    src={capsule.capsule.videoUrl}
                    controls
                    className="w-full h-full"
                    onPlay={() => setWatchDuration(0)}
                  />
                ) : (
                  <div className="text-white text-center">
                    <Layers className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Vidéo non disponible</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Capsule Info */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{capsule.capsule?.title}</CardTitle>
                    <CardDescription className="mt-2">{capsule.capsule?.description}</CardDescription>
                  </div>
                  <Badge variant={capsule.capsule?.status === "published" ? "default" : "secondary"}>
                    {capsule.capsule?.status === "published" ? "Publié" : "Brouillon"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>{capsule.capsule?.duration || 0} min</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Eye className="w-4 h-4" />
                    <span>{capsule.capsule?.views || 0} vues</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Layers className="w-4 h-4" />
                    <span>{capsule.elementCount || 0} éléments interactifs</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="text-sm">v{capsule.versionCount || 1}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="elements" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="elements">Éléments H5P</TabsTrigger>
                <TabsTrigger value="versions">Versions</TabsTrigger>
                <TabsTrigger value="exports">Exports</TabsTrigger>
              </TabsList>

              {/* H5P Elements Tab */}
              <TabsContent value="elements">
                <Card>
                  <CardHeader>
                    <CardTitle>Éléments Interactifs H5P</CardTitle>
                    <CardDescription>
                      {capsule.h5pElements?.length || 0} élément(s) interactif(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {capsule.h5pElements && capsule.h5pElements.length > 0 ? (
                      <div className="space-y-3">
                        {capsule.h5pElements.map((element: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                          >
                  <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">{(element as any)?.title || "Élément"}</p>
                                <p className="text-sm text-slate-600">{(element as any)?.type || "Interactif"}</p>
                              </div>
                              <Badge variant="outline">{(element as any)?.type || "H5P"}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-600 text-center py-8">Aucun élément interactif</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Versions Tab */}
              <TabsContent value="versions">
                <Card>
                  <CardHeader>
                    <CardTitle>Historique des Versions</CardTitle>
                    <CardDescription>
                      {capsule.versions?.length || 0} version(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {capsule.versions && capsule.versions.length > 0 ? (
                      <div className="space-y-3">
                        {capsule.versions.map((version: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">v{(version as any)?.versionNumber || idx + 1}</p>
                                <p className="text-sm text-slate-600">
                                  {new Date((version as any)?.createdAt).toLocaleDateString("fr-FR")}
                                </p>
                              </div>
                              <Badge variant="outline">{(version as any)?.status || "active"}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-600 text-center py-8">Aucune version</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Exports Tab */}
              <TabsContent value="exports">
                <Card>
                  <CardHeader>
                    <CardTitle>Exports</CardTitle>
                    <CardDescription>
                      {exports?.length || 0} export(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {exports && exports.length > 0 ? (
                      <div className="space-y-3">
                        {exports.map((exp: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{(exp as any)?.format || "Export"}</p>
                                <p className="text-sm text-slate-600">
                                  {new Date((exp as any)?.createdAt).toLocaleDateString("fr-FR")}
                                </p>
                              </div>
                              <a
                                href={(exp as any)?.fileUrl}
                                download
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-600 text-center py-8">Aucun export</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div>
            {/* Stats Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Statistiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Durée de visionnage</p>
                  <p className="text-2xl font-bold">{formatDuration(watchDuration)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Vues totales</p>
                  <p className="text-2xl font-bold">{capsule.capsule?.views || 0}</p>
                </div>
                {capsule.stats && (
                  <>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Durée moyenne</p>
                      <p className="text-2xl font-bold">
                        {formatDuration(capsule.stats.avgWatchDuration || 0)}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" variant="outline">
                  Modifier
                </Button>
                <Button className="w-full" variant="outline">
                  Dupliquer
                </Button>
                <Button className="w-full" variant="destructive">
                  Supprimer
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
