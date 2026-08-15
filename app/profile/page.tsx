"use client";

import React, { useState } from "react";
import { useExchange } from "@/lib/ExchangeContext";
import { CURRENCIES } from "@/lib/claimRules";
import { User, ShieldCheck, Coins, Calendar, DollarSign, Info, Check } from "lucide-react";

export default function ProfilePage() {
  const { currentUser, sessionEmail, updateProfileCurrency, flash } = useExchange();
  const [currency, setCurrency] = useState(currentUser?.preferred_currency || "USD");
  const [saving, setSaving] = useState(false);

  if (!currentUser || !sessionEmail) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <h3 style={{ fontFamily: "var(--display)", fontSize: 32, marginBottom: 12 }}>
          PROFILE
        </h3>
        <p style={{ color: "var(--ink-muted)" }}>
          Please sign in using the top navigation bar to view and manage your profile settings.
        </p>
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
    if (score >= 90) return { label: "Elite Authenticator", color: "var(--stamp)" };
    if (score >= 75) return { label: "Trusted Contributor", color: "var(--stamp)" };
    if (score >= 50) return { label: "Standard Member", color: "var(--gold)" };
    return { label: "Probationary Member", color: "var(--alert)" };
  };

  const trustRating = getTrustRating(currentUser.credit_score);

  return (
    <div style={{ maxWidth: 520, margin: "40px auto 0" }}>
      <h2 style={{ fontFamily: "var(--display)", fontSize: 38, marginBottom: 20 }}>
        YOUR PROFILE
      </h2>

      <div className="ticket" style={{ padding: 28 }}>
        {/* Account Info */}
        <div style={{ marginBottom: 18 }}>
          <label className="label">Account Email</label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            <User style={{ width: 16, height: 16, color: "var(--ink-subtle)" }} />
            {sessionEmail}
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label className="label">Member Since</label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 15,
              color: "var(--ink-secondary)",
            }}
          >
            <Calendar style={{ width: 16, height: 16, color: "var(--ink-subtle)" }} />
            {currentUser.joined || "2026-08-01"}
          </div>
        </div>

        {/* Credit Score Trust Meter */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label className="label" style={{ marginBottom: 0 }}>
              Credit Score & Trust Level
            </label>
            <span style={{ fontSize: 12, fontWeight: 700, color: trustRating.color }}>
              {trustRating.label}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 24,
              fontFamily: "var(--display)",
              color: "var(--stamp)",
              marginBottom: 8,
            }}
          >
            <ShieldCheck style={{ width: 22, height: 22 }} />
            {currentUser.credit_score} / 100
          </div>

          {/* Score Progress Bar */}
          <div
            style={{
              width: "100%",
              height: 8,
              background: "var(--paper)",
              border: "1px solid var(--line)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${currentUser.credit_score}%`,
                height: "100%",
                background: "var(--stamp)",
                borderRadius: 4,
                transition: "width 0.4s ease",
              }}
            />
          </div>
        </div>

        {/* Points Balance */}
        <div style={{ marginBottom: 24 }}>
          <label className="label">Points Balance</label>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 26,
              fontFamily: "var(--display)",
              color: "var(--gold)",
            }}
          >
            <Coins style={{ width: 22, height: 22 }} />
            {currentUser.points} points
          </div>
        </div>

        <div className="dashed-divider" />

        {/* Currency Preference Form */}
        <form onSubmit={handleSave} style={{ marginTop: 20 }}>
          <label className="label">Preferred Currency Display</label>
          <select
            className="input"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as any)}
            style={{ marginBottom: 16 }}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} ({c.symbol})
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="btn stamp"
            style={{ width: "100%" }}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </form>
      </div>

      {/* Credit Score Guide Alert */}
      <div
        className="ticket"
        style={{
          marginTop: 20,
          padding: 18,
          background: "var(--paper)",
          borderStyle: "dashed",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, color: "var(--stamp)", fontWeight: 700, fontSize: 13 }}>
          <Info style={{ width: 16, height: 16 }} />
          HOW CREDIT SCORE AFFECTS YOUR EARNINGS
        </div>
        <ul style={{ fontSize: 13, color: "var(--ink-muted)", paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Every valid approved upload adds <strong>+5 credit points</strong>.</li>
          <li>Higher credit scores increase your points reward multiplier on future uploads.</li>
          <li>Submitting fake or invalid codes results in a <strong>-20 credit deduction</strong>.</li>
        </ul>
      </div>
    </div>
  );
}
