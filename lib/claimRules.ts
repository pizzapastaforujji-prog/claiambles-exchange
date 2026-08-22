import { CurrencyCode, CurrencyConfig, Category, RedemptionMethod, Claimable, ExchangeState, DiscountType } from "./types";

export const CATEGORIES: Category[] = [
  "Food & Drink",
  "Shopping",
  "Travel",
  "Entertainment",
  "Services",
  "Other",
];

export const REDEMPTION_METHODS: RedemptionMethod[] = ["Online", "In-store", "Both"];

export const CURRENCIES: CurrencyConfig[] = [
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "INR", symbol: "₹" },
  { code: "JPY", symbol: "¥" },
  { code: "AUD", symbol: "A$" },
  { code: "CAD", symbol: "C$" },
];

export const FX_TO_USD: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  INR: 0.012,
  JPY: 0.0067,
  AUD: 0.66,
  CAD: 0.73,
};

export const CONFIRM_WINDOW_DAYS = 3;
export const UPFRONT_SHARE = 0.25;
export const MAX_DAILY_UPLOADS = 10;

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysUntil(dateStr: string): number {
  if (!dateStr) return 0;
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date(todayISO() + "T00:00:00");
  return Math.round((d.getTime() - now.getTime()) / 86400000);
}

export function toUSD(value: number | string, currency: CurrencyCode): number {
  const num = Number(value) || 0;
  return num * (FX_TO_USD[currency] || 1);
}

export function currencySymbol(code: CurrencyCode): string {
  const c = CURRENCIES.find((x) => x.code === code);
  return c ? c.symbol : "$";
}

export function formatMoney(value: number | string, currency: CurrencyCode): string {
  const num = Number(value) || 0;
  return `${currencySymbol(currency)}${num.toLocaleString()} ${currency}`;
}

export function formatDiscount(c: Partial<Claimable>): string {
  if (c.discountType === "percent" || (c.percentOff && c.percentOff > 0)) {
    return `${c.percentOff || c.value}% OFF`;
  }
  if (c.discountType === "perk" || (!c.value && !c.percentOff)) {
    return "FREE PERK / SERVICE";
  }
  return formatMoney(c.value || 0, c.currency || "USD");
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim());
}

/**
 * Calculates reward tier based on discount type and value
 */
export function tierFor(valueUSD: number, discountType: DiscountType = "amount", percentOff?: number): number {
  if (discountType === "perk") return 1; // Small baseline for free service/perks without cash value
  if (discountType === "percent") {
    const pct = percentOff || valueUSD;
    if (pct >= 50) return 3;
    if (pct >= 25) return 2;
    return 1;
  }
  if (valueUSD >= 30) return 3;
  if (valueUSD >= 10) return 2;
  return 1;
}

/**
 * Total points rewarded based on tier, discount type, and uploader's credit score (0-100)
 */
export function totalPointsFor(
  tier: number,
  creditScore: number,
  discountType: DiscountType = "amount"
): number {
  let base = 6;
  if (discountType === "perk") {
    base = 4; // Very small baseline points for service/free perk coupons with no cash/percent value
  } else if (tier === 3) {
    base = 30;
  } else if (tier === 2) {
    base = 15;
  } else {
    base = 8;
  }

  const normalizedScore = Math.max(10, Math.min(100, creditScore || 50));
  return Math.max(2, Math.round(base * (normalizedScore / 100)));
}

/**
 * Splits points into immediate upfront points (25%) and final escrow points (75%)
 */
export function splitPoints(total: number): { upfront: number; final: number } {
  const upfront = Math.max(1, Math.round(total * UPFRONT_SHARE));
  return { upfront, final: Math.max(1, total - upfront) };
}

/**
 * Deterministic rules-based validator before AI invocation
 */
