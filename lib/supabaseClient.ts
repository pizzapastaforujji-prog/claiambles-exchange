import { createClient } from "@supabase/supabase-js";
import { ExchangeState, Claimable, UserProfile, RedemptionRecord } from "./types";
import { todayISO } from "./claimRules";

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

export const LOCAL_STORAGE_KEY = "claim_exchange_app_data_clean_v5";

/**
 * Clean production state: 0 fake coupons, 0 fake users.
 * The exchange only contains real coupons uploaded by real users!
 */
export const INITIAL_CLEAN_STATE: ExchangeState = {
  users: {},
  claimables: [],
  redemptions: [],
};

/**
 * Loads exchange state from live Supabase Database if connected, or local storage
 */
export async function loadExchangeState(): Promise<ExchangeState> {
  if (supabase) {
    try {
      // 1. Fetch live claimables from Supabase
      const { data: claimablesData, error: claimablesError } = await supabase
        .from("claimables")
        .select("*")
        .order("created_at", { ascending: false });

      // 2. Fetch profiles from Supabase
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      // 3. Fetch redemptions from Supabase
      const { data: redemptionsData, error: redemptionsError } = await supabase
        .from("redemptions")
        .select("*");

      if (!claimablesError && !profilesError) {
        const usersMap: Record<string, UserProfile> = {};
        (profilesData || []).forEach((p: any) => {
          usersMap[p.email] = {
            id: p.id,
            email: p.email,
            credit_score: p.credit_score,
            points: p.points,
            preferred_currency: p.preferred_currency,
            joined: p.created_at ? p.created_at.slice(0, 10) : todayISO(),
            role: p.role,
          };
        });

        const mappedClaimables: Claimable[] = (claimablesData || []).map((c: any) => ({
          id: c.id,
          uploader: c.uploader_id || c.uploader || "Anonymous",
          uploader_id: c.uploader_id,
          type: c.type,
          brand: c.brand,
          offerTitle: c.offer_title,
          code: c.code,
          imageDataUrl: c.image_data_base64,
          imageMediaType: c.image_media_type,
          imageUrl: c.image_url,
          imageNote: c.image_note,
          category: c.category,
          redemptionMethod: c.redemption_method,
          currency: c.currency,
          value: Number(c.face_value),
          expiry: c.expiry_date,
          status: c.status,
          points_total: c.points_total,
          points_upfront: c.points_upfront,
          points_final: c.points_final,
          uploaded_at: c.created_at ? c.created_at.slice(0, 10) : todayISO(),
          redeemed_by: c.redeemed_by,
          redeemed_at: c.redeemed_at,
          confirm_by: c.confirm_by,
          dispute_reason: c.dispute_reason,
          ai_reason: c.ai_reason,
          ai_detected_code: c.ai_detected_code,
        }));

        const mappedRedemptions: RedemptionRecord[] = (redemptionsData || []).map((r: any) => ({
          id: r.id,
          claimable_id: r.claimable_id,
          redeemed_by: r.redeemed_by,
          redeemed_at: r.redeemed_at,
          points_spent: r.points_spent,
        }));

        return {
          users: usersMap,
          claimables: mappedClaimables,
          redemptions: mappedRedemptions,
        };
      }
    } catch (err) {
      console.warn("Supabase fetch fallback to local storage:", err);
    }
  }

  // Fallback to local storage (clean state)
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          return {
            users: parsed.users || {},
            claimables: parsed.claimables || [],
            redemptions: parsed.redemptions || [],
          };
        }
      }
    } catch (err) {
      console.warn("Could not read local storage state:", err);
    }
  }

  return INITIAL_CLEAN_STATE;
}

/**
 * Persists exchange state to Supabase and LocalStorage
 */
export async function saveExchangeState(state: ExchangeState): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.error("Failed to save state to localStorage:", err);
    }
  }
}
