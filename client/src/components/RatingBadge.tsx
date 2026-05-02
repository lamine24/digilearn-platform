import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingBadgeProps {
  rating: number;
  maxRating?: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function RatingBadge({
  rating,
  maxRating = 5,
  showLabel = true,
  size = "md",
  className,
}: RatingBadgeProps) {
  const percentage = (rating / maxRating) * 100;
  const displayRating = Math.min(Math.max(rating, 0), maxRating);

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-0.5">
        {[...Array(maxRating)].map((_, i) => (
          <div key={i} className="relative">
            <Star className={cn(sizeClasses[size], "text-gray-300")} />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${i < displayRating ? 100 : Math.max(0, percentage - i * 20)}%` }}>
              <Star className={cn(sizeClasses[size], "text-yellow-400 fill-yellow-400")} />
            </div>
          </div>
        ))}
      </div>
      {showLabel && <span className={cn(textSizeClasses[size], "font-medium text-foreground")}>{displayRating.toFixed(1)}</span>}
    </div>
  );
}
