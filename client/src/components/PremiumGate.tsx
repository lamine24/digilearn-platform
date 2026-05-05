import React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePremiumAccess, usePremiumStatus } from "@/hooks/usePremiumAccess";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Lock, Clock, LogIn } from "lucide-react";
import { Link } from "wouter";

interface PremiumGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  resourceName?: string;
}

/**
 * Component to gate premium content
 * Shows content only to premium users or admins
 * Redirects unauthenticated users to login
 * Shows upgrade prompt to non-premium users
 */
export function PremiumGate({ children, fallback, resourceName = "contenu" }: PremiumGateProps) {
  const { user } = useAuth();
  const { isPremium, isLoading } = usePremiumAccess();
  const { status } = usePremiumStatus();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  // Unauthenticated users need to log in
  if (!user) {
    return (
      fallback || (
        <Card className="border-blue-200 bg-blue-50 m-4">
          <CardHeader>
            <div className="flex items-start gap-3">
              <LogIn className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <CardTitle className="text-lg">Connexion requise</CardTitle>
                <CardDescription>
                  Veuillez vous connecter pour accéder à ce {resourceName}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Créez un compte ou connectez-vous pour accéder à nos contenus premium et ressources exclusives.
            </p>
            <a href={getLoginUrl()}>
              <Button className="w-full" size="lg">
                Se connecter
              </Button>
            </a>
          </CardContent>
        </Card>
      )
    );
  }

  // Admin and premium users can access
  if (user.role === "admin" || isPremium) {
    return <>{children}</>;
  }

  // Non-premium users see upgrade prompt
  return (
    fallback || (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <CardTitle className="text-lg">Contenu Premium</CardTitle>
              <CardDescription>
                Accès à ce {resourceName} réservé aux abonnés premium
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Débloquez l'accès à tous nos contenus premium, cours avancés et ressources exclusives
            en vous abonnant dès maintenant.
          </p>

          <div className="bg-white rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              <span>Accès illimité à tous les contenus premium</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              <span>Cours avancés et certifications</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              <span>Support prioritaire</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              <span>10 000 FCFA/mois - Annulation à tout moment</span>
            </div>
          </div>

          <Link href="/premium-subscription">
            <Button className="w-full" size="lg">
              S'abonner maintenant
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  );
}

/**
 * Component to show premium subscription status
 */
export function PremiumStatusBadge() {
  const { user } = useAuth();
  const { isPremium } = usePremiumAccess();
  const { status } = usePremiumStatus();

  if (!user || !isPremium) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-sm">
      <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
      <span className="text-blue-700 font-medium">Premium</span>
      {status.daysRemaining !== null && (
        <span className="text-blue-600 text-xs">
          ({status.daysRemaining} jours restants)
        </span>
      )}
    </div>
  );
}

/**
 * Component to show expiration warning
 */
export function PremiumExpirationWarning() {
  const { isPremium } = usePremiumAccess();
  const { status } = usePremiumStatus();

  if (!isPremium || !status.daysRemaining) return null;

  // Show warning if less than 7 days remaining
  if (status.daysRemaining > 7) return null;

  return (
    <Card className="border-orange-200 bg-orange-50 mb-4">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-orange-900">
              Votre abonnement expire dans {status.daysRemaining} jour{status.daysRemaining > 1 ? "s" : ""}
            </p>
            <p className="text-sm text-orange-800 mt-1">
              Renouvelez votre abonnement pour continuer à accéder aux contenus premium.
            </p>
            <Link href="/premium-subscription">
              <Button variant="outline" size="sm" className="mt-3">
                Renouveler l'abonnement
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Component to show premium-only badge on content
 */
export function PremiumBadge() {
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold rounded-full">
      <Lock className="h-3 w-3" />
      Premium
    </div>
  );
}
