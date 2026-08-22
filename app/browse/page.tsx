"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useExchange } from "@/lib/ExchangeContext";
import {
  CATEGORIES,
  CURRENCIES,
  REDEMPTION_METHODS,
  daysUntil,
  formatDiscount,
  toUSD,
  todayISO,
} from "@/lib/claimRules";
import {
  Search,
  Lock,
  Clock,
  Sparkles,
  Percent,
} from "lucide-react";

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
      flash("Please sign in or create an account to redeem vouchers.");
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
    <div style={{ paddingTop: 28 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: 4,
            }}
          >
            Explore Marketplace
          </h2>
          <p style={{ color: "var(--ink-muted)", fontSize: 13.5 }}>
            Browse active promo codes, gift cards, and vouchers passed by the community.
          </p>
        </div>

        {currentUser && (
          <div
            style={{
              background: "var(--canvas)",
              padding: "6px 12px",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
              fontSize: 12.5,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>Daily Redemption:</span>
            <strong style={{ color: alreadyRedeemedToday ? "var(--alert)" : "var(--brand)" }}>
              {alreadyRedeemedToday ? "1 / 1 used today" : "0 / 1 used today (Available)"}
            </strong>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 22,
        }}
      >
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <Search
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              width: 14,
              height: 14,
              color: "var(--ink-muted)",
            }}
          />
          <input
            className="input"
            style={{ paddingLeft: 32, fontSize: 13 }}
            placeholder="Search by brand or offer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="input"
          style={{ width: "auto", fontSize: 13, padding: "6px 10px" }}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          className="input"
          style={{ width: "auto", fontSize: 13, padding: "6px 10px" }}
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
          style={{ width: "auto", fontSize: 13, padding: "6px 10px" }}
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
        >
          <option value="All">All Methods</option>
          {REDEMPTION_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          className="input"
          style={{ width: "auto", marginLeft: "auto", fontSize: 13, padding: "6px 10px" }}
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
          className="card"
          style={{
            padding: "48px 24px",
            textAlign: "center",
            background: "#ffffff",
          }}
        >
          <Sparkles style={{ width: 32, height: 32, color: "var(--brand)", margin: "0 auto 10px" }} />
          <h4 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
            {state.claimables.length === 0 ? "The Exchange is Ready" : "No Matching Claimables"}
          </h4>
          <p style={{ color: "var(--ink-muted)", fontSize: 13.5, maxWidth: 420, margin: "0 auto 18px", lineHeight: 1.5 }}>
            {state.claimables.length === 0
              ? "There are no vouchers on the marketplace yet. Pass an unused coupon or gift card to earn points and get the exchange started!"
              : "No vouchers match your current filters. Try resetting your search or widen the filters."}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Link href="/upload" className="btn primary small">
              + Pass Your First Promo
            </Link>
            {state.claimables.length > 0 && (
              <button
                type="button"
                className="btn secondary small"
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

      {/* Grid of Claimable Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {available.map((c) => {
          const daysRemaining = daysUntil(c.expiry);
          const isUrgent = daysRemaining <= 3;

          return (
            <div
              key={c.id}
              className="card card-hoverable"
              style={{
                padding: "16px 16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                {/* Photo Preview with Blur Protection */}
                {c.imageDataUrl && (
                  <div
                    style={{
                      position: "relative",
                      marginBottom: 10,
                      overflow: "hidden",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    <img
                      src={`data:${c.imageMediaType || "image/jpeg"};base64,${c.imageDataUrl}`}
                      alt="Voucher photo preview"
                      style={{
                        width: "100%",
                        height: 95,
                        objectFit: "cover",
                        filter: "blur(8px)",
                        display: "block",
                        transform: "scale(1.06)",
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
                        background: "rgba(24, 22, 19, 0.35)",
                        color: "#ffffff",
                        padding: "0 8px",
                        textAlign: "center",
                        gap: 2,
                      }}
                    >
                      <Lock style={{ width: 14, height: 14 }} />
                      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                        Unmasked on redeem
                      </span>
                    </div>
                  </div>
                )}

                {/* Category & Method Tag */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span className="pill gold" style={{ fontSize: 11, padding: "2px 7px" }}>
                    {c.category}
                  </span>
                  <span className="pill neutral" style={{ fontSize: 11, padding: "2px 7px" }}>
                    {c.redemptionMethod}
                  </span>
                </div>

                {/* Brand & Offer */}
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 3,
                    color: "var(--ink)",
                  }}
                >
                  {c.brand}
                </h3>
                <p style={{ fontSize: 12.5, color: "var(--ink-secondary)", marginBottom: 8, minHeight: 34, lineHeight: 1.4 }}>
                  {c.offerTitle}
                </p>

                {/* Face Value / Percentage / Perk */}
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 20,
                    fontWeight: 800,
                    color: "var(--ink)",
                    marginBottom: 4,
                  }}
                >
                  {formatDiscount(c)}
                </div>

                {/* Expiration Tag */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11.5,
                    fontWeight: 600,
                    color: isUrgent ? "var(--alert)" : "var(--ink-muted)",
                    marginBottom: 10,
                  }}
                >
                  <Clock style={{ width: 12, height: 12 }} />
                  {daysRemaining <= 0
                    ? "Expires today"
                    : `Expires in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`}
                </div>
              </div>

              {/* Bottom Action */}
              <div>
                <div className="dashed-line" style={{ margin: "8px 0 10px" }} />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                    fontSize: 12.5,
                  }}
                >
                  <span style={{ color: "var(--ink-muted)" }}>Exchange Cost:</span>
                  <strong style={{ color: "var(--gold)", fontSize: 14 }}>
                    {c.points_total} pts
                  </strong>
                </div>

                <button
                  type="button"
                  className="btn primary"
                  style={{ width: "100%", padding: "7px 12px", fontSize: 13 }}
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
