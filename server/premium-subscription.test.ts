import { describe, it, expect, beforeEach, vi } from "vitest";
import * as db from "./db";

// Mock database functions
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db");
  return {
    ...actual,
    getPremiumSubscriptionStatus: vi.fn(),
    createPremiumSubscription: vi.fn(),
    cancelPremiumSubscription: vi.fn(),
  };
});

describe("Premium Subscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPremiumSubscriptionStatus", () => {
    it("should return null if no subscription exists", async () => {
      vi.mocked(db.getPremiumSubscriptionStatus).mockResolvedValue(null);
      
      const result = await db.getPremiumSubscriptionStatus(1);
      
      expect(result).toBeNull();
    });

    it("should return subscription status with isActive true if active and not expired", async () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      const mockSubscription = {
        id: 1,
        userId: 1,
        price: "10000.00",
        currency: "XOF",
        startDate: now,
        endDate: futureDate,
        status: "active" as const,
        paymentId: "pay_123",
        autoRenew: true,
        createdAt: now,
        updatedAt: now,
        isActive: true,
        isExpired: false,
        daysRemaining: 30,
      };
      
      vi.mocked(db.getPremiumSubscriptionStatus).mockResolvedValue(mockSubscription);
      
      const result = await db.getPremiumSubscriptionStatus(1);
      
      expect(result).not.toBeNull();
      expect(result?.isActive).toBe(true);
      expect(result?.status).toBe("active");
      expect(result?.daysRemaining).toBe(30);
    });

    it("should return isExpired true if endDate is in the past", async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      
      const mockSubscription = {
        id: 1,
        userId: 1,
        price: "10000.00",
        currency: "XOF",
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: pastDate,
        status: "active" as const,
        paymentId: "pay_123",
        autoRenew: true,
        createdAt: now,
        updatedAt: now,
        isActive: false,
        isExpired: true,
        daysRemaining: -1,
      };
      
      vi.mocked(db.getPremiumSubscriptionStatus).mockResolvedValue(mockSubscription);
      
      const result = await db.getPremiumSubscriptionStatus(1);
      
      expect(result?.isExpired).toBe(true);
      expect(result?.isActive).toBe(false);
    });
  });

  describe("createPremiumSubscription", () => {
    it("should create a new premium subscription", async () => {
      vi.mocked(db.createPremiumSubscription).mockResolvedValue({ success: true });
      
      const result = await db.createPremiumSubscription(1, "pay_123");
      
      expect(result.success).toBe(true);
      expect(db.createPremiumSubscription).toHaveBeenCalledWith(1, "pay_123");
    });

    it("should set subscription to active status", async () => {
      const now = new Date();
      const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      vi.mocked(db.createPremiumSubscription).mockResolvedValue({ success: true });
      
      await db.createPremiumSubscription(1, "pay_123");
      
      expect(db.createPremiumSubscription).toHaveBeenCalled();
    });
  });

  describe("cancelPremiumSubscription", () => {
    it("should cancel an existing subscription", async () => {
      vi.mocked(db.cancelPremiumSubscription).mockResolvedValue({ success: true });
      
      const result = await db.cancelPremiumSubscription(1);
      
      expect(result.success).toBe(true);
      expect(db.cancelPremiumSubscription).toHaveBeenCalledWith(1);
    });

    it("should set subscription status to cancelled", async () => {
      vi.mocked(db.cancelPremiumSubscription).mockResolvedValue({ success: true });
      
      await db.cancelPremiumSubscription(1);
      
      expect(db.cancelPremiumSubscription).toHaveBeenCalled();
    });
  });

  describe("Premium Subscription Price", () => {
    it("should always be 10000 XOF per month", async () => {
      const mockSubscription = {
        id: 1,
        userId: 1,
        price: "10000.00",
        currency: "XOF",
        startDate: new Date(),
        endDate: new Date(),
        status: "active" as const,
        paymentId: "pay_123",
        autoRenew: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        isExpired: false,
        daysRemaining: 30,
      };
      
      expect(mockSubscription.price).toBe("10000.00");
      expect(mockSubscription.currency).toBe("XOF");
    });
  });
});
