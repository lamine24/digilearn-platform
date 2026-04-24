import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  GraduationCap, User, BookOpen, CheckCircle2, ArrowRight, ArrowLeft
} from "lucide-react";
import { useState } from "react";

const interests = [
  { value: "data-science", label: "Data Science & IA" },
  { value: "finance", label: "Finance & Économie" },
  { value: "web-dev", label: "Développement Web" },
  { value: "management", label: "Gestion de Projet" },
  { value: "statistiques", label: "Statistiques & Économétrie" },
  { value: "other", label: "Autre" },
];

export default function Onboarding() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({ name: user?.name || "", phone: "", bio: "" });
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const updateProfileMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profil mis à jour !");
      setStep(3);
    },
    onError: (err) => toast.error(err.message),
  });

  const { data: coursesData } = trpc.courses.published.useQuery({});

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  const toggleInterest = (val: string) => {
    setSelectedInterests(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  const filteredCourses = coursesData?.filter(c => {
    if (selectedInterests.length === 0) return true;
    return selectedInterests.some(i => c.course.tags?.includes(i) || c.category?.slug?.includes(i));
  }) || [];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">DigiLearn</span>
          </Link>
        </div>
      </nav>

      <div className="container max-w-2xl py-12">
        {/* Progress */}
        <div className="flex items-center justify-center gap-4 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
              </div>
              <span className={`text-sm hidden sm:block ${step >= s ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {s === 1 ? "Profil" : s === 2 ? "Centres d'intérêt" : "Recommandations"}
              </span>
              {s < 3 && <div className={`w-12 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Profile */}
        {step === 1 && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <User className="h-10 w-10 text-primary mx-auto mb-3" />
                <h2 className="text-2xl font-bold">Complétez votre profil</h2>
                <p className="text-muted-foreground mt-1">Quelques informations pour personnaliser votre expérience.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Nom complet</Label>
                  <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} placeholder="Votre nom" />
                </div>
                <div>
                  <Label>Téléphone (optionnel)</Label>
                  <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+221 XX XXX XX XX" />
                </div>
                <div>
                  <Label>Brève description (optionnel)</Label>
                  <Input value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="Votre poste, entreprise..." />
                </div>
                <Button className="w-full" size="lg" onClick={() => {
                  updateProfileMutation.mutate({ name: profile.name, phone: profile.phone, bio: profile.bio });
                  setStep(2);
                }}>
                  Continuer <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Interests */}
        {step === 2 && (
          <Card>
            <CardContent className="p-8">
              <div className="text-center mb-6">
                <BookOpen className="h-10 w-10 text-primary mx-auto mb-3" />
                <h2 className="text-2xl font-bold">Vos centres d'intérêt</h2>
                <p className="text-muted-foreground mt-1">Sélectionnez les domaines qui vous intéressent.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {interests.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => toggleInterest(item.value)}
                    className={`p-4 rounded-lg border text-sm font-medium text-left transition-colors ${
                      selectedInterests.includes(item.value)
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Retour
                </Button>
                <Button className="flex-1" size="lg" onClick={() => setStep(3)}>
                  Voir les recommandations <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Recommendations */}
        {step === 3 && (
          <div>
            <div className="text-center mb-8">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold">Bienvenue sur DigiLearn !</h2>
              <p className="text-muted-foreground mt-1">Voici des formations recommandées pour vous.</p>
            </div>
            <div className="grid gap-4 mb-8">
              {(filteredCourses.length > 0 ? filteredCourses : coursesData || []).slice(0, 4).map((item) => (
                <Link key={item.course.id} href={`/course/${item.course.slug}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{item.course.title}</h3>
                        <p className="text-xs text-muted-foreground">{item.category?.name} · {item.course.duration} min</p>
                      </div>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {Number(item.course.price) === 0 ? "Gratuit" : `${Number(item.course.price).toLocaleString("fr-FR")} XOF`}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            <div className="flex gap-3">
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">Explorer tout le catalogue</Button>
              </Link>
              <Link href="/dashboard" className="flex-1">
                <Button className="w-full">Accéder à mon espace <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
