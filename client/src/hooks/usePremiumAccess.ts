import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export interface PremiumStatus {
  isActive: boolean;
  daysRemaining: number | null;
  expiresAt: Date | null;
  renewalUrl?: string;
}

/**
 * Hook to check if current user has premium access
 * Queries the real tRPC endpoint for premium status
 */
export function usePremiumAccess() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Query premium status from tRPC
  const statusQuery = trpc.premium.getStatus.useQuery(undefined, {
    enabled: !!user,
    retry: 1,
  });

  useEffect(() => {
    if (!user) {
      setIsPremium(false);
      setIsLoading(false);
      return;
    }

    if (statusQuery.isLoading) {
      setIsLoading(true);
      return;
    }

    if (statusQuery.error) {
      setError(statusQuery.error.message);
      setIsPremium(false);
      setIsLoading(false);
      return;
    }

    if (statusQuery.data) {
      setIsPremium(statusQuery.data.isActive || false);
      setError(null);
    }

    setIsLoading(false);
  }, [user, statusQuery.isLoading, statusQuery.error, statusQuery.data]);

  return { isPremium, isLoading, error };
}

/**
 * Hook to get detailed premium subscription status
 * Queries the real tRPC endpoint for detailed status information
 */
export function usePremiumStatus() {
  const { user } = useAuth();
  const [status, setStatus] = useState<PremiumStatus>({
    isActive: false,
    daysRemaining: null,
    expiresAt: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Query premium status from tRPC
  const statusQuery = trpc.premium.getStatus.useQuery(undefined, {
    enabled: !!user,
    retry: 1,
  });

  useEffect(() => {
    if (!user) {
      setStatus({
        isActive: false,
        daysRemaining: null,
        expiresAt: null,
      });
      setIsLoading(false);
      return;
    }

    if (statusQuery.isLoading) {
      setIsLoading(true);
      return;
    }

    if (statusQuery.error) {
      setError(statusQuery.error.message);
      setStatus({
        isActive: false,
        daysRemaining: null,
        expiresAt: null,
      });
      setIsLoading(false);
      return;
    }

    if (statusQuery.data) {
      setStatus({
        isActive: statusQuery.data.isActive || false,
        daysRemaining: statusQuery.data.daysRemaining || null,
        expiresAt: statusQuery.data.endDate ? new Date(statusQuery.data.endDate) : null,
        renewalUrl: "/premium-subscription",
      });
      setError(null);
    }

    setIsLoading(false);
  }, [user, statusQuery.isLoading, statusQuery.error, statusQuery.data]);

  return { status, isLoading, error };
}

/**
 * Hook to check if user can access premium content
 * Returns true if user is premium or admin
 */
export function useCanAccessPremium() {
  const { user } = useAuth();
  const { isPremium } = usePremiumAccess();

  if (!user) return false;
  if (user.role === "admin") return true;
  return isPremium;
}

/**
 * Hook to redirect to premium subscription if not premium
 */
export function useRequirePremium() {
  const { user } = useAuth();
  const { isPremium, isLoading } = usePremiumAccess();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      setShouldRedirect(true);
      return;
    }

    if (user.role !== "admin" && !isPremium) {
      setShouldRedirect(true);
      return;
    }

    setShouldRedirect(false);
  }, [user, isPremium, isLoading]);

  return { shouldRedirect, isLoading };
}

/**
 * Hook to get premium subscription renewal URL
 */
export function usePremiumRenewalUrl() {
  const { status } = usePremiumStatus();
  return status.renewalUrl || "/premium-subscription";
}
