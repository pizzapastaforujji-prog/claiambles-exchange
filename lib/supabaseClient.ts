import { createClient } from "@supabase/supabase-js";
import { ExchangeState, Claimable, UserProfile, RedemptionRecord, DiscountType } from "./types";
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

export const LOCAL_STORAGE_KEY = "passtpromo_exchange_cache_v7";

// Master Admin is always pre-configured
const MASTER_ADMIN: UserProfile = {
  email: "ujjwalsha2009@gmail.com",
  password: "Admin@Claim2026!",
  credit_score: 100,
  points: 100,
  preferred_currency: "USD",
  joined: "2026-08-01",
  role: "admin" as const,
};

export const INITIAL_CLEAN_STATE: ExchangeState = {
  users: { "ujjwalsha2009@gmail.com": MASTER_ADMIN },
  claimables: [],
  redemptions: [],
};

/**
 * Loads exchange state from Supabase (Single source of truth)
 */
export async function loadExchangeState(): Promise<ExchangeState> {
  if (supabase) {
    try {
      const [claimablesRes, profilesRes, redemptionsRes] = await Promise.all([
        supabase.from("claimables").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("*"),
        supabase.from("redemptions").select("*"),
      ]);

      const { data: claimablesData, error: claimablesError } = claimablesRes;
      const { data: profilesData, error: profilesError } = profilesRes;
      const { data: redemptionsData } = redemptionsRes;

      if (!claimablesError && !profilesError) {
        const usersMap: Record<string, UserProfile> = {
          "ujjwalsha2009@gmail.com": MASTER_ADMIN,
        };

        (profilesData || []).forEach((p: any) => {
          usersMap[p.email] = {
            id: p.id,
            email: p.email,
            password: p.password_hash || p.password,
            credit_score: p.credit_score ?? 50,
            points: p.points ?? 20,
            preferred_currency: p.preferred_currency || "USD",
            joined: p.created_at ? p.created_at.slice(0, 10) : todayISO(),
            role: p.email === "ujjwalsha2009@gmail.com" ? "admin" : (p.role || "user"),
          };
        });

        const mappedClaimables: Claimable[] = (claimablesData || []).map((c: any) => ({
          id: String(c.id),
          uploader: c.uploader_email || c.uploader_id || c.uploader || "Anonymous",
          uploader_id: c.uploader_id,
          type: c.type,
          discountType: (c.discount_type as DiscountType) || (c.face_value > 0 ? "amount" : "perk"),
          brand: c.brand,
          offerTitle: c.offer_title,
          code: c.code,
          imageDataUrl: c.image_data_base64,
          imageMediaType: c.image_media_type,
          imageUrl: c.image_url,
          imageNote: c.image_note,
          category: c.category,
          redemptionMethod: c.redemption_method,
          currency: c.currency || "USD",
          value: Number(c.face_value) || 0,
          percentOff: Number(c.percent_off) || undefined,
          expiry: c.expiry_date,
          status: c.status,
          points_total: Number(c.points_total) || 6,
          points_upfront: Number(c.points_upfront) || 2,
          points_final: Number(c.points_final) || 4,
          uploaded_at: c.created_at ? c.created_at.slice(0, 10) : todayISO(),
          redeemed_by: c.redeemed_by,
          redeemed_at: c.redeemed_at,
          confirm_by: c.confirm_by,
          dispute_reason: c.dispute_reason,
          ai_reason: c.ai_reason,
          ai_detected_code: c.ai_detected_code,
        }));

        const mappedRedemptions: RedemptionRecord[] = (redemptionsData || []).map((r: any) => ({
          id: String(r.id),
          claimable_id: String(r.claimable_id),
          redeemed_by: r.redeemed_by,
          redeemed_at: r.redeemed_at,
          points_spent: r.points_spent,
        }));

        const freshState: ExchangeState = {
          users: usersMap,
          claimables: mappedClaimables,
          redemptions: mappedRedemptions,
        };

        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
              state: freshState,
              timestamp: Date.now(),
            }));
          } catch {}
        }

        return freshState;
      }
    } catch (err) {
      console.warn("Supabase fetch failed, trying cache:", err);
    }
  }

  // Fallback cache
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        const { state: cached, timestamp } = JSON.parse(raw);
        if (cached && typeof cached === "object" && Date.now() - timestamp < 60_000) {
          return {
            users: cached.users || { "ujjwalsha2009@gmail.com": MASTER_ADMIN },
            claimables: cached.claimables || [],
            redemptions: cached.redemptions || [],
          };
        }
      }
    } catch {}
  }

  return INITIAL_CLEAN_STATE;
}

export async function saveExchangeState(state: ExchangeState): Promise<void> {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        state,
        timestamp: Date.now(),
      }));
    } catch {}
  }
}

export async function upsertProfile(profile: UserProfile): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from("profiles").upsert({
      email: profile.email,
      password_hash: profile.password,
      credit_score: profile.credit_score,
      points: profile.points,
      preferred_currency: profile.preferred_currency,
      role: profile.role || "user",
    }, { onConflict: "email" });
  } catch (e) {
    console.warn("upsertProfile failed:", e);
  }
}

export async function updateProfileStats(
  email: string,
  points: number,
  creditScore: number
): Promise<void> {
  if (!supabase) return;
  try {
    await supabase
      .from("profiles")
      .update({ points, credit_score: creditScore })
      .eq("email", email);
  } catch (e) {
    console.warn("updateProfileStats failed:", e);
  }
}

export async function insertClaimable(c: Claimable): Promise<string | null> {
  if (!supabase) return null;
  try {
    const payload: Record<string, any> = {
      type: c.type,
      brand: c.brand,
      offer_title: c.offerTitle,
      code: c.code,
      image_data_base64: c.imageDataUrl,
      image_media_type: c.imageMediaType,
      image_note: c.imageNote,
      category: c.category,
      redemption_method: c.redemptionMethod,
      currency: c.currency || "USD",
      face_value: c.value || 0,
      expiry_date: c.expiry,
      status: c.status,
      uploader_email: c.uploader,
      points_total: c.points_total,
      points_upfront: c.points_upfront,
      points_final: c.points_final,
      ai_reason: c.ai_reason,
      ai_detected_code: c.ai_detected_code,
    };

    const { data, error } = await supabase.from("claimables").insert(payload).select("id").single();

    if (error) {
      console.warn("insertClaimable error:", error);
      return null;
    }
    return data?.id ? String(data.id) : null;
  } catch (e) {
    console.warn("insertClaimable failed:", e);
    return null;
  }
}

export async function updateClaimableStatus(
  id: string,
  updates: Record<string, any>
): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from("claimables").update(updates).eq("id", id);
  } catch (e) {
    console.warn("updateClaimableStatus failed:", e);
  }
}

export async function deleteClaimable(id: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from("claimables").delete().eq("id", id);
  } catch (e) {
    console.warn("deleteClaimable failed:", e);
  }
}

export async function insertRedemption(
  claimableId: string,
  redeemedBy: string,
  redeemedAt: string,
  pointsSpent: number
): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from("redemptions").insert({
      claimable_id: claimableId,
      redeemed_by: redeemedBy,
      redeemed_at: redeemedAt,
      points_spent: pointsSpent,
    });
  } catch (e) {
    console.warn("insertRedemption failed:", e);
  }
}

export const INITIAL_DEMO_STATE = INITIAL_CLEAN_STATE;
