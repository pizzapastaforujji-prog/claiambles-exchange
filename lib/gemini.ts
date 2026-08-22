import { GoogleGenerativeAI } from "@google/generative-ai";
import { ClaimAIVerdict, DiscountType } from "./types";
import { todayISO } from "./claimRules";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

// Google Gemini API keys always start with "AIza"
const GEMINI_KEY_VALID = GEMINI_API_KEY.startsWith("AIza") && GEMINI_API_KEY.length > 20;

if (GEMINI_API_KEY && !GEMINI_KEY_VALID) {
  console.warn(
    "⚠️ GEMINI_API_KEY looks invalid (should start with 'AIza'). " +
    "Get a valid key at: https://aistudio.google.com/app/apikey"
  );
}

function getGeminiModel(modelName = "gemini-2.0-flash") {
  if (!GEMINI_KEY_VALID) {
    return null;
  }
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: modelName });
}

export interface PlausibilityParams {
  type: "code" | "photo";
  brand?: string;
  offerTitle?: string;
  category?: string;
  redemptionMethod?: string;
  currency?: string;
  value?: number | string;
  percentOff?: number | string;
  discountType?: DiscountType;
  expiry?: string;
  code?: string;
  imageDataUrl?: string; // base64 without prefix
  imageMediaType?: string;
  imageNote?: string;
  currentDate?: string;
}

/**
 * Runs Google Gemini 2.0 Flash AI Deep Verification and Vision Extraction
 */
