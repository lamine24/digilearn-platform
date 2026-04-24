import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { XCircle, ArrowLeft } from "lucide-react";

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Paiement annulé</h1>
          <p className="text-muted-foreground mb-6">
            Le paiement a été annulé. Vous pouvez réessayer à tout moment.
          </p>
          <Link href="/">
            <Button size="lg" variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour au catalogue
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
