import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Link, useSearch } from "wouter";
import { CheckCircle2, GraduationCap, ArrowRight } from "lucide-react";
import { useEffect } from "react";

export default function PaymentSuccess() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const ref = params.get("ref") || "";
  const confirmMutation = trpc.payments.confirmPayment.useMutation();

  useEffect(() => {
    if (ref) {
      confirmMutation.mutate({ ref });
    }
  }, [ref]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Paiement réussi !</h1>
          <p className="text-muted-foreground mb-6">
            Votre inscription a été confirmée. Vous pouvez maintenant accéder à votre formation.
          </p>
          {ref && <p className="text-xs text-muted-foreground mb-4">Réf: {ref}</p>}
          <Link href="/dashboard">
            <Button size="lg" className="w-full">
              Accéder à mon espace <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
