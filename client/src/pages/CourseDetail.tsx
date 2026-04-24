import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Link, useParams, useLocation } from "wouter";
import { toast } from "sonner";
import {
  GraduationCap, BookOpen, Play, Clock, ArrowLeft, Lock, CheckCircle2,
  FileText, HelpCircle, PenTool, Video, ChevronRight, CreditCard
} from "lucide-react";

const contentTypeIcon: Record<string, any> = {
  video: Video, texte: FileText, quiz: HelpCircle, exercice: PenTool, pdf: FileText,
};

function levelLabel(l: string) {
  return { debutant: "Débutant", intermediaire: "Intermédiaire", avance: "Avancé" }[l] || l;
}

function formatPrice(price: string, currency: string) {
  const num = Number(price);
  if (num === 0) return "Gratuit";
  return `${num.toLocaleString("fr-FR")} ${currency}`;
}

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { data, isLoading } = trpc.courses.bySlug.useQuery({ slug: slug || "" }, { enabled: !!slug });
  const { data: enrollment } = trpc.enrollments.check.useQuery(
    { courseId: data?.course?.id || 0 },
    { enabled: !!data?.course?.id && isAuthenticated }
  );
  const enrollMutation = trpc.enrollments.enroll.useMutation({
    onSuccess: (result) => {
      if (result.paymentRequired) {
        navigate(`/payment?courseId=${result.courseId}`);
      } else {
        toast.success("Inscription réussie !");
        navigate("/dashboard");
      }
    },
    onError: (err) => toast.error(err.message),
  });
  const paymentMutation = trpc.payments.initiate.useMutation({
    onSuccess: (result) => {
      window.location.href = result.redirectUrl;
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Formation introuvable</h2>
          <Link href="/"><Button variant="outline">Retour à l'accueil</Button></Link>
        </div>
      </div>
    );
  }

  const { course, category, modules } = data;
  const isEnrolled = enrollment && (enrollment.status === "actif" || enrollment.status === "complete");
  const isFree = Number(course.price) === 0;

  const handleEnroll = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (isFree) {
      enrollMutation.mutate({ courseId: course.id });
    } else {
      paymentMutation.mutate({ courseId: course.id, origin: window.location.origin });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">DigiLearn</span>
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href="/dashboard"><Button variant="outline">Mon espace</Button></Link>
            ) : (
              <Button onClick={() => { window.location.href = getLoginUrl(); }}>Se connecter</Button>
            )}
          </div>
        </div>
      </nav>

      <div className="container py-8">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Retour au catalogue
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">{category?.name || "Général"}</Badge>
              <Badge variant="outline">{levelLabel(course.level)}</Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{course.title}</h1>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">{course.description}</p>

            <div className="flex flex-wrap gap-6 mb-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> {course.duration} min</div>
              <div className="flex items-center gap-2"><BookOpen className="h-4 w-4" /> {modules.length} modules</div>
            </div>

            <Separator className="mb-8" />

            {/* Modules */}
            <h2 className="text-xl font-semibold mb-4">Programme de la formation</h2>
            <div className="space-y-3">
              {modules.map((mod, idx) => {
                const Icon = contentTypeIcon[mod.contentType] || BookOpen;
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
                        <h3 className="font-medium text-sm">{mod.title}</h3>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                        <span>{mod.duration} min</span>
                        {!mod.isPreview && !isEnrolled && <Lock className="h-3.5 w-3.5" />}
                        {isEnrolled && <ChevronRight className="h-4 w-4" />}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            <Card className="sticky top-24 border-border/50 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-primary mb-2">
                  {formatPrice(course.price, course.currency)}
                </div>
                {isEnrolled ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span className="font-medium">Inscrit</span>
                    </div>
                    {enrollment && (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progression</span>
                          <span>{enrollment.progress}%</span>
                        </div>
                        <Progress value={enrollment.progress} className="h-2" />
                      </div>
                    )}
                    <Link href={`/learn/${course.slug}`}>
                      <Button className="w-full" size="lg">
                        Continuer <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleEnroll}
                      disabled={enrollMutation.isPending || paymentMutation.isPending}
                    >
                      {enrollMutation.isPending || paymentMutation.isPending ? "Traitement..." : (
                        isFree ? (
                          <>S'inscrire gratuitement <ChevronRight className="ml-1 h-4 w-4" /></>
                        ) : (
                          <>S'inscrire <CreditCard className="ml-1 h-4 w-4" /></>
                        )
                      )}
                    </Button>
                    {!isFree && (
                      <p className="text-xs text-muted-foreground text-center">Paiement sécurisé via PayTech</p>
                    )}
                  </div>
                )}
                <Separator className="my-4" />
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Accès illimité</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Certificat à la fin</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Support par chatbot IA</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Micro-modules 5-10 min</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
