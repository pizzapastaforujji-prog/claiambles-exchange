"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useExchange } from "@/lib/ExchangeContext";
import { daysUntil, formatMoney } from "@/lib/claimRules";
import {
  Coins,
  ShieldCheck,
  Upload,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const {
    state,
    currentUser,
    sessionEmail,
    confirmRedemption,
    disputeRedemption,
    flash,
  } = useExchange();

  const [busyId, setBusyId] = useState<string | null>(null);
  const [disputeDrafts, setDisputeDrafts] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!currentUser || !sessionEmail) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div className="card" style={{ maxWidth: 440, margin: "0 auto", padding: "32px 24px" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Sign In to View Dashboard
          </h3>
          <p style={{ color: "var(--ink-muted)", fontSize: 13.5, marginBottom: 18 }}>
            Access your unmasked voucher codes, manage escrow points, and view your uploads.
          </p>
          <Link href="/browse" className="btn primary">
            Browse Claimables
          </Link>
        </div>
      </div>
    );
  }

  const myUploads = state.claimables.filter((c) => c.uploader === sessionEmail);
  const myRedemptions = state.claimables.filter((c) => c.redeemed_by === sessionEmail);

  const copyCode = (codeStr: string, id: string) => {
    navigator.clipboard.writeText(codeStr);
    setCopiedId(id);
    flash("Code copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirm = async (id: string) => {
    if (busyId) return;
    setBusyId(id);
    await confirmRedemption(id);
    setBusyId(null);
  };

  const handleDispute = async (id: string) => {
    if (busyId) return;
    const reason = (disputeDrafts[id] || "").trim();
    if (!reason) {
      flash("Please describe what went wrong before reporting.");
      return;
    }
    setBusyId(id);
    await disputeRedemption(id, reason);
    setBusyId(null);
  };

  const statusLabel: Record<string, string> = {
    valid: "Live on Exchange",
    pending_confirmation: "Awaiting Confirmation",
    confirmed: "Confirmed & Released",
    disputed: "Disputed & Refunded",
    expired: "Expired Unclaimed",
    admin_review: "Under Admin Review",
  };

  const statusPillClass: Record<string, string> = {
    valid: "brand",
    pending_confirmation: "gold",
    confirmed: "brand",
    disputed: "alert",
    expired: "neutral",
    admin_review: "neutral",
  };

  return (
    <div style={{ paddingTop: 28 }}>
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: 2,
            }}
          >
            Your Dashboard
          </h2>
          <p style={{ color: "var(--ink-muted)", fontSize: 13.5 }}>
            Signed in as <strong>{sessionEmail}</strong>
          </p>
        </div>

        <Link href="/upload" className="btn primary small">
          + Upload Claimable
        </Link>
      </div>

      {/* 4 Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
          gap: 12,
          marginBottom: 30,
        }}
      >
        <div className="card" style={{ padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-subtle)", fontSize: 11.5, fontWeight: 700 }}>
            <Coins style={{ width: 14, height: 14, color: "var(--gold)" }} />
            POINTS BALANCE
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, color: "var(--gold)", margin: "3px 0" }}>
            {currentUser.points}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>Available to spend</div>
        </div>

        <div className="card" style={{ padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-subtle)", fontSize: 11.5, fontWeight: 700 }}>
            <ShieldCheck style={{ width: 14, height: 14, color: "var(--brand)" }} />
            CREDIT SCORE
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, color: "var(--brand)", margin: "3px 0" }}>
            {currentUser.credit_score} <span style={{ fontSize: 16, color: "var(--ink-subtle)", fontWeight: 500 }}>/ 100</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>Trust multiplier level</div>
        </div>

        <div className="card" style={{ padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-subtle)", fontSize: 11.5, fontWeight: 700 }}>
            <Upload style={{ width: 14, height: 14 }} />
            TOTAL UPLOADS
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, margin: "3px 0" }}>
            {myUploads.length}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>Vouchers shared</div>
        </div>

        <div className="card" style={{ padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-subtle)", fontSize: 11.5, fontWeight: 700 }}>
            <ShoppingBag style={{ width: 14, height: 14 }} />
            REDEMPTIONS
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, margin: "3px 0" }}>
            {myRedemptions.length}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>Deals availed</div>
        </div>
      </div>

      {/* Active Redemptions List */}
      <section style={{ marginBottom: 34 }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
          Your Redeemed Vouchers
        </h3>

        {myRedemptions.length === 0 ? (
          <div className="card" style={{ padding: "26px 20px", textAlign: "center" }}>
            <p style={{ color: "var(--ink-muted)", fontSize: 13.5, marginBottom: 12 }}>
              You haven&apos;t redeemed any claimables yet. Explore the marketplace to find deals!
            </p>
            <Link href="/browse" className="btn primary small">
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {myRedemptions.map((c) => {
              const daysRemaining = c.confirm_by ? daysUntil(c.confirm_by) : null;
              const isPending = c.status === "pending_confirmation";

              return (
                <div key={c.id} className="card" style={{ padding: "18px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span className="pill gold" style={{ fontSize: 11, padding: "2px 7px" }}>{c.category}</span>
                        <span className="pill neutral" style={{ fontSize: 11, padding: "2px 7px" }}>{c.redemptionMethod}</span>
                      </div>
                      <h4 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
                        {c.brand} — {c.offerTitle}
                      </h4>
                      <div style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>
                        Face Value: <strong>{formatMoney(c.value, c.currency)}</strong> · Cost: <strong>{c.points_total} pts</strong>
                      </div>
                    </div>

                    <span className={`pill ${statusPillClass[c.status] || "neutral"}`}>
                      {statusLabel[c.status] || c.status}
                    </span>
                  </div>

                  {/* Unmasked Code or Photo */}
                  {c.status === "disputed" ? (
                    <div
                      style={{
                        padding: "10px 12px",
                        background: "var(--alert-light)",
                        border: "1px solid rgba(194,65,45,0.2)",
                        borderRadius: "var(--radius-sm)",
                        fontSize: 12.5,
                        color: "var(--alert)",
                      }}
                    >
                      <strong>Disputed:</strong> {c.dispute_reason || "Reported invalid"} — Points refunded to your balance.
                    </div>
                  ) : (
                    <div>
                      <div className="label" style={{ color: "var(--brand)", marginBottom: 4 }}>
                        Unmasked Code / Voucher Identifier
                      </div>

                      {c.type === "code" ? (
                        <div className="code-pill" style={{ marginBottom: 10 }}>
                          <span>{c.code}</span>
                          <button
                            type="button"
                            className="btn secondary small"
                            onClick={() => copyCode(c.code || "", c.id)}
                            style={{ padding: "3px 8px", fontSize: 11.5 }}
                          >
                            {copiedId === c.id ? (
                              <>
                                <Check style={{ width: 12, height: 12, color: "var(--brand)" }} />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy style={{ width: 12, height: 12 }} />
                                Copy Code
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        c.imageDataUrl && (
                          <div style={{ marginBottom: 12 }}>
                            <img
                              src={`data:${c.imageMediaType || "image/jpeg"};base64,${c.imageDataUrl}`}
                              alt="Revealed claimable voucher"
                              style={{
                                maxWidth: 280,
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--border)",
                                display: "block",
                              }}
                            />
                            {c.ai_detected_code && (
                              <div style={{ marginTop: 6, fontSize: 12.5 }}>
                                OCR Code: <strong>{c.ai_detected_code}</strong>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Confirmation & Dispute Loop */}
                  {isPending && (
                    <div
                      style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: "1px dashed var(--border)",
                      }}
                    >
                      <div style={{ fontSize: 12, color: "var(--ink-subtle)", marginBottom: 8 }}>
                        {daysRemaining && daysRemaining > 0
                          ? `⏳ Auto-confirms and releases points to uploader in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} if no dispute is reported.`
                          : "⏳ Auto-confirming soon."}
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <button
                          type="button"
                          className="btn primary small"
                          onClick={() => handleConfirm(c.id)}
                          disabled={busyId === c.id}
                        >
                          <CheckCircle2 style={{ width: 13, height: 13 }} />
                          {busyId === c.id ? "Processing..." : "Confirm It Worked"}
                        </button>

                        <input
                          className="input"
                          style={{ flex: "1 1 200px", fontSize: 12.5, padding: "5px 9px" }}
                          placeholder="Reason if reporting invalid..."
                          value={disputeDrafts[c.id] || ""}
                          onChange={(e) =>
                            setDisputeDrafts({ ...disputeDrafts, [c.id]: e.target.value })
                          }
                        />

                        <button
                          type="button"
                          className="btn alert small"
                          onClick={() => handleDispute(c.id)}
                          disabled={busyId === c.id}
                        >
                          <AlertCircle style={{ width: 13, height: 13 }} />
                          Report Invalid
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* User's Uploads */}
      <section>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
          Your Uploaded Claimables
        </h3>

        {myUploads.length === 0 ? (
          <div className="card" style={{ padding: "26px 20px", textAlign: "center" }}>
            <p style={{ color: "var(--ink-muted)", fontSize: 13.5, marginBottom: 12 }}>
              You haven&apos;t uploaded any claimables yet. Share your unused vouchers to earn points!
            </p>
            <Link href="/upload" className="btn primary small">
              Upload Your First Voucher
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {myUploads.map((c) => (
              <div
                key={c.id}
                className="card"
                style={{
                  padding: "14px 18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 14,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h4 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, marginBottom: 2 }}>
                    {c.brand} — {c.offerTitle}
                  </h4>
                  <div style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>
                    Value: <strong>{formatMoney(c.value, c.currency)}</strong> · Expires: {c.expiry}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--brand)", marginTop: 3 }}>
                    +{c.points_upfront} pts upfront
                    {c.status === "confirmed" && (
                      <strong style={{ color: "var(--brand)" }}> + {c.points_final} pts confirmed</strong>
                    )}
                    {c.status === "pending_confirmation" && (
                      <span style={{ color: "var(--gold)" }}> ({c.points_final} pts in escrow)</span>
                    )}
                  </div>
                </div>

                <span className={`pill ${statusPillClass[c.status] || "neutral"}`}>
                  {statusLabel[c.status] || c.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
