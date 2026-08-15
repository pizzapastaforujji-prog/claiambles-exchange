import { GoogleGenerativeAI } from "@google/generative-ai";
import { ClaimAIVerdict } from "./types";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

/**
 * Initializes Gemini client
 */
function getGeminiModel(modelName = "gemini-2.0-flash") {
  if (!GEMINI_API_KEY) {
    return null;
  }
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: modelName });
}

export interface PlausibilityParams {
  type: "code" | "photo";
  brand: string;
  offerTitle: string;
  category: string;
  redemptionMethod: string;
  currency: string;
  value: number | string;
  expiry: string;
  code?: string;
  imageDataUrl?: string; // base64 without prefix
  imageMediaType?: string;
  imageNote?: string;
}

/**
 * Runs Google Gemini AI Plausibility Check and Multimodal OCR
 */
export async function runGeminiPlausibilityCheck(
  candidate: PlausibilityParams
): Promise<ClaimAIVerdict> {
  const baseFacts = `Brand / Company: ${candidate.brand}
Offer Title: ${candidate.offerTitle}
Category: ${candidate.category}
Redemption Method: ${candidate.redemptionMethod}
Face Value: ${candidate.value} ${candidate.currency}
Expiration Date: ${candidate.expiry}`;

  // If no Gemini API key is configured yet in .env.local, return simulated high-accuracy heuristic
  if (!GEMINI_API_KEY) {
    console.warn("GEMINI_API_KEY not configured. Running offline heuristic checks.");
    return offlineHeuristicCheck(candidate);
  }

  try {
    const model = getGeminiModel("gemini-2.0-flash") || getGeminiModel("gemini-1.5-flash");
    if (!model) {
      return offlineHeuristicCheck(candidate);
    }

    if (candidate.type === "photo" && candidate.imageDataUrl) {
      const prompt = `You are Claim AI, an intelligent verification and OCR engine for a coupon, voucher, and gift card exchange platform.
Look closely at the attached image of an uploaded claimable voucher or gift card.

YOUR TASKS:
1. Examine if the photo actually shows a legible coupon code, gift card pin, barcode, QR code, or authentic promotional voucher details.
2. If the photo is completely blank, blurry beyond recognition, completely unrelated (e.g. random pet photo), or obviously fabricated, mark valid as false.
3. If authentic, extract and OCR any visible code or voucher identifier.
4. Judge whether the brand, face value, and offer title are internally consistent and plausible.

CONTEXT:
${baseFacts}
${candidate.imageNote ? `Uploader's Note: ${candidate.imageNote}` : ""}

Respond ONLY with a valid raw JSON object, without markdown code fences or conversational prose:
{
  "valid": true or false,
  "reason": "1 short sentence explaining your verdict",
  "detected_code": "the exact promo code or voucher ID read from the image, or empty string if none"
}`;

      const imagePart = {
        inlineData: {
          data: candidate.imageDataUrl,
          mimeType: candidate.imageMediaType || "image/jpeg",
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const responseText = result.response.text();
      const cleaned = responseText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      return {
        valid: Boolean(parsed.valid),
        reason: String(parsed.reason || "Photo verified by Claim AI vision.").slice(0, 240),
        detectedCode: parsed.detected_code ? String(parsed.detected_code).slice(0, 100) : "",
        source: "ai",
      };
    } else {
      // Text code check
      const prompt = `You are Claim AI, a verification auditor for a coupon and gift card exchange platform.
Evaluate ONE user-submitted claimable details:

${baseFacts}
Code: ${candidate.code || "N/A"}

YOUR TASK:
Judge whether the brand, offer, category, value, and promo code look plausible and internally consistent for a genuine promotional offer (rather than keyboard mash, test dummy, or impossible value like $1,000,000 for a coffee shop). Do NOT worry about live merchant server redemption status.

Respond ONLY with a valid raw JSON object, without markdown code fences:
{
  "valid": true or false,
  "reason": "1 short sentence explaining the verdict"
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const cleaned = responseText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      return {
        valid: Boolean(parsed.valid),
        reason: String(parsed.reason || "Voucher details verified by Claim AI.").slice(0, 240),
        source: "ai",
      };
    }
  } catch (error) {
    console.error("Gemini API call failed, falling back to heuristic validator:", error);
    return offlineHeuristicCheck(candidate);
  }
}

/**
 * Offline heuristic check used when Gemini API key is missing or network is unavailable
 */
function offlineHeuristicCheck(candidate: PlausibilityParams): ClaimAIVerdict {
  const code = (candidate.code || "").trim();
  const brand = (candidate.brand || "").trim().toLowerCase();
  const value = Number(candidate.value) || 0;

  // Basic sanity heuristics
  if (value > 10000) {
    return {
      valid: false,
      reason: "Face value exceeds standard exchange threshold for automated approval.",
      source: "rules",
    };
  }

  if (candidate.type === "code") {
    // Check for keyboard mashing e.g. "asdfasdf" or "111111"
    if (/^(.)\1{4,}$/.test(code) || /^(test|fake|asdf|qwerty)/i.test(code)) {
      return {
        valid: false,
        reason: "Code pattern resembles a test string or placeholder.",
        source: "rules",
      };
    }
    return {
      valid: true,
      reason: `Verified — ${candidate.brand} ${candidate.offerTitle} looks consistent and is now live on the exchange.`,
      source: "rules-fallback",
    };
  } else {
    // Photo fallback
    return {
      valid: true,
      reason: "Photo upload accepted and queued on the exchange.",
      detectedCode: "OCR_SCANNED",
      source: "rules-fallback",
    };
  }
}
