import { Button } from "@/components/ui/button";
import { ExternalLink, Lock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

interface CourseAccessButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  requiresSubscription: boolean;
  isSubscribed: boolean;
  isLoading?: boolean;
  onAccess: () => void;
  onSubscribe?: () => void;
}

export function CourseAccessButton({
  requiresSubscription,
  isSubscribed,
  isLoading = false,
  onAccess,
  onSubscribe,
  className = "",
  ...props
}: CourseAccessButtonProps) {
  const isLocked = requiresSubscription && !isSubscribed;

  if (isLocked) {
    return (
      <div className="space-y-2">
        <Button
          onClick={onSubscribe}
          className={cn("w-full h-12 text-base", className)}
          size="lg"
          {...props}
        >
          <Lock className="h-4 w-4 mr-2" />
          S'abonner pour accéder
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Abonnement requis pour accéder à ce cours
        </p>
      </div>
    );
  }

  return (
    <Button
      onClick={onAccess}
      disabled={isLoading}
      className={cn("w-full h-12 text-base", className)}
      size="lg"
      {...props}
    >
      {isSubscribed ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Accès déverrouillé
        </>
      ) : (
        <>
          <ExternalLink className="h-4 w-4 mr-2" />
          {isLoading ? "Redirection..." : "Accéder au cours"}
        </>
      )}
    </Button>
  );
}
