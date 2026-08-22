"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { ExchangeState, Claimable, UserProfile, ClaimAIVerdict, DiscountType } from "./types";
import {
  loadExchangeState,
  saveExchangeState,
  upsertProfile,
  updateProfileStats,
  insertClaimable,
  updateClaimableStatus,
  deleteClaimable,
  insertRedemption,
  INITIAL_CLEAN_STATE,
  supabase,
  isSupabaseConfigured,
} from "./supabaseClient";
import {
  todayISO,
  addDays,
  confirmClaimable,
  disputeClaimable,
  sweepStatuses,
  CONFIRM_WINDOW_DAYS,
  MAX_DAILY_UPLOADS,
  totalPointsFor,
  splitPoints,
  hardValidate,
} from "./claimRules";

const MASTER_EMAIL = "ujjwalsha2009@gmail.com";
const MASTER_PASSWORD = "Admin@Claim2026!";
const SESSION_KEY = "passtpromo_session_v7";
const POLL_INTERVAL = 12_000; // 12 seconds auto-sync

interface ExchangeContextType {
  state: ExchangeState;
  currentUser: UserProfile | null;
  sessionEmail: string | null;
  loading: boolean;
  toast: string | null;
  flash: (msg: string) => void;
  login: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  signup: (email: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateProfileCurrency: (currency: any) => Promise<void>;
  addClaimable: (
    candidate: Partial<Claimable>,
    verdict: ClaimAIVerdict
  ) => Promise<{ success: boolean; upfront: number; final: number; reason?: string }>;
  redeemClaimable: (claimableId: string) => Promise<{ success: boolean; message: string }>;
  confirmRedemption: (claimableId: string) => Promise<void>;
  disputeRedemption: (claimableId: string, reason: string) => Promise<void>;
  adminApproveClaimable: (claimableId: string) => Promise<void>;
  adminRejectClaimable: (claimableId: string) => Promise<void>;
  adminDeleteClaimable: (claimableId: string) => Promise<void>;
  refreshFromCloud: () => Promise<void>;
}

const ExchangeContext = createContext<ExchangeContextType | undefined>(undefined);

export function ExchangeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ExchangeState>(INITIAL_CLEAN_STATE);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 3500);
  }, []);

  const refreshFromCloud = useCallback(async () => {
    try {
      const loaded = await loadExchangeState();
      const { data: swept } = sweepStatuses(loaded);
      setState(swept);
      await saveExchangeState(swept);
    } catch (e) {
      console.warn("Cloud refresh failed:", e);
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const loaded = await loadExchangeState();
        const { data: swept } = sweepStatuses(loaded);
        setState(swept);

        const savedSession = localStorage.getItem(SESSION_KEY);
        if (savedSession && (savedSession === MASTER_EMAIL || swept.users[savedSession])) {
          setSessionEmail(savedSession);
        } else {
          setSessionEmail(null);
        }
      } catch (e) {
        console.error("Init error:", e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Background sync every 12 seconds across all devices
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    pollRef.current = setInterval(async () => {
      try {
        const loaded = await loadExchangeState();
        const { data: swept } = sweepStatuses(loaded);
        setState(swept);
      } catch {}
    }, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = async (email: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    const clean = email.trim().toLowerCase();
    if (!clean) return { success: false, message: "Please enter your email address." };
    if (!password) return { success: false, message: "Please enter your password." };

    // Master admin authentication (DO NOT LEAK PASSWORD)
    if (clean === MASTER_EMAIL) {
      if (password !== MASTER_PASSWORD) {
        return { success: false, message: "Incorrect password. Please try again." };
      }
      setSessionEmail(clean);
      localStorage.setItem(SESSION_KEY, clean);
      flash("Welcome back, Master Admin!");
      return { success: true };
    }

    // Direct database verification
    if (supabase) {
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("email", clean)
          .single();

        if (error || !profile) {
          return { success: false, message: "No account found with this email. Please sign up first." };
        }

        const storedPassword = profile.password_hash || profile.password;
        if (storedPassword && storedPassword !== password) {
          return { success: false, message: "Incorrect password. Please verify and try again." };
        }

        const userProfile: UserProfile = {
          id: profile.id,
          email: profile.email,
          password: storedPassword,
          credit_score: profile.credit_score ?? 50,
          points: profile.points ?? 20,
          preferred_currency: profile.preferred_currency || "USD",
          joined: profile.created_at ? profile.created_at.slice(0, 10) : todayISO(),
          role: profile.role || "user",
        };

        setState((prev) => ({
          ...prev,
          users: { ...prev.users, [clean]: userProfile },
        }));

        setSessionEmail(clean);
        localStorage.setItem(SESSION_KEY, clean);
        flash(`Welcome back, ${clean}!`);
        return { success: true };
      } catch (e) {
        console.warn("Supabase login lookup failed:", e);
      }
    }

    // Local fallback check
    const existing = state.users[clean];
    if (!existing) {
      return { success: false, message: "No account found. Please sign up first." };
    }
    if (existing.password && existing.password !== password) {
      return { success: false, message: "Incorrect password. Please try again." };
    }

    setSessionEmail(clean);
    localStorage.setItem(SESSION_KEY, clean);
    flash(`Welcome back, ${clean}!`);
    return { success: true };
  };

  // ─── Signup ───────────────────────────────────────────────────────────────
  const signup = async (email: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    const clean = email.trim().toLowerCase();
    if (!clean) return { success: false, message: "Please enter a valid email address." };
    if (!password || password.length < 4) {
      return { success: false, message: "Password must be at least 4 characters long." };
    }

    if (clean === MASTER_EMAIL) {
      return { success: false, message: "This admin account is already registered. Please log in." };
    }

    if (supabase) {
      try {
        const { data: existing } = await supabase
          .from("profiles")
          .select("email")
          .eq("email", clean)
          .single();

        if (existing) {
          return { success: false, message: "An account already exists with this email. Please log in." };
        }
      } catch {}
    } else {
      if (state.users[clean]) {
        return { success: false, message: "An account already exists with this email. Please log in." };
      }
    }

    const newProfile: UserProfile = {
      email: clean,
      password: password,
      credit_score: 50,
      points: 20,
      preferred_currency: "USD",
      joined: todayISO(),
      role: "user",
    };

    if (supabase) {
      try {
        await supabase.from("profiles").insert({
          email: clean,
          password_hash: password,
          credit_score: 50,
          points: 20,
          preferred_currency: "USD",
          role: "user",
        });
      } catch (e) {
        console.warn("Signup Supabase error:", e);
      }
    }

    setState((prev) => ({
      ...prev,
      users: { ...prev.users, [clean]: newProfile },
    }));

    setSessionEmail(clean);
    localStorage.setItem(SESSION_KEY, clean);
    flash("Account created! +20 welcome bonus points added.");
    return { success: true };
  };

  const logout = () => {
    setSessionEmail(null);
    localStorage.removeItem(SESSION_KEY);
    flash("Signed out successfully.");
  };

  const updateProfileCurrency = async (currency: any) => {
    if (!sessionEmail || !state.users[sessionEmail]) return;
    const user = state.users[sessionEmail];
    const nextUsers = {
      ...state.users,
      [sessionEmail]: { ...user, preferred_currency: currency },
    };

    if (supabase) {
      try {
        await supabase
          .from("profiles")
          .update({ preferred_currency: currency })
          .eq("email", sessionEmail);
      } catch (e) {}
    }

    setState({ ...state, users: nextUsers });
    await saveExchangeState({ ...state, users: nextUsers });
    flash(`Preferred currency set to ${currency}.`);
  };

  // ─── Add Claimable ────────────────────────────────────────────────────────
  const addClaimable = async (
    candidate: Partial<Claimable>,
    verdict: ClaimAIVerdict
  ) => {
    if (!sessionEmail || !state.users[sessionEmail]) {
      flash("Please log in to upload claimables.");
      return { success: false, upfront: 0, final: 0 };
    }

    const user = state.users[sessionEmail];

    // Check hard validation + 10/day limit
    const hardCheck = hardValidate({ ...candidate, uploader: sessionEmail }, state.claimables);
    if (hardCheck.fail) {
      flash(hardCheck.reason || "Validation failed.");
      return { success: false, upfront: 0, final: 0, reason: hardCheck.reason };
    }

    if (!verdict.valid) {
      const nextCreditScore = Math.max(0, user.credit_score - 5);
      if (supabase) {
        try {
          await supabase
            .from("profiles")
            .update({ credit_score: nextCreditScore })
            .eq("email", sessionEmail);
        } catch {}
      }
      setState((prev) => ({
        ...prev,
        users: {
          ...prev.users,
          [sessionEmail]: { ...user, credit_score: nextCreditScore },
        },
      }));
      flash(`Claim AI flagged this claimable: ${verdict.reason}`);
      return { success: false, upfront: 0, final: 0, reason: verdict.reason };
    }

    const discountType: DiscountType = verdict.detectedDiscountType || candidate.discountType || "amount";
    const total = totalPointsFor(verdict.tier || 1, user.credit_score, discountType);
    const { upfront, final } = splitPoints(total);

    const newClaimable: Claimable = {
      id: "cl-" + Math.random().toString(36).substring(2, 9),
      uploader: sessionEmail,
      type: candidate.type || "code",
      discountType,
      brand: (verdict.detectedBrand || candidate.brand || "").trim(),
      offerTitle: (verdict.detectedOffer || candidate.offerTitle || "").trim(),
      code: candidate.type === "code" ? (candidate.code || "").trim() : undefined,
      imageDataUrl: candidate.type === "photo" ? candidate.imageDataUrl : null,
      imageMediaType: candidate.type === "photo" ? candidate.imageMediaType : null,
      imageNote: candidate.imageNote || "",
      category: candidate.category || "Food & Drink",
      redemptionMethod: candidate.redemptionMethod || "Online",
      currency: candidate.currency || user.preferred_currency || "USD",
      value: verdict.detectedValue !== undefined ? Number(verdict.detectedValue) : Number(candidate.value) || 0,
      percentOff: candidate.percentOff ? Number(candidate.percentOff) : undefined,
      expiry: verdict.detectedExpiry || candidate.expiry || addDays(todayISO(), 7),
      status: "valid",
      points_total: total,
      points_upfront: upfront,
      points_final: final,
      uploaded_at: todayISO(),
      ai_reason: verdict.reason,
      ai_detected_code: verdict.detectedCode || "",
    };

    const supabaseId = await insertClaimable(newClaimable);
    if (supabaseId) {
      newClaimable.id = supabaseId;
    }

    const nextPoints = user.points + upfront;
    const nextCreditScore = Math.min(100, user.credit_score + 5);
    await updateProfileStats(sessionEmail, nextPoints, nextCreditScore);

    setState((prev) => ({
      ...prev,
      users: {
        ...prev.users,
        [sessionEmail]: { ...user, points: nextPoints, credit_score: nextCreditScore },
      },
      claimables: [newClaimable, ...prev.claimables],
    }));

    flash(`Approved! Earned +${upfront} pts upfront (+${final} pts upon confirmation).`);
    return { success: true, upfront, final };
  };

  // ─── Redeem Claimable ─────────────────────────────────────────────────────
  const redeemClaimable = async (claimableId: string) => {
    if (!sessionEmail || !state.users[sessionEmail]) {
      return { success: false, message: "Please log in first." };
    }

    const user = state.users[sessionEmail];
    const claimable = state.claimables.find((c) => c.id === claimableId);

    if (!claimable || claimable.status !== "valid") {
      return { success: false, message: "This claimable is no longer available." };
    }

    if (claimable.uploader === sessionEmail) {
      return { success: false, message: "You cannot redeem your own claimable." };
    }

    const today = todayISO();
    const alreadyRedeemedToday = state.redemptions.some((r) => {
      if (r.redeemed_by !== sessionEmail || r.redeemed_at !== today) return false;
      const c = state.claimables.find((item) => item.id === r.claimable_id);
      return !c || c.status !== "disputed";
    });

    if (alreadyRedeemedToday) {
      return { success: false, message: "Daily limit reached: You can redeem 1 claimable per day." };
    }

    const cost = claimable.points_total;
    if (user.points < cost) {
      return { success: false, message: `Insufficient points (${user.points} available, ${cost} required).` };
    }

    const confirmBy = addDays(today, CONFIRM_WINDOW_DAYS);

    await updateClaimableStatus(claimableId, {
      status: "pending_confirmation",
      redeemed_by: sessionEmail,
      redeemed_at: today,
      confirm_by: confirmBy,
    });

    const nextPoints = user.points - cost;
    await updateProfileStats(sessionEmail, nextPoints, user.credit_score);
    await insertRedemption(claimableId, sessionEmail, today, cost);

    setState((prev) => ({
      ...prev,
      users: {
        ...prev.users,
        [sessionEmail]: { ...user, points: nextPoints },
      },
      claimables: prev.claimables.map((c) =>
        c.id === claimableId
          ? { ...c, status: "pending_confirmation" as const, redeemed_by: sessionEmail, redeemed_at: today, confirm_by: confirmBy }
          : c
      ),
      redemptions: [
        ...prev.redemptions,
        { claimable_id: claimableId, redeemed_by: sessionEmail, redeemed_at: today, points_spent: cost },
      ],
    }));

    flash(`Redeemed for ${cost} pts! Code revealed on your Dashboard.`);
    return { success: true, message: "Success" };
  };

  const confirmRedemption = async (claimableId: string) => {
    const nextState = confirmClaimable(state, claimableId);
    await updateClaimableStatus(claimableId, { status: "confirmed" });

    const claimable = state.claimables.find((c) => c.id === claimableId);
    if (claimable) {
      const uploader = nextState.users[claimable.uploader];
      if (uploader) {
        await updateProfileStats(claimable.uploader, uploader.points, uploader.credit_score);
      }
    }

    setState(nextState);
    await saveExchangeState(nextState);
    flash("Confirmed! Remaining points released to uploader and trust score boosted.");
  };

  const disputeRedemption = async (claimableId: string, reason: string) => {
    const nextState = disputeClaimable(state, claimableId, reason);
    await updateClaimableStatus(claimableId, { status: "disputed", dispute_reason: reason });

    const claimable = state.claimables.find((c) => c.id === claimableId);
    if (claimable?.redeemed_by) {
      const redeemer = nextState.users[claimable.redeemed_by];
      if (redeemer) {
        await updateProfileStats(claimable.redeemed_by, redeemer.points, redeemer.credit_score);
      }
    }

    setState(nextState);
    await saveExchangeState(nextState);
    flash("Reported. Full points refunded; dishonest uploader penalized.");
  };

  const adminApproveClaimable = async (claimableId: string) => {
    await updateClaimableStatus(claimableId, { status: "valid" });
    setState((prev) => ({
      ...prev,
      claimables: prev.claimables.map((c) =>
        c.id === claimableId ? { ...c, status: "valid" as const } : c
      ),
    }));
    flash("Claimable approved and is now live on PassThePromo.");
  };

  const adminRejectClaimable = async (claimableId: string) => {
    await updateClaimableStatus(claimableId, { status: "disputed" });
    setState((prev) => ({
      ...prev,
      claimables: prev.claimables.map((c) =>
        c.id === claimableId ? { ...c, status: "disputed" as const } : c
      ),
    }));
    flash("Claimable rejected by Admin.");
  };

  const adminDeleteClaimable = async (claimableId: string) => {
    await deleteClaimable(claimableId);
    setState((prev) => ({
      ...prev,
      claimables: prev.claimables.filter((c) => c.id !== claimableId),
      redemptions: prev.redemptions.filter((r) => r.claimable_id !== claimableId),
    }));
    flash("Claimable permanently deleted.");
  };

  const currentUser = sessionEmail ? state.users[sessionEmail] ?? null : null;

  return (
    <ExchangeContext.Provider
      value={{
        state,
        currentUser,
        sessionEmail,
        loading,
        toast,
        flash,
        login,
        signup,
        logout,
        updateProfileCurrency,
        addClaimable,
        redeemClaimable,
        confirmRedemption,
        disputeRedemption,
        adminApproveClaimable,
        adminRejectClaimable,
        adminDeleteClaimable,
        refreshFromCloud,
      }}
    >
      {children}
    </ExchangeContext.Provider>
  );
}

export function useExchange() {
  const context = useContext(ExchangeContext);
  if (!context) {
    throw new Error("useExchange must be used within an ExchangeProvider");
  }
  return context;
}
