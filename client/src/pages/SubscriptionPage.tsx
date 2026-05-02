import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";

const SUBSCRIPTION_PLANS = [
  {
    id: "monthly",
    name: "Mensuel",
    price: "10,000",
    currency: "XOF",
    period: "par mois",
    description: "Accès à tous les cours externes",
    features: [
      "Accès illimité aux cours Udemy",
      "Accès illimité aux cours Coursera",
      "Accès illimité aux ressources YouTube",
      "Support par email",
      "Certificats téléchargeables",
    ],
    planType: "monthly" as const,
  },
  {
    id: "yearly",
    name: "Annuel",
    price: "100,000",
    currency: "XOF",
    period: "par an",
    description: "Meilleure valeur",
    features: [
      "Accès illimité à tous les cours",
      "Priorité support",
      "Certificats premium",
      "Accès aux webinaires exclusifs",
      "Réduction 17% par rapport au mensuel",
    ],
    planType: "yearly" as const,
    badge: "Économisez 8,000 XOF",
  },
  {
    id: "lifetime",
    name: "Accès à Vie",
    price: "500,000",
    currency: "XOF",
    period: "une seule fois",
    description: "Investissement ultime",
    features: [
      "Accès illimité à vie",
      "Tous les nouveaux cours inclus",
      "Support prioritaire 24/7",
      "Certificats à vie",
      "Accès aux contenus premium",
    ],
    planType: "lifetime" as const,
    badge: "Meilleure affaire",
  },
];

export default function SubscriptionPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly" | "lifetime">("monthly");
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: currentSubscription } = trpc.subscriptions.getUserSubscription.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const handleSubscribe = async (planType: "monthly" | "yearly" | "lifetime") => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    setIsProcessing(true);
    try {
      // Find the plan details
      const plan = SUBSCRIPTION_PLANS.find((p) => p.planType === planType);
      if (!plan) throw new Error("Plan not found");

      // Initiate payment through PayTech
      const response = await fetch("/api/paytech/subscription/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: plan.price.replace(/,/g, ""),
          currency: plan.currency,
          description: `Abonnement ${plan.name} - DigiLearn`,
          planType: planType,
          userId: user?.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to initiate payment");

      const data = await response.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        toast.error("Erreur lors de l'initiation du paiement");
      }
    } catch (error: any) {
      toast.error(error.message || "Une erreur s'est produite");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Connexion requise</CardTitle>
            <CardDescription>Veuillez vous connecter pour accéder aux abonnements</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => (window.location.href = getLoginUrl())} className="w-full">
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Plans d'Abonnement DigiLearn</h1>
          <p className="text-xl text-muted-foreground">
            Accédez à des milliers de cours de Udemy, Coursera, YouTube et bien d'autres
          </p>
          {currentSubscription && currentSubscription.endDate && (
            <div className="mt-6">
              <Badge className="bg-green-100 text-green-800">
                ✓ Vous avez un abonnement actif jusqu'au {new Date(currentSubscription.endDate).toLocaleDateString("fr-FR")}
              </Badge>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`relative transition-all ${
                selectedPlan === plan.planType ? "ring-2 ring-primary shadow-lg" : ""
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-white">{plan.badge}</Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Price */}
                <div>
                  <div className="text-4xl font-bold">
                    {plan.price}
                    <span className="text-sm text-muted-foreground ml-2">{plan.currency}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.period}</p>
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  onClick={() => handleSubscribe(plan.planType)}
                  disabled={isProcessing || !!currentSubscription}
                  className="w-full"
                  size="lg"
                >
                  {currentSubscription ? "Vous êtes abonné" : "S'abonner maintenant"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Questions Fréquentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Puis-je changer de plan ?</h4>
              <p className="text-sm text-muted-foreground">
                Oui, vous pouvez mettre à niveau ou rétrograder votre plan à tout moment. Les frais seront ajustés au prorata.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Puis-je annuler mon abonnement ?</h4>
              <p className="text-sm text-muted-foreground">
                Oui, vous pouvez annuler votre abonnement à tout moment. Vous conserverez l'accès jusqu'à la fin de votre période de facturation.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Quels sont les modes de paiement acceptés ?</h4>
              <p className="text-sm text-muted-foreground">
                Nous acceptons les paiements via PayTech, qui supporte Orange Money, Wave, Free Money et les cartes bancaires.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Y a-t-il une période d'essai gratuit ?</h4>
              <p className="text-sm text-muted-foreground">
                Non, mais vous pouvez commencer par l'abonnement mensuel et l'annuler à tout moment si vous n'êtes pas satisfait.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
