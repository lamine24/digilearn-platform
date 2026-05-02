import { createHmac } from "crypto";
import { ENV } from "./_core/env";
import { createSubscription } from "./external-courses-db";

const PAYTECH_API_KEY = ENV.paytechApiKey;
const PAYTECH_SECRET_KEY = ENV.paytechSecretKey;
const PAYTECH_API_URL = "https://api.paytech.sn";

export interface InitiatePaymentRequest {
  amount: string;
  currency: string;
  description: string;
  planType: "monthly" | "yearly" | "lifetime";
  userId: number;
}

export interface PaytechResponse {
  success: boolean;
  token?: string;
  redirectUrl?: string;
  message?: string;
}

/**
 * Initiate a PayTech payment for subscription
 */
export async function initiateSubscriptionPayment(
  req: InitiatePaymentRequest
): Promise<PaytechResponse> {
  try {
    const { amount, currency, description, planType, userId } = req;

    // Generate unique reference
    const reference = `SUB-${userId}-${Date.now()}`;

    // Prepare payment data
    const paymentData = {
      api_key: PAYTECH_API_KEY,
      merchant_id: PAYTECH_API_KEY,
      amount: parseInt(amount),
      currency: currency,
      description: description,
      reference: reference,
      return_url: `${process.env.APP_URL || "http://localhost:3000"}/payment/success?type=subscription&planType=${planType}&userId=${userId}`,
      cancel_url: `${process.env.APP_URL || "http://localhost:3000"}/payment/cancel`,
      metadata: JSON.stringify({
        planType,
        userId,
        type: "subscription",
      }),
    };

    // Make request to PayTech
    const response = await fetch(`${PAYTECH_API_URL}/api/v1/transactions/init`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      throw new Error(`PayTech API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success && data.token) {
      const redirectUrl = `${PAYTECH_API_URL}/api/v1/redirect/${data.token}`;
      return {
        success: true,
        token: data.token,
        redirectUrl,
      };
    } else {
      return {
        success: false,
        message: data.message || "Failed to initiate payment",
      };
    }
  } catch (error: any) {
    console.error("[PayTech Subscription] Error:", error);
    return {
      success: false,
      message: error.message || "Payment initiation failed",
    };
  }
}

/**
 * Verify PayTech IPN webhook for subscription
 */
export async function verifySubscriptionWebhook(
  body: any,
  signature: string
): Promise<{
  valid: boolean;
  data?: any;
  error?: string;
}> {
  try {
    // Create signature
    const message = JSON.stringify(body);
    const computedSignature = createHmac("sha256", PAYTECH_SECRET_KEY)
      .update(message)
      .digest("hex");

    if (computedSignature !== signature) {
      return {
        valid: false,
        error: "Invalid signature",
      };
    }

    return {
      valid: true,
      data: body,
    };
  } catch (error: any) {
    return {
      valid: false,
      error: error.message,
    };
  }
}

/**
 * Handle successful subscription payment
 */
export async function handleSubscriptionPaymentSuccess(data: {
  planType: "monthly" | "yearly" | "lifetime";
  userId: number;
  paymentId: string;
  amount: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await createSubscription({
      userId: data.userId,
      planType: data.planType,
      price: data.amount,
      currency: "XOF",
      paymentId: data.paymentId,
    });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("[Subscription] Error creating subscription:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
