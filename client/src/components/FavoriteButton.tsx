import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  courseId?: number;
  externalCourseId?: number;
  courseType: "internal" | "external";
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "ghost" | "outline";
}

export function FavoriteButton({
  courseId,
  externalCourseId,
  courseType,
  className = "",
  size = "md",
  variant = "ghost",
}: FavoriteButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if course is favorited
  const { data: favoriteStatus } = trpc.favorites.isFavorited.useQuery(
    {
      courseId: courseId || undefined,
      externalCourseId: externalCourseId || undefined,
      courseType,
    },
    {
      enabled: isAuthenticated && (!!courseId || !!externalCourseId),
    }
  );

  useEffect(() => {
    if (favoriteStatus?.favorited !== undefined) {
      setIsFavorited(favoriteStatus.favorited);
    }
  }, [favoriteStatus]);

  // Mutations
  const addMutation = trpc.favorites.add.useMutation();
  const removeMutation = trpc.favorites.remove.useMutation();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }

    if (!courseId && !externalCourseId) return;

    setIsLoading(true);

    try {
      if (isFavorited) {
        await removeMutation.mutateAsync({
          courseId: courseId || undefined,
          externalCourseId: externalCourseId || undefined,
          courseType,
        });
        setIsFavorited(false);
      } else {
        await addMutation.mutateAsync({
          courseId: courseId || undefined,
          externalCourseId: externalCourseId || undefined,
          courseType,
        });
        setIsFavorited(true);
      }
    } catch (error) {
      console.error("Error updating favorite:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading}
      variant={variant}
      size="icon"
      className={cn(
        sizeClasses[size],
        isFavorited && "text-red-500 hover:text-red-600",
        !isFavorited && "text-muted-foreground hover:text-foreground",
        className
      )}
      title={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <Heart
        size={iconSize[size]}
        className={isFavorited ? "fill-current" : ""}
      />
    </Button>
  );
}
