import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PlatformBadgeProps {
  platform: "udemy" | "coursera" | "youtube" | "other";
  variant?: "default" | "secondary" | "outline" | "destructive";
  className?: string;
}

const platformConfig = {
  udemy: {
    icon: "🎓",
    label: "Udemy",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
  coursera: {
    icon: "📚",
    label: "Coursera",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  youtube: {
    icon: "▶️",
    label: "YouTube",
    color: "bg-red-100 text-red-800 border-red-200",
  },
  other: {
    icon: "🔗",
    label: "Autre plateforme",
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
};

export function PlatformBadge({ platform, variant = "default", className }: PlatformBadgeProps) {
  const config = platformConfig[platform];

  return (
    <Badge variant={variant} className={cn(config.color, "gap-1.5", className)}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </Badge>
  );
}
