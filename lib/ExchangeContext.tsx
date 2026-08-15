"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ExchangeState, Claimable, UserProfile, ClaimAIVerdict } from "./types";
import {
  loadExchangeState,
  saveExchangeState,
  INITIAL_DEMO_STATE,
} from "./supabaseClient";
import {
  todayISO,
  addDays,
  confirmClaimable,
  disputeClaimable,
  sweepStatuses,
  CONFIRM_WINDOW_DAYS,
  totalPointsFor,
  splitPoints,
} from "./claimRules";

interface ExchangeContextType {
  state: ExchangeState;
  currentUser: UserProfile | null;
  sessionEmail: string | null;
  loading: boolean;
  toast: string | null;
  flash: (msg: string) => void;
  login: (email: string) => Promise<boolean>;
  signup: (email: string) => Promise<boolean>;
  logout: () => void;
  updateProfileCurrency: (currency: any) => Promise<void>;
  addClaimable: (
    candidate: Partial<Claimable>,
    verdict: ClaimAIVerdict
  ) => Promise<{ success: boolean; upfront: number; final: number }>;
  redeemClaimable: (claimableId: string) => Promise<{ success: boolean; message: string }>;
  confirmRedemption: (claimableId: string) => Promise<void>;
  disputeRedemption: (claimableId: string, reason: string) => Promise<void>;
  adminApproveClaimable: (claimableId: string) => Promise<void>;
  adminRejectClaimable: (claimableId: string) => Promise<void>;
}

const ExchangeContext = createContext<ExchangeContextType | undefined>(undefined);

