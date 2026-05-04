import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface BackButtonProps {
  label?: string;
  className?: string;
}

export function BackButton({ label = "Retour à l'accueil", className = "" }: BackButtonProps) {
  const [, navigate] = useLocation();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate("/")}
      className={`flex items-center gap-2 ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
