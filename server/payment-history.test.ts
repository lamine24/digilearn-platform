import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "./db";
import { premiumSubscriptions, paymentHistory, users } from "../drizzle/schema";

describe("Payment History", () => {
  describe("recordPayment", () => {
    it("should record a payment successfully", async () => {
      const result = await db.recordPayment({
        userId: 1,
        amount: "10000",
        currency: "XOF",
        paymentMethod: "paytech",
        transactionId: "TXN-123456",
        status: "success",
        reference: "premium-1",
      });

      expect(result).toBeDefined();
      expect(result.status).toBe("success");
      expect(result.amount).toBe("10000");
    });

    it("should record a failed payment", async () => {
      const result = await db.recordPayment({
        userId: 2,
        amount: "10000",
        currency: "XOF",
        paymentMethod: "paytech",
        transactionId: "TXN-failed-123",
        status: "failed",
        reference: "premium-2",
        errorMessage: "Insufficient funds",
      });

      expect(result.status).toBe("failed");
      expect(result.errorMessage).toBe("Insufficient funds");
    });
  });

  describe("getPaymentHistory", () => {
    it("should retrieve payment history with pagination", async () => {
      const result = await db.getPaymentHistory({
        limit: 10,
        offset: 0,
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(10);
    });

    it("should filter payments by status", async () => {
      const result = await db.getPaymentHistory({
        limit: 10,
        offset: 0,
        status: "success",
      });

      expect(Array.isArray(result)).toBe(true);
      result.forEach((payment: any) => {
        expect(payment.status).toBe("success");
      });
    });

    it("should filter payments by amount range", async () => {
      const result = await db.getPaymentHistory({
        limit: 10,
        offset: 0,
        minAmount: "5000",
        maxAmount: "15000",
      });

      expect(Array.isArray(result)).toBe(true);
      result.forEach((payment: any) => {
        const amount = parseFloat(payment.amount);
        expect(amount).toBeGreaterThanOrEqual(5000);
        expect(amount).toBeLessThanOrEqual(15000);
      });
    });

    it("should filter payments by date range", async () => {
      const startDate = new Date("2026-01-01");
      const endDate = new Date("2026-12-31");

      const result = await db.getPaymentHistory({
        limit: 10,
        offset: 0,
        startDate,
        endDate,
      });

      expect(Array.isArray(result)).toBe(true);
      result.forEach((payment: any) => {
        const paymentDate = new Date(payment.createdAt);
        expect(paymentDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(paymentDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });
  });

  describe("getPaymentHistoryCount", () => {
    it("should count total payments", async () => {
      const count = await db.getPaymentHistoryCount({
        limit: 10,
        offset: 0,
      });

      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it("should count payments with filters", async () => {
      const count = await db.getPaymentHistoryCount({
        limit: 10,
        offset: 0,
        status: "success",
      });

      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getPaymentStatistics", () => {
    it("should calculate payment statistics", async () => {
      const stats = await db.getPaymentStatistics({});

      expect(stats).toBeDefined();
      expect(typeof stats.totalTransactions).toBe("number");
      expect(typeof stats.totalAmount).toBe("string");
      expect(typeof stats.successfulTransactions).toBe("number");
      expect(typeof stats.failedTransactions).toBe("number");
      expect(typeof stats.averageAmount).toBe("string");
    });

    it("should calculate statistics for date range", async () => {
      const startDate = new Date("2026-01-01");
      const endDate = new Date("2026-12-31");

      const stats = await db.getPaymentStatistics({
        startDate,
        endDate,
      });

      expect(stats).toBeDefined();
      expect(stats.totalTransactions).toBeGreaterThanOrEqual(0);
    });
  });

  describe("updatePaymentHistoryStatus", () => {
    it("should update payment status", async () => {
      // First record a payment
      const payment = await db.recordPayment({
        userId: 3,
        amount: "10000",
        currency: "XOF",
        paymentMethod: "paytech",
        transactionId: "TXN-update-123",
        status: "pending",
        reference: "premium-3",
      });

      // Update its status
      const updated = await db.updatePaymentHistoryStatus(
        payment.id,
        "success",
        "Payment confirmed"
      );

      expect(updated.status).toBe("success");
      expect(updated.notes).toContain("Payment confirmed");
    });
  });
});
