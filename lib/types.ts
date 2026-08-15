export type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | "JPY" | "AUD" | "CAD";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
}

export type Category = "Food & Drink" | "Shopping" | "Travel" | "Entertainment" | "Services" | "Other";

export type RedemptionMethod = "Online" | "In-store" | "Both";

export type ClaimableType = "code" | "photo";

export type ClaimableStatus =
  | "valid"
  | "pending_confirmation"
  | "confirmed"
  | "disputed"
  | "expired"
  | "admin_review";

export interface UserProfile {
  id?: string;
  email: string;
  password?: string;
  credit_score: number;
  points: number;
  preferred_currency: CurrencyCode;
  joined?: string;
  role?: "user" | "admin";
}

export interface Claimable {
  id: string;
  uploader: string; // Email or user ID
  uploader_id?: string;
  type: ClaimableType;
  brand: string;
  offerTitle: string;
  code?: string;
  imageDataUrl?: string | null;
  imageMediaType?: string | null;
  imageUrl?: string | null;
  imageNote?: string;
  category: Category;
  redemptionMethod: RedemptionMethod;
  currency: CurrencyCode;
  value: number;
  expiry: string; // ISO date YYYY-MM-DD
  status: ClaimableStatus;
  points_total: number;
  points_upfront: number;
  points_final: number;
  uploaded_at: string;
  redeemed_by?: string | null;
  redeemed_at?: string | null;
  confirm_by?: string | null;
  dispute_reason?: string | null;
  ai_reason?: string | null;
  ai_detected_code?: string | null;
}

export interface RedemptionRecord {
  id?: string;
  claimable_id: string;
  redeemed_by: string;
  redeemed_at: string;
  points_spent?: number;
}

export interface DisputeRecord {
  id?: string;
  claimable_id: string;
  reporter: string;
  reason: string;
  reported_at: string;
  status: "open" | "resolved_refunded" | "resolved_dismissed";
}

export interface ExchangeState {
  users: Record<string, UserProfile>;
  claimables: Claimable[];
  redemptions: RedemptionRecord[];
}

export interface ClaimAIVerdict {
  valid: boolean;
  reason: string;
  tier?: number;
  detectedCode?: string;
  source: "rules" | "ai" | "rules-fallback";
}
