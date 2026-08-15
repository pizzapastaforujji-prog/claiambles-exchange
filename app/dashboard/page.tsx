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
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <h3 style={{ fontFamily: "var(--display)", fontSize: 32, marginBottom: 12 }}>
          SIGN IN TO VIEW YOUR DASHBOARD
        </h3>
        <p style={{ color: "var(--ink-muted)", marginBottom: 20 }}>
          Manage your uploaded vouchers, review active redemptions, and monitor your credit score.
        </p>
        <Link href="/browse" className="btn stamp">
          Browse Claimables
        </Link>
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

  const statusLabel = {
    valid: "Live on Exchange",
    pending_confirmation: "Awaiting Confirmation",
    confirmed: "Confirmed & Released",
    disputed: "Disputed & Refunded",
    expired: "Expired Unclaimed",
    admin_review: "Under Admin Review",
  };

  const statusBadgeClass = {
    valid: "stamp",
    pending_confirmation: "gold",
    confirmed: "stamp",
    disputed: "alert",
    expired: "neutral",
    admin_review: "neutral",
  };

  return (
    <div style={{ paddingTop: 36 }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "var(--display)", fontSize: 38, marginBottom: 2 }}>
            YOUR DASHBOARD
          </h2>
          <p style={{ color: "var(--ink-muted)", fontSize: 14 }}>
            Signed in as <strong>{sessionEmail}</strong>
          </p>
        </div>

        <Link href="/upload" className="btn stamp small">
          + Upload Claimable
        </Link>
      </div>

      {/* 4 Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 16,
          marginBottom: 36,
        }}
      >
        <div className="ticket" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-subtle)", fontSize: 12, fontWeight: 700 }}>
            <Coins style={{ width: 15, height: 15, color: "var(--gold)" }} />
            POINTS BALANCE
          </div>
          <div style={{ fontFamily: "var(--display)", fontSize: 40, color: "var(--gold)", margin: "4px 0" }}>
            {currentUser.points}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>Available to redeem</div>
        </div>

        <div className="ticket" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-subtle)", fontSize: 12, fontWeight: 700 }}>
            <ShieldCheck style={{ width: 15, height: 15, color: "var(--stamp)" }} />
            CREDIT SCORE
          </div>
          <div style={{ fontFamily: "var(--display)", fontSize: 40, color: "var(--stamp)", margin: "4px 0" }}>
            {currentUser.credit_score} <span style={{ fontSize: 20, color: "var(--ink-subtle)" }}>/ 100</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>Trust multiplier level</div>
        </div>

        <div className="ticket" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-subtle)", fontSize: 12, fontWeight: 700 }}>
            <Upload style={{ width: 15, height: 15 }} />
            TOTAL UPLOADS
          </div>
          <div style={{ fontFamily: "var(--display)", fontSize: 40, margin: "4px 0" }}>
            {myUploads.length}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>Coupons shared</div>
        </div>

        <div className="ticket" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink-subtle)", fontSize: 12, fontWeight: 700 }}>
            <ShoppingBag style={{ width: 15, height: 15 }} />
            REDEMPTIONS
          </div>
          <div style={{ fontFamily: "var(--display)", fontSize: 40, margin: "4px 0" }}>
            {myRedemptions.length}
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>Deals availed</div>
        </div>
      </div>

      {/* Active Redemptions List */}
      <section style={{ marginBottom: 40 }}>
        <h3 style={{ fontFamily: "var(--display)", fontSize: 28, marginBottom: 14 }}>
          YOUR REDEEMED VOUCHERS
        </h3>

        {myRedemptions.length === 0 ? (
          <div className="ticket" style={{ padding: "28px 20px", textAlign: "center" }}>
            <p style={{ color: "var(--ink-muted)", fontSize: 14, marginBottom: 14 }}>
              You haven&apos;t redeemed any claimables yet. Explore the marketplace to find deals!
            </p>
            <Link href="/browse" className="btn stamp small">
              Browse Live Deals
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {myRedemptions.map((c) => {
              const daysRemaining = c.confirm_by ? daysUntil(c.confirm_by) : null;
              const isPending = c.status === "pending_confirmation";

              return (
                <div key={c.id} className="ticket" style={{ padding: 22 }}>
                  {/* Top Bar of item */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span className="badge gold">{c.category}</span>
                        <span className="badge neutral">{c.redemptionMethod}</span>
                      </div>
                      <h4 style={{ fontFamily: "var(--display)", fontSize: 24, marginBottom: 2 }}>
                        {c.brand} — {c.offerTitle}
                      </h4>
                      <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                        Face Value: <strong>{formatMoney(c.value, c.currency)}</strong> · Cost: <strong>{c.points_total} pts</strong>
                      </div>
                    </div>

                    <span className={`badge ${statusBadgeClass[c.status] || "neutral"}`}>
                      {statusLabel[c.status] || c.status}
                    </span>
                  </div>

                  {/* Unmasked Code or Photo Display */}
                  {c.status === "disputed" ? (
                    <div
                      style={{
                        padding: "12px 14px",
                        background: "var(--alert-light)",
                        border: "1px solid rgba(178,70,50,0.2)",
                        borderRadius: 4,
                        fontSize: 13,
                        color: "var(--alert)",
                      }}
                    >
                      <strong>Disputed:</strong> {c.dispute_reason || "Reported invalid"} — Points were refunded to your balance.
                    </div>
                  ) : (
                    <div>
                      <div className="label" style={{ color: "var(--stamp)", marginBottom: 4 }}>
                        REDEEMED UNMASKED IDENTIFIER
                      </div>

                      {c.type === "code" ? (
                        <div className="code-box" style={{ marginBottom: 12 }}>
                          <span>{c.code}</span>
                          <button
                            type="button"
                            className="btn secondary small"
                            onClick={() => copyCode(c.code || "", c.id)}
                            style={{ padding: "4px 8px", fontSize: 12 }}
                          >
                            {copiedId === c.id ? (
                              <>
                                <Check style={{ width: 13, height: 13, color: "var(--stamp)" }} />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy style={{ width: 13, height: 13 }} />
                                Copy Code
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        c.imageDataUrl && (
                          <div style={{ marginBottom: 14 }}>
                            <img
                              src={`data:${c.imageMediaType || "image/jpeg"};base64,${c.imageDataUrl}`}
                              alt="Revealed claimable voucher"
                              style={{
                                maxWidth: 320,
                                borderRadius: 4,
                                border: "1px solid var(--line)",
                                display: "block",
                              }}
                            />
                            {c.ai_detected_code && (
                              <div style={{ marginTop: 6, fontSize: 13 }}>
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
                        marginTop: 14,
                        paddingTop: 14,
                        borderTop: "1px dashed var(--line)",
                      }}
                    >
                      <div style={{ fontSize: 12, color: "var(--ink-subtle)", marginBottom: 10 }}>
                        {daysRemaining && daysRemaining > 0
                          ? `⏳ Auto-confirms and releases points to uploader in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"} if no report is filed.`
                          : "⏳ Auto-confirming soon."}
                      </div>

                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <button
                          type="button"
                          className="btn stamp small"
                          onClick={() => handleConfirm(c.id)}
                          disabled={busyId === c.id}
                        >
                          <CheckCircle2 style={{ width: 14, height: 14 }} />
                          {busyId === c.id ? "Processing..." : "Confirm it worked"}
                        </button>

                        <input
                          className="input"
                          style={{ flex: "1 1 240px", fontSize: 13, padding: "6px 10px" }}
                          placeholder="Reason if reporting invalid (e.g. code was already used)..."
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
                          <AlertCircle style={{ width: 14, height: 14 }} />
                          Report as invalid
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
        <h3 style={{ fontFamily: "var(--display)", fontSize: 28, marginBottom: 14 }}>
          YOUR UPLOADED CLAIMABLES
        </h3>

        {myUploads.length === 0 ? (
          <div className="ticket" style={{ padding: "28px 20px", textAlign: "center" }}>
            <p style={{ color: "var(--ink-muted)", fontSize: 14, marginBottom: 14 }}>
              You haven&apos;t uploaded any claimables yet. Share your unused vouchers to earn points!
            </p>
            <Link href="/upload" className="btn stamp small">
              Upload Your First Voucher
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {myUploads.map((c) => (
              <div
                key={c.id}
                className="ticket"
                style={{
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h4 style={{ fontFamily: "var(--display)", fontSize: 22, marginBottom: 2 }}>
                    {c.brand} — {c.offerTitle}
                  </h4>
                  <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                    Value: <strong>{formatMoney(c.value, c.currency)}</strong> · Expires: {c.expiry}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--stamp)", marginTop: 4 }}>
                    +{c.points_upfront} pts received upfront
                    {c.status === "confirmed" && (
                      <strong style={{ color: "var(--stamp)" }}> + {c.points_final} pts confirmed payout</strong>
                    )}
                    {c.status === "pending_confirmation" && (
                      <span style={{ color: "var(--gold)" }}> ({c.points_final} pts pending in escrow)</span>
                    )}
                  </div>
                </div>

                <span className={`badge ${statusBadgeClass[c.status] || "neutral"}`}>
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
