import crypto from "crypto";
import { ENV } from "./_core/env";

/**
 * Webhook request with metadata for tracking and security
 */
export interface WebhookRequest {
  id: string;
  timestamp: Date;
  signature: string;
  payload: Record<string, any>;
  retryCount: number;
  lastError?: string;
}

/**
 * In-memory store for webhook requests (in production, use a database)
 */
const webhookStore = new Map<string, WebhookRequest>();

/**
 * Generate a unique webhook ID for tracking
 */
export function generateWebhookId(): string {
  return `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Verify webhook signature from PayTech
 */
export function verifyWebhookSignature(
  payload: Record<string, string>,
  signature: string
): boolean {
  if (!ENV.paytechSecretKey) {
    console.warn("[Webhook Security] PayTech secret key not configured");
    return false;
  }

  // PayTech signature verification
  // Hash = SHA256(SEN_MERCHANT_KEY + SEN_MERCHANT_ID + SEN_REFERENCE_COMMAND + SEN_AMOUNT + SEN_CURRENCY + SEN_TYPE_EVENT)
  const expectedHash = crypto
    .createHash("sha256")
    .update(
      ENV.paytechSecretKey +
      (payload.sen_merchant_id || "") +
      payload.ref_command +
      (payload.sen_amount || "") +
      (payload.sen_currency || "") +
      payload.type_event
    )
    .digest("hex");

  return signature === expectedHash;
}

/**
 * Store webhook request for idempotency and retry logic
 */
export function storeWebhookRequest(
  payload: Record<string, any>,
  signature: string
): WebhookRequest {
  const id = generateWebhookId();
  const request: WebhookRequest = {
    id,
    timestamp: new Date(),
    signature,
    payload,
    retryCount: 0,
  };

  webhookStore.set(id, request);

  // Clean up old webhooks (older than 24 hours)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  webhookStore.forEach((value, key) => {
    if (value.timestamp.getTime() < oneDayAgo) {
      webhookStore.delete(key);
    }
  });

  return request;
}

/**
 * Check if webhook has already been processed (idempotency)
 */
export function isWebhookProcessed(refCommand: string): boolean {
  let processed = false;
  webhookStore.forEach((request) => {
    if (request.payload.ref_command === refCommand) {
      processed = true;
    }
  });
  return processed;
}

/**
 * Get webhook request by reference command
 */
export function getWebhookByRefCommand(refCommand: string): WebhookRequest | undefined {
  let found: WebhookRequest | undefined;
  webhookStore.forEach((request) => {
    if (request.payload.ref_command === refCommand) {
      found = request;
    }
  });
  return found;
}

/**
 * Update webhook request with error information
 */
export function recordWebhookError(
  refCommand: string,
  error: string
): void {
  const webhook = getWebhookByRefCommand(refCommand);
  if (webhook) {
    webhook.retryCount++;
    webhook.lastError = error;
    console.error(
      `[Webhook Error] ${refCommand}: ${error} (Retry: ${webhook.retryCount})`
    );
  }
}

/**
 * Get webhooks that need retry
 */
export function getWebhooksNeedingRetry(maxRetries: number = 3): WebhookRequest[] {
  const needsRetry: WebhookRequest[] = [];

  webhookStore.forEach((request) => {
    if (request.retryCount < maxRetries && request.lastError) {
      needsRetry.push(request);
    }
  });

  return needsRetry;
}

/**
 * Validate PayTech IPN payload
 */
export function validateIPNPayload(body: Record<string, string>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Required fields
  if (!body.ref_command) {
    errors.push("Missing ref_command");
  }

  if (!body.type_event) {
    errors.push("Missing type_event");
  }

  if (!body.sen_hash) {
    errors.push("Missing sen_hash");
  }

  // Validate type_event
  const validEvents = ["sale_complete", "sale_canceled", "sale_failed"];
  if (body.type_event && !validEvents.includes(body.type_event)) {
    errors.push(`Invalid type_event: ${body.type_event}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Rate limiting for webhook processing
 */
const rateLimitStore = new Map<string, number[]>();

export function checkRateLimit(
  key: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const timestamps = rateLimitStore.get(key) || [];

  // Remove old timestamps outside the window
  const recentTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (recentTimestamps.length >= maxRequests) {
    return false; // Rate limit exceeded
  }

  recentTimestamps.push(now);
  rateLimitStore.set(key, recentTimestamps);

  return true; // Request allowed
}

/**
 * Clean up rate limit store periodically
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  const windowMs = 60000;

  rateLimitStore.forEach((timestamps: number[], key: string) => {
    const recentTimestamps = timestamps.filter((t: number) => now - t < windowMs);

    if (recentTimestamps.length === 0) {
      rateLimitStore.delete(key);
    } else {
      rateLimitStore.set(key, recentTimestamps);
    }
  });
}

// Clean up rate limit store every 5 minutes
setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