export function ExchangeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ExchangeState>(INITIAL_DEMO_STATE);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 3500);
  }, []);

  // Load state and perform sweep
  useEffect(() => {
    async function init() {
      try {
        const loaded = await loadExchangeState();
        const { data: swept } = sweepStatuses(loaded);
        setState(swept);
        await saveExchangeState(swept);

        // Auto restore last user session if available
        const savedSession = localStorage.getItem("claim_exchange_session");
        if (savedSession && swept.users[savedSession]) {
          setSessionEmail(savedSession);
        } else {
          // Default to demo user for frictionless instant preview
          setSessionEmail("alex@exchange.com");
        }
      } catch (e) {
        console.error("Init exchange state error:", e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Helper to persist state updates
  const updateState = useCallback(async (nextState: ExchangeState) => {
    setState(nextState);
    await saveExchangeState(nextState);
  }, []);

  const login = async (email: string) => {
    const clean = email.trim().toLowerCase();
    let nextState = { ...state };
    if (!nextState.users[clean]) {
      // Create user if doesn't exist
      nextState.users[clean] = {
        email: clean,
        credit_score: 50,
        points: 20,
        preferred_currency: "USD",
        joined: todayISO(),
        role: clean.includes("admin") ? "admin" : "user",
      };
      await updateState(nextState);
      flash("Account created! +20 welcome bonus points added.");
    } else {
      flash("Welcome back!");
    }
    setSessionEmail(clean);
    localStorage.setItem("claim_exchange_session", clean);
    return true;
  };

  const signup = async (email: string) => {
    return login(email);
  };

  const logout = () => {
    setSessionEmail(null);
    localStorage.removeItem("claim_exchange_session");
    flash("Signed out successfully.");
  };

  const updateProfileCurrency = async (currency: any) => {
    if (!sessionEmail || !state.users[sessionEmail]) return;
    const user = state.users[sessionEmail];
    const nextUsers = {
      ...state.users,
      [sessionEmail]: { ...user, preferred_currency: currency },
    };
    await updateState({ ...state, users: nextUsers });
    flash(`Preferred currency set to ${currency}.`);
  };

  const addClaimable = async (
    candidate: Partial<Claimable>,
    verdict: ClaimAIVerdict
  ) => {
    if (!sessionEmail || !state.users[sessionEmail]) {
      flash("Please log in to upload claimables.");
      return { success: false, upfront: 0, final: 0 };
    }

    const user = state.users[sessionEmail];

    if (!verdict.valid) {
      // Credit score penalty for submitting invalid/gibberish coupon
      const nextUsers = {
        ...state.users,
        [sessionEmail]: {
          ...user,
          credit_score: Math.max(0, user.credit_score - 5),
        },
      };
      await updateState({ ...state, users: nextUsers });
      flash("Claim AI flagged this claimable as invalid. Credit score decreased slightly (-5).");
      return { success: false, upfront: 0, final: 0 };
    }

    const total = totalPointsFor(verdict.tier || 1, user.credit_score);
    const { upfront, final } = splitPoints(total);

    const newClaimable: Claimable = {
      id: "cl-" + Math.random().toString(36).substring(2, 9),
      uploader: sessionEmail,
      type: candidate.type || "code",
      brand: (candidate.brand || "").trim(),
      offerTitle: (candidate.offerTitle || "").trim(),
      code: candidate.type === "code" ? (candidate.code || "").trim() : undefined,
      imageDataUrl: candidate.type === "photo" ? candidate.imageDataUrl : null,
      imageMediaType: candidate.type === "photo" ? candidate.imageMediaType : null,
      imageNote: candidate.imageNote || "",
      category: candidate.category || "Food & Drink",
      redemptionMethod: candidate.redemptionMethod || "Online",
      currency: candidate.currency || user.preferred_currency || "USD",
      value: Number(candidate.value) || 10,
      expiry: candidate.expiry || addDays(todayISO(), 7),
      status: "valid",
      points_total: total,
      points_upfront: upfront,
      points_final: final,
      uploaded_at: todayISO(),
      ai_reason: verdict.reason,
      ai_detected_code: verdict.detectedCode || "",
    };

    const nextUsers = {
      ...state.users,
      [sessionEmail]: {
        ...user,
        points: user.points + upfront,
        credit_score: Math.min(100, user.credit_score + 5),
      },
    };

    const nextClaimables = [newClaimable, ...state.claimables];
    await updateState({
      ...state,
      users: nextUsers,
      claimables: nextClaimables,
    });

    flash(`Approved! Earned +${upfront} pts upfront (+${final} pts upon confirmation).`);
    return { success: true, upfront, final };
  };

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
      return { success: false, message: "You cannot redeem your own uploaded claimable." };
    }

    // Daily limit check: 1 redemption per day per account
    const today = todayISO();
    const alreadyRedeemedToday = state.redemptions.some((r) => {
      if (r.redeemed_by !== sessionEmail || r.redeemed_at !== today) return false;
      const c = state.claimables.find((item) => item.id === r.claimable_id);
      return !c || c.status !== "disputed";
    });

    if (alreadyRedeemedToday) {
      return {
        success: false,
        message: "Daily limit reached: You can redeem 1 claimable per day.",
      };
    }

    const cost = claimable.points_total;
    if (user.points < cost) {
      return {
        success: false,
        message: `Insufficient points (${user.points} available, ${cost} required).`,
      };
    }

    const nextClaimables = state.claimables.map((c) =>
      c.id === claimableId
        ? {
            ...c,
            status: "pending_confirmation" as const,
            redeemed_by: sessionEmail,
            redeemed_at: today,
            confirm_by: addDays(today, CONFIRM_WINDOW_DAYS),
          }
        : c
    );

    const nextUsers = {
      ...state.users,
      [sessionEmail]: {
        ...user,
        points: user.points - cost,
      },
    };

    const nextRedemptions = [
      ...state.redemptions,
      {
        claimable_id: claimableId,
        redeemed_by: sessionEmail,
        redeemed_at: today,
        points_spent: cost,
      },
    ];

    await updateState({
      ...state,
      users: nextUsers,
      claimables: nextClaimables,
      redemptions: nextRedemptions,
    });

    flash(`Redeemed for ${cost} pts! The code is now unmasked on your Dashboard.`);
    return { success: true, message: "Success" };
  };

  const confirmRedemption = async (claimableId: string) => {
    const nextState = confirmClaimable(state, claimableId);
    await updateState(nextState);
    flash("Confirmed! Remaining points released to uploader and credit scores boosted.");
  };

  const disputeRedemption = async (claimableId: string, reason: string) => {
    const nextState = disputeClaimable(state, claimableId, reason);
    await updateState(nextState);
    flash("Reported. Full points refunded to your balance; uploader penalized.");
  };

  const adminApproveClaimable = async (claimableId: string) => {
    const nextClaimables = state.claimables.map((c) =>
      c.id === claimableId ? { ...c, status: "valid" as const } : c
    );
    await updateState({ ...state, claimables: nextClaimables });
    flash("Claimable approved by Admin and is now live on the exchange.");
  };

  const adminRejectClaimable = async (claimableId: string) => {
    const nextClaimables = state.claimables.map((c) =>
      c.id === claimableId ? { ...c, status: "disputed" as const } : c
    );
    await updateState({ ...state, claimables: nextClaimables });
    flash("Claimable rejected by Admin.");
  };

  const currentUser = sessionEmail ? state.users[sessionEmail] || null : null;

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
