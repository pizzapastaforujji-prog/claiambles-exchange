"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useExchange } from "@/lib/ExchangeContext";
import { formatMoney } from "@/lib/claimRules";
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Eye,
  Lock,
  Filter,
  UserCheck,
  AlertCircle,
} from "lucide-react";

export default function AdminPage() {
  const {
    state,
    currentUser,
    adminApproveClaimable,
    adminRejectClaimable,
    flash,
  } = useExchange();

  const [statusFilter, setStatusFilter] = useState("all");

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <ShieldAlert style={{ width: 48, height: 48, color: "var(--alert)", margin: "0 auto 16px" }} />
        <h3 style={{ fontFamily: "var(--display)", fontSize: 32, marginBottom: 12 }}>
          ADMIN PORTAL ACCESS REQUIRED
        </h3>
        <p style={{ color: "var(--ink-muted)", marginBottom: 20 }}>
          You must be logged in as an administrator to access the verification moderation queue.
        </p>
        <p style={{ fontSize: 13, color: "var(--ink-subtle)" }}>
          (Tip: Log in with an email containing &quot;admin&quot; like <code>admin@claimexchange.com</code> to activate admin privileges)
        </p>
      </div>
    );
  }

  const filteredClaimables = state.claimables.filter((c) => {
    if (statusFilter === "all") return true;
    return c.status === statusFilter;
  });

  return (
    <div style={{ paddingTop: 36 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="badge alert" style={{ marginBottom: 6 }}>
            ADMIN MODERATION CONSOLE
          </div>
          <h2 style={{ fontFamily: "var(--display)", fontSize: 38, marginBottom: 2 }}>
            EXCHANGE AUDIT & VERIFICATION
          </h2>
          <p style={{ color: "var(--ink-muted)", fontSize: 14 }}>
            Review private claimables, inspect flagged disputes, and manage exchange health.
          </p>
        </div>

        {/* Status Filter */}
        <select
          className="input"
          style={{ width: "auto" }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses ({state.claimables.length})</option>
          <option value="valid">Live Valid</option>
          <option value="pending_confirmation">Pending Confirmation</option>
          <option value="disputed">Disputed / Flagged</option>
          <option value="admin_review">Awaiting Admin Review</option>
        </select>
      </div>

      {/* Claimables Moderation Table */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filteredClaimables.map((c) => (
          <div key={c.id} className="ticket" style={{ padding: "18px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14, flexWrap: "wrap", marginBottom: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span className="badge gold">{c.category}</span>
                  <span className="badge neutral">{c.redemptionMethod}</span>
                  <span className="badge stamp">Uploader: {c.uploader}</span>
                </div>
                <h4 style={{ fontFamily: "var(--display)", fontSize: 24, marginBottom: 2 }}>
                  {c.brand} — {c.offerTitle}
                </h4>
                <div style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                  Value: <strong>{formatMoney(c.value, c.currency)}</strong> · Total Points: <strong>{c.points_total} pts</strong> · Expires: {c.expiry}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  className="btn stamp small"
                  onClick={() => adminApproveClaimable(c.id)}
                  title="Approve and make live"
                >
                  <CheckCircle style={{ width: 14, height: 14 }} />
                  Approve Live
                </button>
                <button
                  type="button"
                  className="btn alert small"
                  onClick={() => adminRejectClaimable(c.id)}
                  title="Reject or flag"
                >
                  <XCircle style={{ width: 14, height: 14 }} />
                  Reject / Flag
                </button>
              </div>
            </div>

            {/* Details inspection */}
            <div
              style={{
                padding: "10px 14px",
                background: "var(--paper)",
                borderRadius: 4,
                border: "1px dashed var(--line)",
                fontSize: 13,
              }}
            >
              {c.type === "code" ? (
                <div>
                  Code Value: <strong style={{ fontFamily: "var(--mono)" }}>{c.code || "N/A"}</strong>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  {c.imageDataUrl && (
                    <img
                      src={`data:${c.imageMediaType || "image/jpeg"};base64,${c.imageDataUrl}`}
                      alt="Admin preview"
                      style={{ height: 60, borderRadius: 3, border: "1px solid var(--line)" }}
                    />
                  )}
                  <div>
                    <div>Type: <strong>Photo Voucher</strong></div>
                    {c.ai_detected_code && <div>Detected OCR: <code>{c.ai_detected_code}</code></div>}
                  </div>
                </div>
              )}

              {c.ai_reason && (
                <div style={{ marginTop: 6, color: "var(--ink-secondary)", fontSize: 12 }}>
                  Claim AI Log: <em>{c.ai_reason}</em>
                </div>
              )}

              {c.dispute_reason && (
                <div style={{ marginTop: 6, color: "var(--alert)", fontSize: 12, fontWeight: 600 }}>
                  Dispute Reason: {c.dispute_reason}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
