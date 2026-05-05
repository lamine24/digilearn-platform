import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SubscriptionStatusWidget } from "./SubscriptionStatusWidget";
import * as useAuthModule from "@/_core/hooks/useAuth";
import * as usePremiumAccessModule from "@/hooks/usePremiumAccess";

describe("SubscriptionStatusWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when user is not authenticated", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
      getLoginUrl: vi.fn(),
    } as any);

    vi.spyOn(usePremiumAccessModule, "usePremiumStatus").mockReturnValue({
      status: { isActive: false, daysRemaining: null, expiresAt: null },
      isLoading: false,
      error: null,
    } as any);

    const { container } = render(<SubscriptionStatusWidget />);
    expect(container.firstChild).toBeNull();
  });

  it("should show 'Devenir Premium' button when user is not premium", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: { id: 1, name: "Test User", role: "apprenant" },
      isAuthenticated: true,
      logout: vi.fn(),
      getLoginUrl: vi.fn(),
    } as any);

    vi.spyOn(usePremiumAccessModule, "usePremiumStatus").mockReturnValue({
      status: { isActive: false, daysRemaining: null, expiresAt: null },
      isLoading: false,
      error: null,
    } as any);

    render(<SubscriptionStatusWidget />);
    expect(screen.getByText("Devenir Premium")).toBeInTheDocument();
  });

  it("should show premium status when user has active subscription", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);

    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: { id: 1, name: "Test User", role: "apprenant" },
      isAuthenticated: true,
      logout: vi.fn(),
      getLoginUrl: vi.fn(),
    } as any);

    vi.spyOn(usePremiumAccessModule, "usePremiumStatus").mockReturnValue({
      status: {
        isActive: true,
        daysRemaining: 15,
        expiresAt: futureDate,
      },
      isLoading: false,
      error: null,
    } as any);

    render(<SubscriptionStatusWidget />);
    expect(screen.getByText("Premium")).toBeInTheDocument();
    expect(screen.getByText("Abonnement Premium")).toBeInTheDocument();
  });

  it("should show expiration warning when subscription expires within 7 days", () => {
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 5);

    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: { id: 1, name: "Test User", role: "apprenant" },
      isAuthenticated: true,
      logout: vi.fn(),
      getLoginUrl: vi.fn(),
    } as any);

    vi.spyOn(usePremiumAccessModule, "usePremiumStatus").mockReturnValue({
      status: {
        isActive: true,
        daysRemaining: 5,
        expiresAt: soonDate,
      },
      isLoading: false,
      error: null,
    } as any);

    render(<SubscriptionStatusWidget />);
    expect(screen.getByText(/Expire dans 5 jours/)).toBeInTheDocument();
    expect(screen.getByText("Renouveler pour continuer l'accès")).toBeInTheDocument();
  });

  it("should display correct number of days remaining", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 20);

    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: { id: 1, name: "Test User", role: "apprenant" },
      isAuthenticated: true,
      logout: vi.fn(),
      getLoginUrl: vi.fn(),
    } as any);

    vi.spyOn(usePremiumAccessModule, "usePremiumStatus").mockReturnValue({
      status: {
        isActive: true,
        daysRemaining: 20,
        expiresAt: futureDate,
      },
      isLoading: false,
      error: null,
    } as any);

    render(<SubscriptionStatusWidget />);
    expect(screen.getByText(/20 jours restants/)).toBeInTheDocument();
  });

  it("should show loading state", () => {
    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: { id: 1, name: "Test User", role: "apprenant" },
      isAuthenticated: true,
      logout: vi.fn(),
      getLoginUrl: vi.fn(),
    } as any);

    vi.spyOn(usePremiumAccessModule, "usePremiumStatus").mockReturnValue({
      status: { isActive: false, daysRemaining: null, expiresAt: null },
      isLoading: true,
      error: null,
    } as any);

    const { container } = render(<SubscriptionStatusWidget />);
    expect(container.firstChild).toBeNull();
  });

  it("should display premium plan details", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    vi.spyOn(useAuthModule, "useAuth").mockReturnValue({
      user: { id: 1, name: "Test User", role: "apprenant" },
      isAuthenticated: true,
      logout: vi.fn(),
      getLoginUrl: vi.fn(),
    } as any);

    vi.spyOn(usePremiumAccessModule, "usePremiumStatus").mockReturnValue({
      status: {
        isActive: true,
        daysRemaining: 10,
        expiresAt: futureDate,
      },
      isLoading: false,
      error: null,
    } as any);

    render(<SubscriptionStatusWidget />);
    expect(screen.getByText(/Premium - 10 000 XOF\/mois/)).toBeInTheDocument();
  });
});
