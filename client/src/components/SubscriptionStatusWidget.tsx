import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { usePremiumStatus } from "@/hooks/usePremiumAccess";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Clock, Crown, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SubscriptionStatusWidget() {
  const { user } = useAuth();
  const { status, isLoading } = usePremiumStatus();
  const isPremium = status.isActive;
  const daysRemaining = status.daysRemaining;
  const endDate = status.expiresAt;
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  useEffect(() => {
    // Check if subscription is expiring within 7 days
    if (daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0) {
      setIsExpiringSoon(true);
    } else {
      setIsExpiringSoon(false);
    }
  }, [daysRemaining]);

  if (!user || isLoading) {
    return null;
  }

  // Don't show widget if user is not premium
  if (!isPremium) {
    return (
      <Link href="/premium">
        <Button variant="default" size="sm" className="gap-2">
          <Crown className="w-4 h-4" />
          Devenir Premium
        </Button>
      </Link>
    );
  }

  const formattedDate = endDate ? new Date(endDate).toLocaleDateString("fr-FR") : "N/A";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium">Premium</span>
            {isExpiringSoon && (
              <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
            )}
            <ChevronDown className="w-4 h-4 opacity-50" />
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        {/* Header */}
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Abonnement Premium</h3>
            <Badge className="bg-amber-100 text-amber-800">Actif</Badge>
          </div>
          <p className="text-sm text-gray-600">
            Accès complet à tous les cours et ressources
          </p>
        </div>

        {/* Status Info */}
        <div className="px-4 py-3 space-y-2 border-b">
          {isExpiringSoon && daysRemaining !== null && (
            <div className="flex items-start gap-2 p-2 bg-red-50 rounded-md border border-red-200">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-red-900">
                  Expire dans {daysRemaining} jour{daysRemaining > 1 ? "s" : ""}
                </p>
                <p className="text-red-700">Renouveler pour continuer l'accès</p>
              </div>
            </div>
          )}

          {!isExpiringSoon && daysRemaining !== null && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700">
                {daysRemaining} jour{daysRemaining > 1 ? "s" : ""} restant{daysRemaining > 1 ? "s" : ""}
              </span>
            </div>
          )}

          <div className="text-sm text-gray-600">
            Expire le : <span className="font-medium">{formattedDate}</span>
          </div>

          <div className="text-sm text-gray-600">
            Plan : <span className="font-medium">Premium - 10 000 XOF/mois</span>
          </div>
        </div>

        {/* Actions */}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard" className="cursor-pointer">
            Mon Tableau de Bord
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/premium" className="cursor-pointer">
            Renouveler l'Abonnement
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin/notification-settings" className="cursor-pointer">
            Paramètres de Notifications
          </Link>
        </DropdownMenuItem>

        {/* Footer */}
        <DropdownMenuSeparator />
        <div className="px-4 py-2 text-xs text-gray-500">
          <p>Besoin d'aide ? Contactez le support</p>
          <p className="text-gray-600">support@digilearn.manus.space</p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
