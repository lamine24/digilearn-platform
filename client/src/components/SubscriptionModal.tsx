import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceId: number;
  resourceTitle: string;
}

export function SubscriptionModal({ isOpen, onClose, resourceId, resourceTitle }: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { data: plans = [] } = trpc.subscription.getPlans.useQuery();
  const createSubscription = trpc.subscription.createSubscription.useMutation();
  const grantAccess = trpc.subscription.grantResourceAccess.useMutation();

  const handleSubscribe = async (planType: string) => {
    setIsLoading(true);
    try {
      const result = await createSubscription.mutateAsync({ planType: planType as any });
      
      // Grant access to the resource
      await grantAccess.mutateAsync({ resourceId });
      
      // Close modal and show success
      onClose();
      alert(`Abonnement ${planType} créé avec succès! Vous avez maintenant accès à la ressource.`);
    } catch (error) {
      console.error("Erreur lors de la création de l'abonnement:", error);
      alert("Erreur lors de la création de l'abonnement");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Débloquer l'accès à "{resourceTitle}"</DialogTitle>
          <DialogDescription>
            Choisissez un plan d'abonnement pour accéder à cette ressource premium
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
          {plans && plans.length > 0 ? (
            plans.map((plan: any) => {
              if (!plan) return null;
              return (
                <Card 
                  key={plan.id} 
                  className={`p-6 cursor-pointer transition-all ${selectedPlan === plan.type ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`} 
                  onClick={() => setSelectedPlan(plan.type)}
                >
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-lg">{plan.name || 'Plan'}</h3>
                      <p className="text-sm text-gray-600">{plan.durationDays || 0} jours</p>
                    </div>

                    <div className="text-3xl font-bold">
                      {typeof plan.price === 'number' ? plan.price.toLocaleString('fr-FR') : '0'} <span className="text-sm text-gray-600">{plan.currency || 'XOF'}</span>
                    </div>

                    <div className="space-y-2">
                      {plan.features ? (
                        JSON.parse(plan.features).map((feature: string, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500" />
                            <span>{feature}</span>
                          </div>
                        ))
                      ) : null}
                    </div>

                    <Button
                      onClick={() => handleSubscribe(plan.type)}
                      disabled={isLoading}
                      className="w-full"
                      variant={selectedPlan === plan.type ? "default" : "outline"}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Traitement...
                        </>
                      ) : (
                        "Choisir ce plan"
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })
          ) : (
            <div className="col-span-3 text-center text-gray-500">Chargement des plans...</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
