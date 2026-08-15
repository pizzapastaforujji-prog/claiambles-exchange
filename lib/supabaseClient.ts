import { createClient } from "@supabase/supabase-js";
import { ExchangeState, Claimable, UserProfile } from "./types";
import { todayISO, addDays } from "./claimRules";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("https://") &&
    !supabaseUrl.includes("your-project")
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const LOCAL_STORAGE_KEY = "claim_exchange_app_data_v4";

/**
 * Initial demo dataset to make the exchange feel alive on first load
 */
export const INITIAL_DEMO_STATE: ExchangeState = {
  users: {
    "alex@exchange.com": {
      email: "alex@exchange.com",
      credit_score: 85,
      points: 45,
      preferred_currency: "USD",
      joined: "2026-07-01",
      role: "user",
    },
    "sarah@tech.org": {
      email: "sarah@tech.org",
      credit_score: 92,
      points: 70,
      preferred_currency: "USD",
      joined: "2026-06-15",
      role: "user",
    },
    "admin@claimexchange.com": {
      email: "admin@claimexchange.com",
      credit_score: 100,
      points: 500,
      preferred_currency: "USD",
      joined: "2026-01-01",
      role: "admin",
    },
  },
  claimables: [
    {
      id: "cl-starbucks-01",
      uploader: "alex@exchange.com",
      type: "code",
      brand: "Starbucks",
      offerTitle: "$10 off handcrafted beverages",
      code: "STAR-COFFEE-B9X2",
      category: "Food & Drink",
      redemptionMethod: "Both",
      currency: "USD",
      value: 10,
      expiry: addDays(todayISO(), 5),
      status: "valid",
      points_total: 15,
      points_upfront: 4,
      points_final: 11,
      uploaded_at: todayISO(),
      ai_reason: "Verified — Starbucks $10 beverage coupon valid and active.",
    },
    {
      id: "cl-nike-02",
      uploader: "sarah@tech.org",
      type: "code",
      brand: "Nike",
      offerTitle: "20% off apparel & running footwear",
      code: "NIKE-RUN-20OFF",
      category: "Shopping",
      redemptionMethod: "Online",
      currency: "USD",
      value: 35,
      expiry: addDays(todayISO(), 2),
      status: "valid",
      points_total: 30,
      points_upfront: 8,
      points_final: 22,
      uploaded_at: todayISO(),
      ai_reason: "Verified — Nike promo code verified for active catalog items.",
    },
    {
      id: "cl-ubereats-03",
      uploader: "alex@exchange.com",
      type: "code",
      brand: "Uber Eats",
      offerTitle: "$15 off next 2 lunch orders",
      code: "EATS-LUNCH-55XY",
      category: "Food & Drink",
      redemptionMethod: "Online",
      currency: "USD",
      value: 15,
      expiry: addDays(todayISO(), 8),
      status: "valid",
      points_total: 15,
      points_upfront: 4,
      points_final: 11,
      uploaded_at: todayISO(),
      ai_reason: "Verified — Uber Eats promo code matches food delivery patterns.",
    },
    {
      id: "cl-spotify-04",
      uploader: "sarah@tech.org",
      type: "code",
      brand: "Spotify",
      offerTitle: "1-Month Premium Subscription pass",
      code: "SPOT-PASS-7890",
      category: "Entertainment",
      redemptionMethod: "Online",
      currency: "USD",
      value: 11.99,
      expiry: addDays(todayISO(), 14),
      status: "valid",
      points_total: 15,
      points_upfront: 4,
      points_final: 11,
      uploaded_at: todayISO(),
      ai_reason: "Verified — Spotify 1-month premium code passes authenticity check.",
    },
  ],
  redemptions: [],
};

/**
 * Loads exchange state from Supabase if configured, otherwise from localStorage with initial demo fallback
 */
export async function loadExchangeState(): Promise<ExchangeState> {
  if (typeof window === "undefined") {
    return INITIAL_DEMO_STATE;
  }

  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.claimables && parsed.users) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn("Could not read local storage state:", err);
  }

  // Save initial demo state to local storage
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_STATE));
  } catch {}

  return INITIAL_DEMO_STATE;
}

/**
 * Persists exchange state to storage
 */
export async function saveExchangeState(state: ExchangeState): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to save state to localStorage:", err);
  }
}
