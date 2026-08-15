"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useExchange } from "@/lib/ExchangeContext";
import {
  CATEGORIES,
  CURRENCIES,
  REDEMPTION_METHODS,
  daysUntil,
  formatMoney,
  toUSD,
  todayISO,
} from "@/lib/claimRules";
import { Search, Filter, Lock, Clock, AlertCircle, Sparkles, Check } from "lucide-react";

export default function BrowsePage() {
  const { state, currentUser, sessionEmail, redeemClaimable, flash } = useExchange();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [currencyFilter, setCurrencyFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [sortBy, setSortBy] = useState("expiring");
  const [redeemingId, setRedeemingId] = useState<string | null>(null);

  const today = todayISO();
  const alreadyRedeemedToday = state.redemptions.some((r) => {
    if (r.redeemed_by !== sessionEmail || r.redeemed_at !== today) return false;
    const claimable = state.claimables.find((c) => c.id === r.claimable_id);
    return !claimable || claimable.status !== "disputed";
  });

  // Filter out expired, already redeemed, and own uploaded claimables
  let available = state.claimables
    .filter((c) => c.status === "valid" && c.uploader !== sessionEmail)
    .filter((c) => category === "All" || c.category === category)
    .filter((c) => currencyFilter === "All" || c.currency === currencyFilter)
    .filter((c) => methodFilter === "All" || c.redemptionMethod === methodFilter)
    .filter((c) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        (c.brand || "").toLowerCase().includes(q) ||
        (c.offerTitle || "").toLowerCase().includes(q)
      );
    });

  // Sorting
  if (sortBy === "expiring") {
    available = available.sort((a, b) => daysUntil(a.expiry) - daysUntil(b.expiry));
  } else if (sortBy === "value-high") {
    available = available.sort(
      (a, b) => toUSD(b.value, b.currency) - toUSD(a.value, a.currency)
    );
  } else if (sortBy === "value-low") {
    available = available.sort(
      (a, b) => toUSD(a.value, a.currency) - toUSD(b.value, b.currency)
    );
  } else if (sortBy === "newest") {
    available = available.sort((a, b) => (b.uploaded_at > a.uploaded_at ? 1 : -1));
  }

  const handleRedeem = async (claimable: any) => {
    if (!currentUser) {
      flash("Please sign in or create an account to redeem claimables.");
      return;
    }
    if (redeemingId) return;

    setRedeemingId(claimable.id);
    const res = await redeemClaimable(claimable.id);
    setRedeemingId(null);

    if (!res.success) {
      flash(res.message);
    }
  };

  return (
    <div style={{ paddingTop: 36 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontFamily: "var(--display)", fontSize: 38, marginBottom: 4 }}>
            BROWSE CLAIMABLES
          </h2>
          <p style={{ color: "var(--ink-muted)", fontSize: 14 }}>
            {currentUser ? (
              <>
                You currently have <strong>{currentUser.points} points</strong> available.{" "}
                {alreadyRedeemedToday ? (
                  <span style={{ color: "var(--alert)", fontWeight: 600 }}>
                    (You have used today&apos;s 1 daily redemption slot)
                  </span>
                ) : (
                  <span style={{ color: "var(--stamp)", fontWeight: 600 }}>
                    (1 redemption slot ready today)
                  </span>
                )}
              </>
            ) : (
              "Log in with email to redeem coupons and unlock unmasked codes."
            )}
          </p>
        </div>

        <Link href="/upload" className="btn stamp small">
          + Upload your unused code
        </Link>
      </div>

      {/* Search Input */}
      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            width: 18,
            height: 18,
            color: "var(--ink-subtle)",
          }}
        />
        <input
          className="input"
          style={{ paddingLeft: 42 }}
          placeholder="Search by brand name or offer discount (e.g. Starbucks, Nike, 20% off)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Filter Bar */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-subtle)", fontSize: 13 }}>
          <Filter style={{ width: 14, height: 14 }} />
          <span>Filters:</span>
        </div>

        <select
          className="input"
          style={{ width: "auto" }}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className="input"
          style={{ width: "auto" }}
          value={currencyFilter}
          onChange={(e) => setCurrencyFilter(e.target.value)}
        >
          <option value="All">All Currencies</option>
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} ({c.symbol})
            </option>
          ))}
        </select>

        <select
          className="input"
          style={{ width: "auto" }}
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
        >
          <option value="All">All Redemption Methods</option>
          {REDEMPTION_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          className="input"
          style={{ width: "auto", marginLeft: "auto" }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="expiring">Sort: Expiring soonest (Priority)</option>
          <option value="value-high">Sort: Value (High to Low)</option>
          <option value="value-low">Sort: Value (Low to High)</option>
          <option value="newest">Sort: Newest First</option>
        </select>
      </div>

      {/* Empty State */}
      {available.length === 0 && (
        <div
          className="ticket"
          style={{
            padding: "54px 24px",
            textAlign: "center",
            background: "#ffffff",
          }}
        >
          <Sparkles style={{ width: 36, height: 36, color: "var(--stamp)", margin: "0 auto 12px" }} />
          <h4 style={{ fontFamily: "var(--display)", fontSize: 28, marginBottom: 8 }}>
            {state.claimables.length === 0 ? "THE EXCHANGE IS FRESH & READY" : "NO MATCHING CLAIMABLES"}
          </h4>
          <p style={{ color: "var(--ink-muted)", fontSize: 14, maxWidth: 440, margin: "0 auto 20px", lineHeight: 1.5 }}>
            {state.claimables.length === 0
              ? "There are no vouchers uploaded yet. Be the first contributor to share an unused coupon, earn upfront points, and start the exchange!"
              : "No vouchers match your selected filters. Try widening your search or upload a new coupon to earn points."}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Link href="/upload" className="btn stamp">
              + Upload Your First Claimable
            </Link>
            {state.claimables.length > 0 && (
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                  setCurrencyFilter("All");
                  setMethodFilter("All");
                }}
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Grid of Claimable Tickets */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: 20,
        }}
      >
        {available.map((c) => {
          const daysRemaining = daysUntil(c.expiry);
          const isUrgent = daysRemaining <= 3;

          return (
            <div
              key={c.id}
              className="ticket ticket-interactive"
              style={{
                padding: "20px 18px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                {/* Photo Preview with Blur Protection */}
                {c.imageDataUrl && (
                  <div style={{ position: "relative", marginBottom: 12, overflow: "hidden", borderRadius: 4 }}>
                    <img
                      src={`data:${c.imageMediaType || "image/jpeg"};base64,${c.imageDataUrl}`}
                      alt="Claimable photo (Protected)"
                      style={{
                        width: "100%",
                        height: 110,
                        objectFit: "cover",
                        filter: "blur(9px)",
                        display: "block",
                        transform: "scale(1.08)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(34, 31, 27, 0.4)",
                        color: "#ffffff",
                        padding: "0 10px",
                        textAlign: "center",
                        gap: 4,
                      }}
                    >
                      <Lock style={{ width: 16, height: 16 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                        Unblurred after redemption
                      </span>
                    </div>
                  </div>
                )}

                {/* Category & Method Tag */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span className="badge gold">
                    {c.category}
                  </span>
                  <span className="badge neutral">
                    {c.redemptionMethod}
                  </span>
                </div>

                {/* Brand & Offer */}
                <h3
                  style={{
                    fontFamily: "var(--display)",
                    fontSize: 22,
                    lineHeight: 1.1,
                    marginBottom: 4,
                  }}
                >
                  {c.brand}
                </h3>
                <p style={{ fontSize: 13, color: "var(--ink-secondary)", marginBottom: 12, minHeight: 38 }}>
                  {c.offerTitle}
                </p>

                {/* Face Value */}
                <div
                  style={{
                    fontFamily: "var(--display)",
                    fontSize: 26,
                    color: "var(--ink)",
                    marginBottom: 4,
                  }}
                >
                  {formatMoney(c.value, c.currency)}
                </div>

                {/* Expiration Badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 12,
                    fontWeight: 600,
                    color: isUrgent ? "var(--alert)" : "var(--ink-muted)",
                    marginBottom: 14,
                  }}
                >
                  <Clock style={{ width: 13, height: 13 }} />
                  {daysRemaining <= 0
                    ? "Expires today"
                    : `Expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`}
                </div>
              </div>

              {/* Bottom Card Action */}
              <div>
                <div className="dashed-divider" />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: "var(--ink-muted)" }}>Exchange Cost:</span>
                  <strong style={{ color: "var(--gold)", fontSize: 15 }}>
                    {c.points_total} pts
                  </strong>
                </div>

                <button
                  type="button"
                  className="btn stamp"
                  style={{ width: "100%" }}
                  onClick={() => handleRedeem(c)}
                  disabled={redeemingId === c.id || alreadyRedeemedToday}
                >
                  {redeemingId === c.id ? (
                    "Processing..."
                  ) : alreadyRedeemedToday ? (
                    "Daily Limit Used"
                  ) : (
                    "Redeem Voucher"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
