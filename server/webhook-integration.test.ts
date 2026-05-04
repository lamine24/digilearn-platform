import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  validateIPNPayload,
  storeWebhookRequest,
  isWebhookProcessed,
  getWebhookByRefCommand,
  recordWebhookError,
  checkRateLimit,
  generateWebhookId,
} from "./webhook-security";

describe("Webhook Security & Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateIPNPayload", () => {
    it("should validate a correct IPN payload", () => {
      const payload = {
        ref_command: "premium-123-1234567890",
        type_event: "sale_complete",
        sen_hash: "abc123def456",
        sen_merchant_id: "merchant_123",
        sen_amount: "10000",
        sen_currency: "XOF",
      };

      const result = validateIPNPayload(payload);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject payload with missing ref_command", () => {
      const payload = {
        type_event: "sale_complete",
        sen_hash: "abc123def456",
      };

      const result = validateIPNPayload(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing ref_command");
    });

    it("should reject payload with missing type_event", () => {
      const payload = {
        ref_command: "premium-123-1234567890",
        sen_hash: "abc123def456",
      };

      const result = validateIPNPayload(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Missing type_event");
    });

    it("should reject payload with invalid type_event", () => {
      const payload = {
        ref_command: "premium-123-1234567890",
        type_event: "invalid_event",
        sen_hash: "abc123def456",
      };

      const result = validateIPNPayload(payload);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid type_event: invalid_event");
    });

    it("should accept all valid type_events", () => {
      const validEvents = ["sale_complete", "sale_canceled", "sale_failed"];

      validEvents.forEach((event) => {
        const payload = {
          ref_command: "premium-123-1234567890",
          type_event: event,
          sen_hash: "abc123def456",
        };

        const result = validateIPNPayload(payload);

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });
  });

  describe("Webhook Storage & Idempotency", () => {
    it("should store webhook request", () => {
      const payload = {
        ref_command: "premium-123-1234567890",
        type_event: "sale_complete",
      };

      const webhook = storeWebhookRequest(payload, "hash123");

      expect(webhook.id).toBeDefined();
      expect(webhook.payload).toEqual(payload);
      expect(webhook.signature).toBe("hash123");
      expect(webhook.retryCount).toBe(0);
    });

    it("should generate unique webhook IDs", () => {
      const id1 = generateWebhookId();
      const id2 = generateWebhookId();

      expect(id1).toMatch(/^wh_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^wh_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it("should detect duplicate webhooks", () => {
      const payload = {
        ref_command: "premium-123-1234567890",
        type_event: "sale_complete",
      };

      storeWebhookRequest(payload, "hash123");

      expect(isWebhookProcessed("premium-123-1234567890")).toBe(true);
      expect(isWebhookProcessed("premium-456-9876543210")).toBe(false);
    });

    it("should retrieve webhook by ref_command", () => {
      const payload = {
        ref_command: "premium-123-1234567890",
        type_event: "sale_complete",
      };

      const stored = storeWebhookRequest(payload, "hash123");
      const retrieved = getWebhookByRefCommand("premium-123-1234567890");

      expect(retrieved).toBeDefined();
      expect(retrieved?.payload.ref_command).toBe("premium-123-1234567890");
    });

    it("should record webhook errors", () => {
      const payload = {
        ref_command: "premium-123-1234567890",
        type_event: "sale_complete",
      };

      storeWebhookRequest(payload, "hash123");
      recordWebhookError("premium-123-1234567890", "Test error");

      const webhook = getWebhookByRefCommand("premium-123-1234567890");

      expect(webhook?.lastError).toBe("Test error");
      expect(webhook?.retryCount).toBe(1);
    });
  });

  describe("Rate Limiting", () => {
    it("should allow requests within rate limit", () => {
      const testIp = `test-ip-${Math.random()}`;
      const result1 = checkRateLimit(testIp, 10, 60000);
      const result2 = checkRateLimit(testIp, 10, 60000);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });

    it("should track rate limit per IP", () => {
      const ip = `test-ip-${Math.random()}`;
      const maxRequests = 5;

      // Make requests up to the limit
      const results = [];
      for (let i = 0; i < maxRequests + 1; i++) {
        results.push(checkRateLimit(ip, maxRequests, 60000));
      }

      // First 5 should succeed, 6th should fail
      expect(results.slice(0, 5).every((r) => r === true)).toBe(true);
      expect(results[5]).toBe(false);
    });

    it("should allow different IPs to have independent limits", () => {
      const ip1 = `test-ip-${Math.random()}`;
      const ip2 = `test-ip-${Math.random()}`;
      const maxRequests = 3;

      // IP 1 makes 3 requests
      for (let i = 0; i < maxRequests; i++) {
        expect(checkRateLimit(ip1, maxRequests, 60000)).toBe(true);
      }

      // IP 2 should still be able to make requests independently
      expect(checkRateLimit(ip2, maxRequests, 60000)).toBe(true);
      expect(checkRateLimit(ip2, maxRequests, 60000)).toBe(true);
      expect(checkRateLimit(ip2, maxRequests, 60000)).toBe(true);
    });
  });

  describe("Premium Subscription Webhook Flow", () => {
    it("should process a complete premium subscription payment", () => {
      const payload = {
        ref_command: "premium-123-1234567890",
        type_event: "sale_complete",
        sen_hash: "abc123def456",
        sen_merchant_id: "merchant_123",
        sen_amount: "10000",
        sen_currency: "XOF",
      };

      // Validate payload
      const validation = validateIPNPayload(payload);
      expect(validation.valid).toBe(true);

      // Store webhook
      const webhook = storeWebhookRequest(payload, payload.sen_hash);
      expect(webhook).toBeDefined();

      // Check idempotency
      expect(isWebhookProcessed("premium-123-1234567890")).toBe(true);

      // Verify ref_command format for premium
      expect(payload.ref_command).toMatch(/^premium-\d+-\d+$/);
    });

    it("should handle webhook retry logic", () => {
      const payload = {
        ref_command: "premium-123-1234567890",
        type_event: "sale_complete",
      };

      const webhook = storeWebhookRequest(payload, "hash123");
      expect(webhook.retryCount).toBe(0);

      // Simulate error
      recordWebhookError("premium-123-1234567890", "Database connection error");

      const updated = getWebhookByRefCommand("premium-123-1234567890");
      expect(updated?.retryCount).toBe(1);
      expect(updated?.lastError).toBe("Database connection error");

      // Simulate another error
      recordWebhookError("premium-123-1234567890", "Timeout error");

      const updated2 = getWebhookByRefCommand("premium-123-1234567890");
      expect(updated2?.retryCount).toBe(2);
    });
  });
});
