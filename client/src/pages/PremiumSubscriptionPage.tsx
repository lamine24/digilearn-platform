import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/BackButton";
import { Check, X, Loader2, AlertCircle } from "lucide-react";

export function PremiumSubscriptionPage() {
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current user
  const { data: user } = trpc.auth.me.useQuery();

  // Get current subscription status
  const { data: subscription, isLoading: statusLoading } = trpc.premium.getStatus.useQuery(undefined, {
    enabled: !!user,
  });

  // Subscribe mutation
  const subscribeMutation = trpc.premium.subscribe.useMutation({
    onMutate: () => {
      setIsLoading(true);
      setError(null);
    },
    onSuccess: (data) => {
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      }
    },
    onError: (err) => {
      setError(err.message || "Erreur lors de l'initiation du paiement");
      setIsLoading(false);
    },
  });

  // Cancel mutation
  const cancelMutation = trpc.premium.cancel.useMutation({
    onMutate: () => {
      setIsLoading(true);
      setError(null);
    },
    onSuccess: () => {
      setIsLoading(false);
      // Refresh subscription status
      window.location.reload();
    },
    onError: (err) => {
      setError(err.message || "Erreur lors de l'annulation");
      setIsLoading(false);
    },
  });

  const handleSubscribe = () => {
    if (!user) {
      setError("Vous devez être connecté pour vous abonner");
      return;
    }
    subscribeMutation.mutate({ paymentMethod: "paytech" });
  };

  const handleCancel = () => {
    if (window.confirm("Êtes-vous sûr de vouloir annuler votre abonnement ?")) {
      cancelMutation.mutate();
    }
  };

  const isActive = subscription?.isActive;
  const daysRemaining = subscription?.daysRemaining;

  const features = [
    { name: "Accès à tous les cours premium", included: true },
    { name: "Ressources éducatives libres illimitées", included: true },
    { name: "Certificats de complétion", included: true },
    { name: "Support prioritaire", included: true },
    { name: "Contenu exclusif", included: true },
    { name: "Mises à jour gratuites", included: true },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation Bar */}
      <div className="border-b bg-background/80 backdrop-blur-lg sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between">
          <h2 className="text-lg font-semibold">Abonnement Premium</h2>
          <BackButton />
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Current Status */}
        {statusLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {isActive && subscription && (
              <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900">Abonnement actif</h3>
                    <p className="text-sm text-green-700">
                      {daysRemaining && daysRemaining > 0
                        ? `Votre abonnement expire dans ${daysRemaining} jours`
                        : "Votre abonnement est actif"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900">Erreur</h3>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Card */}
            <div className="max-w-2xl mx-auto mb-12">
              <Card className="border-2 border-blue-200">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-3xl">Abonnement Premium</CardTitle>
                      <CardDescription>Accès illimité à tous les contenus</CardDescription>
                    </div>
                    <Badge className="bg-blue-600">Populaire</Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-gray-900">10 000</span>
                      <span className="text-xl text-gray-600">XOF/mois</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Abonnement mensuel renouvelable</p>
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    {features.map((feature) => (
                      <div key={feature.name} className="flex items-center gap-3">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300 flex-shrink-0" />
                        )}
                        <span className={feature.included ? "text-gray-900" : "text-gray-400"}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  {!isActive ? (
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={handleSubscribe}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Traitement...
                        </>
                      ) : (
                        "S'abonner maintenant"
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full"
                      onClick={handleCancel}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Annulation...
                        </>
                      ) : (
                        "Annuler l'abonnement"
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* FAQ Section */}
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Questions fréquentes</h3>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Puis-je annuler mon abonnement à tout moment ?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Oui, vous pouvez annuler votre abonnement à tout moment. Vous conserverez l'accès jusqu'à la fin de votre période d'abonnement.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quels sont les modes de paiement acceptés ?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Nous acceptons les paiements via PayTech (Orange Money, Wave, Free Money, etc.) et d'autres méthodes de paiement sécurisées.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Puis-je obtenir un remboursement ?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Les remboursements sont disponibles dans les 7 jours suivant l'achat. Veuillez contacter notre support pour plus d'informations.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
