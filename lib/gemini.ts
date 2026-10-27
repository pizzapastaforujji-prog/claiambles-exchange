import { GoogleGenerativeAI } from "@google/generative-ai";
import { ClaimAIVerdict, DiscountType } from "./types";
import { todayISO } from "./claimRules";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

// Google Gemini API keys can start with "AIza" or "AQ."
const GEMINI_KEY_VALID = Boolean(
  GEMINI_API_KEY &&
  (GEMINI_API_KEY.startsWith("AIza") || GEMINI_API_KEY.startsWith("AQ.") || GEMINI_API_KEY.length > 25)
);

function getGeminiModel(modelName = "gemini-3.6-flash") {
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
 * Runs Google Gemini AI Deep Verification and Vision Extraction
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
    const model = getGeminiModel("gemini-3.6-flash") || getGeminiModel("gemini-3.7-flash");
    if (!model) {
      return offlineHeuristicCheck(candidate, today);
    }

    if (candidate.type === "photo" && candidate.imageDataUrl) {
      const userEnteredBrand = (candidate.brand || "").trim();
      const userEnteredOffer = (candidate.offerTitle || "").trim();
      const userEnteredExpiry = (candidate.expiry || "").trim();
      const userEnteredVal = candidate.discountType === "percent"
        ? `${candidate.percentOff || candidate.value}% off`
        : candidate.discountType === "perk"
        ? "Free perk / service"
        : `${candidate.currency || "USD"} ${candidate.value || 0}`;

      const prompt = `You are the lead AI Auditor for "PassThePromo", a verified coupon, voucher, and gift card exchange.
Today's Date: ${today}.

The user is attempting to upload a voucher image with these CLAIMED details:
- Claimed Brand: "${userEnteredBrand || "Not provided (Auto-extract mode)"}"
- Claimed Offer: "${userEnteredOffer || "Not provided (Auto-extract mode)"}"
- Claimed Expiration Date: "${userEnteredExpiry || "Not provided (Auto-extract mode)"}"
- Claimed Discount: "${userEnteredVal}"

AUDIT INSTRUCTIONS (STRICT & THOROUGH):
1. AUTHENTICITY: Does this photo show a real, legible coupon, promotional voucher, gift card, discount ticket, or store receipt with a discount?
   - If it is a photo of a person, pet, food without coupon text, screenshot of unrelated text/chat, random object, or unreadable blur:
     You MUST set "valid": false with reason "Image does not appear to be an authentic or legible coupon or voucher."

2. EXPIRATION AUDIT (CRITICAL):
   - Locate any "valid through", "expires", "valid until", "expiration", "exp", "use by" date printed on the image.
   - If the date on the voucher is BEFORE ${today} (expired), set "valid": false with reason "Voucher expired on [detected date]. Expired coupons cannot be traded."
   - If the user provided a Claimed Expiration Date ("${userEnteredExpiry}"), and the image displays a clear date that CONTRADICTS it (differs by more than 2 days), you MUST set "valid": false with reason "Expiration date mismatch: voucher photo shows [detected date], but you entered ${userEnteredExpiry}."

3. BRAND & STORE CROSS-CHECK:
   - Extract the exact company or brand name visible on the coupon.
   - If user provided a Claimed Brand ("${userEnteredBrand}") and it directly contradicts what is printed (e.g. image is Subway but user entered Starbucks):
     You MUST set "valid": false with reason "Brand mismatch: voucher is for [Actual Brand], not ${userEnteredBrand}."

4. OFFER & DISCOUNT CROSS-CHECK:
   - Read the offer details (e.g. "$10 off $30 purchase", "20% off all items", "Free large fries").
   - If user claimed a discount that significantly exaggerates or contradicts the image (e.g. image shows $5 off or 10% off, but user claimed $50 or free service):
     You MUST set "valid": false with reason "Offer mismatch: voucher photo shows [Actual Offer], not ${userEnteredOffer || userEnteredVal}."

5. OCR PROMO CODE / PIN EXTRACTION:
   - Extract any visible alphanumeric promo code, redemption PIN, barcode number, or serial code from the image.

Respond ONLY with a valid raw JSON object matching this schema without markdown fences:
{
  "valid": true,
  "reason": "Clear 1-sentence explanation of what was verified or why it was rejected",
  "detected_brand": "Brand Name read from image",
  "detected_offer": "Offer details read from image",
  "detected_expiry": "YYYY-MM-DD (format as YYYY-MM-DD if recognizable, or empty string)",
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

      // --- Programmatic Safety Double-Checks ---
      const detectedExp = (parsed.detected_expiry || "").trim();

      // Check 1: Is detected expiry in the past?
      if (detectedExp && /^\d{4}-\d{2}-\d{2}$/.test(detectedExp) && detectedExp < today) {
        return {
          valid: false,
          reason: `Voucher expired on ${detectedExp}. Expired coupons cannot be traded.`,
          detectedCode: parsed.detected_code || "",
          detectedBrand: parsed.detected_brand,
          detectedOffer: parsed.detected_offer,
          detectedExpiry: detectedExp,
          detectedDiscountType: parsed.detected_discount_type,
          detectedValue: Number(parsed.detected_value) || 0,
          source: "ai",
        };
      }

      // Check 2: Expiration mismatch between photo and user input
      if (
        userEnteredExpiry &&
        detectedExp &&
        /^\d{4}-\d{2}-\d{2}$/.test(detectedExp) &&
        /^\d{4}-\d{2}-\d{2}$/.test(userEnteredExpiry)
      ) {
        const diffMs = Math.abs(new Date(detectedExp).getTime() - new Date(userEnteredExpiry).getTime());
        const diffDays = Math.round(diffMs / 86400000);
        if (diffDays > 2) {
          return {
            valid: false,
            reason: `Expiration date mismatch: voucher photo shows ${detectedExp}, but you entered ${userEnteredExpiry}.`,
            detectedCode: parsed.detected_code || "",
            detectedBrand: parsed.detected_brand,
            detectedOffer: parsed.detected_offer,
            detectedExpiry: detectedExp,
            detectedDiscountType: parsed.detected_discount_type,
            detectedValue: Number(parsed.detected_value) || 0,
            source: "ai",
          };
        }
      }

      // Check 3: If AI flagged as invalid, honor rejection
      if (!parsed.valid) {
        return {
          valid: false,
          reason: String(parsed.reason || "Voucher photo failed AI authenticity and cross-check verification.").slice(0, 260),
          detectedCode: parsed.detected_code ? String(parsed.detected_code).slice(0, 100) : "",
          detectedBrand: parsed.detected_brand || candidate.brand || "",
          detectedOffer: parsed.detected_offer || candidate.offerTitle || "",
          detectedExpiry: detectedExp || candidate.expiry || "",
          detectedDiscountType: (parsed.detected_discount_type as DiscountType) || candidate.discountType || "amount",
          detectedValue: Number(parsed.detected_value) || Number(candidate.value) || 0,
          source: "ai",
        };
      }

      return {
        valid: true,
        reason: String(parsed.reason || "Voucher photo successfully verified by Gemini Vision AI.").slice(0, 260),
        detectedCode: parsed.detected_code ? String(parsed.detected_code).slice(0, 100) : "",
        detectedBrand: parsed.detected_brand || candidate.brand || "",
        detectedOffer: parsed.detected_offer || candidate.offerTitle || "",
        detectedExpiry: detectedExp || candidate.expiry || "",
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