export async function runGeminiPlausibilityCheck(
  candidate: PlausibilityParams
): Promise<ClaimAIVerdict> {
  const today = candidate.currentDate || todayISO();

  // If Gemini API key is missing or invalid, fall back depending on type
  if (!GEMINI_KEY_VALID) {
    if (candidate.type === "photo") {
      // Cannot verify photo vouchers without a working Vision AI key
      return {
        valid: false,
        reason: "AI photo verification is currently unavailable. Please ask the admin to configure a valid Gemini API key, or submit a text promo code instead.",
        source: "rules-fallback",
      };
    }
    // For code-only uploads, allow heuristic check
    console.warn("GEMINI_API_KEY not configured or invalid. Running offline heuristic checks for code.");
    return offlineHeuristicCheck(candidate, today);
  }

  try {
    const model = getGeminiModel("gemini-2.0-flash") || getGeminiModel("gemini-1.5-flash");
    if (!model) {
      return offlineHeuristicCheck(candidate, today);
    }

    if (candidate.type === "photo" && candidate.imageDataUrl) {
      const prompt = `You are the lead AI Auditor for "PassThePromo", a verified coupon, voucher, and gift card exchange.
Today's Date: ${today}.

Analyze the attached voucher/coupon image with high scrutiny.

YOUR INSTRUCTIONS:
1. LEGIBILITY & AUTHENTICITY: Does this photo show a real, legible coupon, voucher, gift card, or promotional receipt? If it's a random photo (e.g. food, pet, selfie, screenshot of unrelated text), mark "valid": false.
2. EXPIRATION AUDIT (CRITICAL):
   - Search for any expiration date, "valid through", "expires", "valid until", or "use by" date printed on the image.
   - If the date visible on the voucher is BEFORE ${today} (expired), you MUST set "valid": false with reason "Voucher photo shows an expired date ([DATE])".
3. BRAND & OFFER EXTRACTION:
   - Extract the exact Brand Name visible in the image.
   - Extract the specific Offer Title (e.g. "$15 off order of $40", "20% off entire purchase", "Free beverage with sandwich").
   - If the user provided a brand (${candidate.brand || "none provided"}) and it directly contradicts the image (e.g., image is Subway but user entered Starbucks), mark "valid": false with reason "Brand mismatch: image is for [Actual Brand], not ${candidate.brand}".
4. DISCOUNT TYPE & VALUE:
   - "amount": If a specific cash/dollar value discount or gift card amount is stated (e.g. $10, 500 INR, €15).
   - "percent": If a percentage off is stated (e.g. 20% off, 50% off).
   - "perk": If it is a complimentary service, buy-one-get-one, free trial, or free add-on with no fixed dollar or percentage amount.
   - Extract the numeric value (for cash amount or percent number). If perk, value is 0.
5. OCR IDENTIFIER:
   - Extract any visible promo code, PIN, barcode number, or voucher code.

Respond ONLY with a valid raw JSON object matching this schema without markdown fences:
{
  "valid": true,
  "reason": "Clear 1-sentence explanation of what was verified or why it was rejected",
  "detected_brand": "Brand Name read from image",
  "detected_offer": "Offer details read from image",
  "detected_expiry": "YYYY-MM-DD or estimated future date if not explicitly printed",
  "detected_discount_type": "amount" | "percent" | "perk",
  "detected_value": number,
  "detected_code": "Promo code or PIN read from image, or empty string"
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

      // Extra safety: double-check expiry against today
      if (parsed.detected_expiry && parsed.detected_expiry < today && parsed.valid) {
        return {
          valid: false,
          reason: `Voucher expired on ${parsed.detected_expiry}. Expired coupons cannot be traded.`,
          detectedCode: parsed.detected_code || "",
          detectedBrand: parsed.detected_brand,
          detectedOffer: parsed.detected_offer,
          detectedExpiry: parsed.detected_expiry,
          detectedDiscountType: parsed.detected_discount_type,
          detectedValue: Number(parsed.detected_value) || 0,
          source: "ai",
        };
      }

      return {
        valid: Boolean(parsed.valid),
        reason: String(parsed.reason || "Voucher photo verified by Gemini Vision AI.").slice(0, 260),
        detectedCode: parsed.detected_code ? String(parsed.detected_code).slice(0, 100) : "",
        detectedBrand: parsed.detected_brand || candidate.brand || "",
        detectedOffer: parsed.detected_offer || candidate.offerTitle || "",
        detectedExpiry: parsed.detected_expiry || candidate.expiry || "",
        detectedDiscountType: (parsed.detected_discount_type as DiscountType) || candidate.discountType || "amount",
        detectedValue: Number(parsed.detected_value) || Number(candidate.value) || 0,
        source: "ai",
      };
    } else {
      // Text Code Verification Prompt
      const prompt = `You are the AI Verification Auditor for "PassThePromo" coupon exchange.
Today's Date: ${today}.

Evaluate this digital coupon/voucher submission:
- Brand: ${candidate.brand || "Unknown"}
- Offer: ${candidate.offerTitle || "Unknown"}
- Discount Type: ${candidate.discountType || "amount"} (Value: ${candidate.value || 0}, Percent: ${candidate.percentOff || 0}%)
- Expiration: ${candidate.expiry || "Unknown"}
- Promo Code: ${candidate.code || "None"}

INSTRUCTIONS:
1. Is this a plausible promo code (not keyboard mash like 'asdfasdf', '111111', 'fakecode')?
2. Is the expiration date (${candidate.expiry}) on or after ${today}? If expired, mark valid: false.
3. Is the discount and brand combination realistic?

Respond ONLY with a valid raw JSON object matching this schema without markdown fences:
{
  "valid": true,
  "reason": "1 concise sentence explaining verification result",
  "tier": 1 | 2 | 3
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const cleaned = responseText.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      return {
        valid: Boolean(parsed.valid),
        reason: String(parsed.reason || "Promo code verified by Claim AI.").slice(0, 260),
        tier: Number(parsed.tier) || 1,
        detectedCode: candidate.code || "",
        detectedBrand: candidate.brand || "",
        detectedOffer: candidate.offerTitle || "",
        detectedExpiry: candidate.expiry || "",
        detectedDiscountType: candidate.discountType || "amount",
        detectedValue: Number(candidate.value) || 0,
        source: "ai",
      };
    }
  } catch (err: any) {
    console.error("Gemini API error:", err?.message || err);
    if (candidate.type === "photo") {
      // Cannot verify photos without working AI — reject for safety
      return {
        valid: false,
        reason: "AI photo verification encountered an error. Please try again or submit a text promo code instead.",
        source: "rules-fallback",
      };
    }
    return offlineHeuristicCheck(candidate, today);
  }
}

/**
 * High-accuracy fallback when offline or API unreachable
 */
function offlineHeuristicCheck(candidate: PlausibilityParams, today: string): ClaimAIVerdict {
  if (candidate.expiry && candidate.expiry < today) {
    return {
      valid: false,
      reason: `Expiration date (${candidate.expiry}) is in the past.`,
      source: "rules-fallback",
    };
  }

  if (candidate.type === "code") {
    const code = (candidate.code || "").trim();
    if (code.length < 3) {
      return {
        valid: false,
        reason: "Coupon code is too short to be plausible.",
        source: "rules-fallback",
      };
    }
    const isObviousSpam = /^(.)\1+$/.test(code) || /^(1234|asdf|qwerty|test)/i.test(code);
    if (isObviousSpam) {
      return {
        valid: false,
        reason: "Code appears to be test data or keyboard mash.",
        source: "rules-fallback",
      };
    }
  }

  return {
    valid: true,
    reason: "Passed algorithmic verification checks.",
    detectedCode: candidate.code || "",
    detectedBrand: candidate.brand || "",
    detectedOffer: candidate.offerTitle || "",
    detectedExpiry: candidate.expiry || "",
    detectedDiscountType: candidate.discountType || "amount",
    detectedValue: Number(candidate.value) || 0,
    source: "rules-fallback",
  };
}
