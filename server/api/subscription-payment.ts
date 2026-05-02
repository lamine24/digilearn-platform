import { Router } from "express";
import { initiateSubscriptionPayment } from "../paytech-subscription";

const router = Router();

/**
 * POST /api/paytech/subscription/init
 * Initiate a subscription payment
 */
router.post("/init", async (req, res) => {
  try {
    const { amount, currency, description, planType, userId } = req.body;

    if (!amount || !currency || !planType || !userId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const result = await initiateSubscriptionPayment({
      amount,
      currency,
      description,
      planType,
      userId,
    });

    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error: any) {
    console.error("[Subscription Payment] Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
});

export default router;
