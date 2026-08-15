import { CurrencyCode, CurrencyConfig, Category, RedemptionMethod, Claimable, ExchangeState } from "./types";

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

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim());
}

/**
 * Calculates reward tier (1, 2, or 3) based on estimated USD value
 */
export function tierFor(valueUSD: number): number {
  if (valueUSD >= 30) return 3;
  if (valueUSD >= 10) return 2;
  return 1;
}

/**
 * Total points rewarded based on tier and uploader's credit score (0-100)
 */
export function totalPointsFor(tier: number, creditScore: number): number {
  const base = tier === 3 ? 30 : tier === 2 ? 15 : 6;
  const normalizedScore = Math.max(10, Math.min(100, creditScore || 50));
  return Math.max(4, Math.round(base * (normalizedScore / 100)));
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
  if (!candidate.brand || !candidate.brand.trim()) {
    return { fail: true, reason: "Brand / company name is required." };
  }
  if (!candidate.offerTitle || !candidate.offerTitle.trim()) {
    return { fail: true, reason: "Offer title is required." };
  }
  if (!candidate.value || Number(candidate.value) <= 0) {
    return { fail: true, reason: "Face value must be greater than zero." };
  }
  if (!candidate.expiry) {
    return { fail: true, reason: "Expiration date is required." };
  }
  if (daysUntil(candidate.expiry) < 0) {
    return { fail: true, reason: "This expiration date has already passed." };
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
        return { fail: true, reason: "This exact photo has already been uploaded to the exchange." };
      }
    }
  }

  return { fail: false };
}

/**
 * Client-side image resizing and base64 compression for responsive uploads and AI Vision processing
 */
export function resizeImageToBase64(
  file: File,
  maxDim = 720,
  quality = 0.8
): Promise<{ data: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image format."));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const scale = maxDim / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context error."));
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve({
          data: dataUrl.split(",")[1],
          mediaType: "image/jpeg",
        });
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Confirms a pending redemption: awards final points & boosts credit score
 */
export function confirmClaimable(state: ExchangeState, claimableId: string): ExchangeState {
  const c = state.claimables.find((x) => x.id === claimableId);
  if (!c || c.status !== "pending_confirmation") return state;
  const uploader = state.users[c.uploader];
  if (!uploader) return state;

  const nextUsers = {
    ...state.users,
    [c.uploader]: {
      ...uploader,
      points: uploader.points + c.points_final,
      credit_score: Math.min(100, uploader.credit_score + 5),
    },
  };

  const nextClaimables = state.claimables.map((x) =>
    x.id === claimableId ? { ...x, status: "confirmed" as const } : x
  );

  return { ...state, users: nextUsers, claimables: nextClaimables };
}

/**
 * Disputes a bad code: refunds redeemer, claws back upfront points from uploader, drops uploader credit score
 */
export function disputeClaimable(
  state: ExchangeState,
  claimableId: string,
  reason: string
): ExchangeState {
  const c = state.claimables.find((x) => x.id === claimableId);
  if (!c || c.status !== "pending_confirmation") return state;

  const uploader = state.users[c.uploader];
  const redeemer = c.redeemed_by ? state.users[c.redeemed_by] : null;

  const nextUsers = { ...state.users };

  if (uploader) {
    nextUsers[c.uploader] = {
      ...uploader,
      points: Math.max(0, uploader.points - c.points_upfront),
      credit_score: Math.max(0, uploader.credit_score - 20),
    };
  }

  if (redeemer && c.redeemed_by) {
    nextUsers[c.redeemed_by] = {
      ...redeemer,
      points: redeemer.points + c.points_total,
    };
  }

  const nextClaimables = state.claimables.map((x) =>
    x.id === claimableId
      ? {
          ...x,
          status: "disputed" as const,
          dispute_reason: reason || "Redeemer reported code failed to work.",
        }
      : x
  );

  return { ...state, users: nextUsers, claimables: nextClaimables };
}

/**
 * Automatically sweeps expired vouchers and auto-confirms vouchers that passed the 3-day window
 */
export function sweepStatuses(state: ExchangeState): { data: ExchangeState; changed: boolean } {
  let next = state;
  let changed = false;

  for (const c of state.claimables) {
    if (c.status === "pending_confirmation" && c.confirm_by && daysUntil(c.confirm_by) < 0) {
      next = confirmClaimable(next, c.id);
      changed = true;
    }
  }

  const updatedClaimables = next.claimables.map((c) => {
    if (c.status === "valid" && daysUntil(c.expiry) < 0) {
      changed = true;
      return { ...c, status: "expired" as const };
    }
    return c;
  });

  return {
    data: { ...next, claimables: updatedClaimables },
    changed,
  };
}
