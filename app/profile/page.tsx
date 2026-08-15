"use client";

import React, { useState } from "react";
import { useExchange } from "@/lib/ExchangeContext";
import { CURRENCIES } from "@/lib/claimRules";
import { User, ShieldCheck, Coins, Calendar, DollarSign, Info, Check, Sparkles } from "lucide-react";

export default function ProfilePage() {
  const { currentUser, sessionEmail, updateProfileCurrency, flash } = useExchange();
  const [currency, setCurrency] = useState(currentUser?.preferred_currency || "USD");
  const [saving, setSaving] = useState(false);

  if (!currentUser || !sessionEmail) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div className="card" style={{ maxWidth: 440, margin: "0 auto", padding: "32px 24px" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Profile Access
          </h3>
          <p style={{ color: "var(--ink-muted)", fontSize: 13.5 }}>
            Please sign in using the top navigation bar to view your trust score and profile settings.
          </p>
        </div>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateProfileCurrency(currency);
    setSaving(false);
  };

  const getTrustRating = (score: number) => {
    if (score >= 90) return { label: "Elite Authenticator", color: "var(--brand)" };
    if (score >= 75) return { label: "Trusted Contributor", color: "var(--brand)" };
    if (score >= 50) return { label: "Standard Member", color: "var(--gold)" };
    return { label: "Probationary Member", color: "var(--alert)" };
  };

  const trustRating = getTrustRating(currentUser.credit_score);

  return (
    <div style={{ maxWidth: 480, margin: "30px auto 0" }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 16 }}>
        Your Profile
      </h2>

      <div className="card" style={{ padding: "24px 22px" }}>
        {/* Account Info */}
        <div style={{ marginBottom: 16 }}>
          <label className="label">Account Email</label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 15,
              fontWeight: 600,
              color: "var(--ink)",
            }}
          >
            <User style={{ width: 15, height: 15, color: "var(--ink-subtle)" }} />
            {sessionEmail}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="label">Member Since</label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 14,
              color: "var(--ink-secondary)",
            }}
          >
            <Calendar style={{ width: 15, height: 15, color: "var(--ink-subtle)" }} />
            {currentUser.joined || "2026-08-01"}
          </div>
        </div>

        {/* Credit Score Trust Meter */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <label className="label" style={{ marginBottom: 0 }}>
              Credit Trust Score
            </label>
            <span className="pill brand" style={{ fontSize: 11, padding: "2px 8px" }}>
              {trustRating.label}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 26,
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              color: "var(--brand)",
              marginBottom: 6,
            }}
          >
            <ShieldCheck style={{ width: 20, height: 20 }} />
            {currentUser.credit_score} <span style={{ fontSize: 16, color: "var(--ink-subtle)", fontWeight: 500 }}>/ 100</span>
          </div>

          {/* Score Progress Bar */}
          <div
            style={{
              width: "100%",
              height: 6,
              background: "var(--canvas)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-full)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${currentUser.credit_score}%`,
                height: "100%",
                background: "var(--brand)",
                borderRadius: "var(--radius-full)",
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Points Balance */}
        <div style={{ marginBottom: 20 }}>
          <label className="label">Points Balance</label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 26,
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              color: "var(--gold)",
            }}
          >
            <Coins style={{ width: 20, height: 20 }} />
            {currentUser.points} points
          </div>
        </div>

        <div className="dashed-line" />

        {/* Currency Preference Form */}
        <form onSubmit={handleSave} style={{ marginTop: 16 }}>
          <label className="label">Preferred Currency Display</label>
          <select
            className="input"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as any)}
            style={{ marginBottom: 14 }}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} ({c.symbol})
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="btn primary"
            style={{ width: "100%" }}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Currency Preference"}
          </button>
        </form>
      </div>

      {/* Credit Score Guide Alert */}
      <div
        className="card"
        style={{
          marginTop: 16,
          padding: 16,
          background: "var(--canvas)",
          borderStyle: "dashed",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, color: "var(--brand)", fontWeight: 700, fontSize: 12.5 }}>
          <Info style={{ width: 15, height: 15 }} />
          Credit Score Mechanics
        </div>
        <ul style={{ fontSize: 12.5, color: "var(--ink-muted)", paddingLeft: 18, lineHeight: 1.55 }}>
          <li>Every valid approved upload adds <strong>+5 credit points</strong>.</li>
          <li>Higher credit scores increase your points reward multiplier on future uploads.</li>
          <li>Submitting fake or invalid codes results in a <strong>-20 credit deduction</strong>.</li>
        </ul>
      </div>
    </div>
  );
}