export function hardValidate(
  candidate: Partial<Claimable>,
  allClaimables: Claimable[]
): { fail: boolean; reason?: string } {
  // 1. Enforce Daily Upload Limit (Max 10 per account per day)
  if (candidate.uploader) {
    const today = todayISO();
    const todayUploadCount = allClaimables.filter(
      (c) => c.uploader === candidate.uploader && c.uploaded_at === today
    ).length;
    if (todayUploadCount >= MAX_DAILY_UPLOADS) {
      return {
        fail: true,
        reason: `Daily upload limit reached: You can upload a maximum of ${MAX_DAILY_UPLOADS} claimables per day.`,
      };
    }
  }

  if (!candidate.brand || !candidate.brand.trim()) {
    return { fail: true, reason: "Brand / company name is required." };
  }
  if (!candidate.offerTitle || !candidate.offerTitle.trim()) {
    return { fail: true, reason: "Offer title is required." };
  }

  if (candidate.discountType === "amount") {
    if (!candidate.value || Number(candidate.value) <= 0) {
      return { fail: true, reason: "Cash face value must be greater than zero." };
    }
  } else if (candidate.discountType === "percent") {
    const pct = candidate.percentOff || Number(candidate.value);
    if (!pct || pct <= 0 || pct > 100) {
      return { fail: true, reason: "Percentage off must be between 1% and 100%." };
    }
  }

  if (!candidate.expiry) {
    return { fail: true, reason: "Expiration date is required." };
  }
  if (daysUntil(candidate.expiry) < 0) {
    return { fail: true, reason: "This expiration date has already passed. Expired coupons cannot be uploaded." };
  }

  if (candidate.type === "code") {
    if (!candidate.code || candidate.code.trim().length < 3) {
      return { fail: true, reason: "Code doesn't match a plausible format (at least 3 characters)." };
    }
    const cleanCode = candidate.code.trim().toLowerCase();
    const dup = allClaimables.find(
      (c) => c.code && c.code.trim().toLowerCase() === cleanCode
    );
    if (dup) {
      return { fail: true, reason: "This exact coupon/voucher code already exists on the exchange." };
    }
  } else {
    if (!candidate.imageDataUrl && !candidate.imageUrl) {
      return { fail: true, reason: "Please attach a clear photo of the coupon/voucher." };
    }
    if (candidate.imageDataUrl) {
      const dupPhoto = allClaimables.find(
        (c) => c.imageDataUrl && c.imageDataUrl === candidate.imageDataUrl
      );
      if (dupPhoto) {
        return { fail: true, reason: "This exact voucher photo has already been uploaded." };
      }
    }
  }

  return { fail: false };
}

/**
 * Sweeps expired and auto-confirm claimables
 */
export function sweepStatuses(state: ExchangeState): { data: ExchangeState; sweptCount: number } {
  const today = todayISO();
  let count = 0;
  const updatedClaimables = state.claimables.map((c) => {
    // 1. Expire past due unredeemed vouchers
    if (c.status === "valid" && c.expiry < today) {
      count++;
      return { ...c, status: "expired" as const };
    }
    // 2. Auto-confirm vouchers whose 3-day confirm window has passed
    if (c.status === "pending_confirmation" && c.confirm_by && c.confirm_by <= today) {
      count++;
      return { ...c, status: "confirmed" as const };
    }
    return c;
  });

  return {
    data: {
      ...state,
      claimables: updatedClaimables,
    },
    sweptCount: count,
  };
}

export function confirmClaimable(state: ExchangeState, claimableId: string): ExchangeState {
  const claimable = state.claimables.find((c) => c.id === claimableId);
  if (!claimable) return state;

  const uploader = state.users[claimable.uploader];
  const redeemer = claimable.redeemed_by ? state.users[claimable.redeemed_by] : null;

  const nextUsers = { ...state.users };

  // Pay remaining 75% escrow points to uploader + credit score boost
  if (uploader) {
    nextUsers[claimable.uploader] = {
      ...uploader,
      points: uploader.points + claimable.points_final,
      credit_score: Math.min(100, uploader.credit_score + 5),
    };
  }

  // Redeemer gets +5 credit score boost for verifying
  if (redeemer && claimable.redeemed_by) {
    nextUsers[claimable.redeemed_by] = {
      ...redeemer,
      credit_score: Math.min(100, redeemer.credit_score + 5),
    };
  }

  const nextClaimables = state.claimables.map((c) =>
    c.id === claimableId ? { ...c, status: "confirmed" as const } : c
  );

  return {
    ...state,
    users: nextUsers,
    claimables: nextClaimables,
  };
}

export function disputeClaimable(
  state: ExchangeState,
  claimableId: string,
  reason: string
): ExchangeState {
  const claimable = state.claimables.find((c) => c.id === claimableId);
  if (!claimable) return state;

  const redeemer = claimable.redeemed_by ? state.users[claimable.redeemed_by] : null;
  const uploader = state.users[claimable.uploader];

  const nextUsers = { ...state.users };

  // Refund 100% of points spent back to redeemer
  if (redeemer && claimable.redeemed_by) {
    nextUsers[claimable.redeemed_by] = {
      ...redeemer,
      points: redeemer.points + claimable.points_total,
    };
  }

  // Penalize dishonest uploader: claw back upfront points & reduce credit score
  if (uploader) {
    nextUsers[claimable.uploader] = {
      ...uploader,
      points: Math.max(0, uploader.points - claimable.points_upfront),
      credit_score: Math.max(0, uploader.credit_score - 20),
    };
  }

  const nextClaimables = state.claimables.map((c) =>
    c.id === claimableId ? { ...c, status: "disputed" as const, dispute_reason: reason } : c
  );

  return {
    ...state,
    users: nextUsers,
    claimables: nextClaimables,
  };
}

export async function resizeImageToBase64(file: File): Promise<{ data: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        const maxDim = 1200;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context failed"));
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const base64Data = dataUrl.split(",")[1];
        resolve({ data: base64Data, mediaType: "image/jpeg" });
      };
      img.onerror = () => reject(new Error("Failed to load image for compression"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsDataURL(file);
  });
}
