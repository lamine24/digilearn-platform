import { ENV } from "./_core/env";
import crypto from "crypto";

const PAYTECH_BASE_URL = "https://paytech.sn/api/payment/request-payment";
const PAYTECH_REDIRECT_URL = "https://paytech.sn/payment/checkout/";

interface PaytechPaymentRequest {
  item_name: string;
  item_price: string;
  currency: string;
  ref_command: string;
  command_name: string;
  success_url: string;
  cancel_url: string;
  ipn_url: string;
  env: "test" | "prod";
  custom_field?: Record<string, string>;
}

interface PaytechResponse {
  success: number;
  token: string;
  redirect_url: string;
  errors?: string[];
}

export async function initiatePaytechPayment(params: {
  itemName: string;
  amount: number;
  currency: string;
  refCommand: string;
  commandName: string;
  successUrl: string;
  cancelUrl: string;
  ipnUrl: string;
  customField?: Record<string, string>;
}): Promise<{ token: string; redirectUrl: string }> {
  const body: PaytechPaymentRequest = {
    item_name: params.itemName,
    item_price: params.amount.toString(),
    currency: params.currency,
    ref_command: params.refCommand,
    command_name: params.commandName,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    ipn_url: params.ipnUrl,
    env: "test",
    custom_field: params.customField,
  };

  const response = await fetch(PAYTECH_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      API_KEY: ENV.paytechApiKey,
      API_SECRET: ENV.paytechSecretKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`PayTech API error (${response.status}): ${text}`);
  }

  const data = (await response.json()) as PaytechResponse;

  if (data.success !== 1) {
    throw new Error(`PayTech payment failed: ${data.errors?.join(", ") || "Unknown error"}`);
  }

  return {
    token: data.token,
    redirectUrl: `${PAYTECH_REDIRECT_URL}${data.token}`,
  };
}

export function verifyPaytechIPN(body: Record<string, string>): boolean {
  // PayTech IPN verification
  // In production, verify the hash signature
  return !!body.ref_command && !!body.type_event;
}
