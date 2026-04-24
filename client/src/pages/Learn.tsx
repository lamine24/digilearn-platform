import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import {
  GraduationCap, CheckCircle2, Circle, Play, FileText, HelpCircle,
  PenTool, Video, ArrowLeft, ChevronLeft, ChevronRight, Award
} from "lucide-react";
import { useState, useMemo } from "react";

const contentTypeIcon: Record<string, any> = {
  video: Video, texte: FileText, quiz: HelpCircle, exercice: PenTool, pdf: FileText,
};

export default function Learn() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { data: courseData } = trpc.courses.bySlug.useQuery({ slug: slug || "" }, { enabled: !!slug });
  const { data: progressData, refetch: refetchProgress } = trpc.enrollments.progress.useQuery(
    { courseId: courseData?.course?.id || 0 },
    { enabled: !!courseData?.course?.id }
  );
  const completeMutation = trpc.enrollments.completeModule.useMutation({
    onSuccess: (result) => {
      refetchProgress();
      if (result.completed) {
        toast.success("Formation complétée ! Vous pouvez générer votre certificat.");
      } else {
        toast.success("Module complété !");
      }
    },
    onError: (err) => toast.error(err.message),
  });
  const certMutation = trpc.certificates.generate.useMutation({
    onSuccess: (result) => {
      toast.success(`Certificat généré ! Code: ${result.certificateCode}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const [activeModuleIdx, setActiveModuleIdx] = useState(0);

  const modules = progressData?.modules || [];
  const progress = progressData?.progress || [];
  const activeModule = modules[activeModuleIdx];

  const completedModuleIds = useMemo(() => new Set(progress.filter(p => p.completed).map(p => p.moduleId)), [progress]);
  const overallProgress = modules.length > 0 ? Math.round((completedModuleIds.size / modules.length) * 100) : 0;
  const allCompleted = overallProgress === 100;

  if (!courseData) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Chargement...</div>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/course/${slug}`} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Separator orientation="vertical" className="h-6" />
            <span className="font-medium text-sm truncate max-w-xs">{courseData.course.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{overallProgress}%</span>
            <Progress value={overallProgress} className="w-32 h-2" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r bg-muted/30 hidden lg:block">
          <ScrollArea className="h-[calc(100vh-3.5rem)]">
            <div className="p-4">
              <h3 className="font-semibold text-sm mb-3">Modules</h3>
              <div className="space-y-1">
                {modules.map((mod, idx) => {
                  const Icon = contentTypeIcon[mod.contentType] || Play;
                  const isCompleted = completedModuleIds.has(mod.id);
                  const isActive = idx === activeModuleIdx;
                  return (
                    <button
                      key={mod.id}
                      onClick={() => setActiveModuleIdx(idx)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left text-sm transition-colors ${
                        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="truncate font-medium">{mod.title}</div>
                        <div className="text-xs text-muted-foreground">{mod.duration} min</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {activeModule ? (
            <div className="max-w-3xl mx-auto p-8">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary" className="text-xs">Module {activeModuleIdx + 1}/{modules.length}</Badge>
                <Badge variant="outline" className="text-xs capitalize">{activeModule.contentType}</Badge>
              </div>
              <h2 className="text-2xl font-bold mb-2">{activeModule.title}</h2>
              {activeModule.description && (
                <p className="text-muted-foreground mb-6">{activeModule.description}</p>
              )}

              {/* Content area */}
              <Card className="mb-8">
                <CardContent className="p-8">
                  {activeModule.contentType === "video" && (
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                      {activeModule.contentUrl ? (
                        <video src={activeModule.contentUrl} controls className="w-full h-full rounded-lg" />
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <Video className="h-12 w-12 mx-auto mb-2" />
                          <p>Contenu vidéo à venir</p>
                        </div>
                      )}
                    </div>
                  )}
                  {activeModule.contentType === "texte" && (
                    <div className="prose prose-sm max-w-none">
                      {activeModule.contentBody || <p className="text-muted-foreground">Contenu textuel à venir.</p>}
                    </div>
                  )}
                  {activeModule.contentType === "quiz" && (
                    <div className="text-center text-muted-foreground">
                      <HelpCircle className="h-12 w-12 mx-auto mb-2" />
                      <p>Quiz interactif</p>
                      <p className="text-sm">Répondez aux questions pour valider ce module.</p>
                    </div>
                  )}
                  {activeModule.contentType === "exercice" && (
                    <div className="text-center text-muted-foreground">
                      <PenTool className="h-12 w-12 mx-auto mb-2" />
                      <p>Exercice pratique</p>
                      <p className="text-sm">Complétez l'exercice pour valider ce module.</p>
                    </div>
                  )}
                  {activeModule.contentType === "pdf" && (
                    <div className="text-center text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2" />
                      <p>Document PDF</p>
                      {activeModule.contentUrl && (
                        <a href={activeModule.contentUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" className="mt-2">Télécharger le PDF</Button>
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setActiveModuleIdx(Math.max(0, activeModuleIdx - 1))}
                  disabled={activeModuleIdx === 0}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> Précédent
                </Button>

                <div className="flex gap-3">
                  {!completedModuleIds.has(activeModule.id) && (
                    <Button
                      onClick={() => completeMutation.mutate({ moduleId: activeModule.id, courseId: courseData.course.id })}
                      disabled={completeMutation.isPending}
                    >
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      {completeMutation.isPending ? "..." : "Marquer comme complété"}
                    </Button>
                  )}
                  {allCompleted && (
                    <Button
                      variant="secondary"
                      onClick={() => certMutation.mutate({ courseId: courseData.course.id, origin: window.location.origin })}
                      disabled={certMutation.isPending}
                    >
                      <Award className="mr-1 h-4 w-4" /> Obtenir le certificat
                    </Button>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setActiveModuleIdx(Math.min(modules.length - 1, activeModuleIdx + 1))}
                  disabled={activeModuleIdx === modules.length - 1}
                >
                  Suivant <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Sélectionnez un module pour commencer
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
