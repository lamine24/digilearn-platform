import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";
import { ArrowLeft, CreditCard, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function PaymentPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const courseId = Number(params.get("courseId")) || 0;
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: courseData, isLoading } = trpc.courses.bySlug.useQuery(
    { slug: "" },
    { enabled: false }
  );

  // Fetch course by ID using a different approach
  const courseQuery = trpc.courses.published.useQuery({ categorySlug: undefined, search: undefined }, {
    enabled: !!courseId,
  });

  const paymentMutation = trpc.payments.initiate.useMutation({
    onSuccess: (result) => {
      setIsProcessing(false);
      window.location.href = result.redirectUrl;
    },
    onError: (err) => {
      setIsProcessing(false);
      toast.error(err.message || "Erreur lors de l'initiation du paiement");
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  const course = courseQuery.data?.find((c: any) => c.course.id === courseId)?.course;

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Formation introuvable</h2>
            <Button variant="outline" onClick={() => navigate("/")} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  const amount = Number(course.price);
  const currency = course.currency || "XOF";

  const handlePayment = async () => {
    if (!user) {
      toast.error("Veuillez vous connecter");
      return;
    }

    setIsProcessing(true);
    paymentMutation.mutate({
      courseId: course.id,
      origin: window.location.origin,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Retour
            </Button>
          <span className="text-lg font-semibold">Paiement sécurisé</span>
          <div className="w-20" />
        </div>
      </nav>

      <div className="container py-8 max-w-2xl">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Résumé de la commande */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Résumé de votre commande</CardTitle>
                <CardDescription>Vérifiez les détails avant de procéder au paiement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Formation */}
                <div>
                  <h3 className="font-semibold mb-2">Formation</h3>
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-1">{course.title}</h4>
                      <p className="text-sm text-muted-foreground">{course.shortDescription}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="secondary">{course.level}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* Détails du paiement */}
                <div>
                  <h3 className="font-semibold mb-3">Détails du paiement</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Montant</span>
                      <span className="font-medium">
                        {amount.toLocaleString("fr-FR")} {currency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Frais de traitement</span>
                      <span className="font-medium">Inclus</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between text-base font-bold">
                      <span>Total</span>
                      <span className="text-primary">
                        {amount.toLocaleString("fr-FR")} {currency}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Informations de sécurité */}
                <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Lock className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-emerald-900 dark:text-emerald-100">Paiement sécurisé</p>
                      <p className="text-emerald-800 dark:text-emerald-200 text-xs mt-1">
                        Vos données sont chiffrées et traitées de manière sécurisée par PayTech.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Conditions */}
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Accès illimité à la formation après paiement</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Certificat de complétion disponible</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Support par chatbot IA inclus</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulaire de paiement */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Paiement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Utilisateur */}
                <div>
                  <label className="text-sm font-medium">Utilisateur</label>
                  <div className="mt-1 p-3 bg-muted rounded-lg text-sm">
                    <p className="font-medium">{user?.name || user?.email}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </div>

                {/* Montant */}
                <div>
                  <label className="text-sm font-medium">Montant à payer</label>
                  <div className="mt-1 p-3 bg-primary/10 rounded-lg">
                    <p className="text-2xl font-bold text-primary">
                      {amount.toLocaleString("fr-FR")} {currency}
                    </p>
                  </div>
                </div>

                {/* Bouton de paiement */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePayment}
                  disabled={isProcessing || paymentMutation.isPending}
                >
                  {isProcessing || paymentMutation.isPending ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Redirection...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Procéder au paiement
                    </>
                  )}
                </Button>

                {/* Méthode de paiement */}
                <div className="text-xs text-muted-foreground text-center">
                  <p>Paiement sécurisé via</p>
                  <p className="font-semibold text-foreground">PayTech</p>
                </div>

                {/* Annulation */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.history.back()}
                  disabled={isProcessing}
                >
                  Annuler
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
