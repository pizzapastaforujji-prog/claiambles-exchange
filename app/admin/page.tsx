"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useExchange } from "@/lib/ExchangeContext";
import { formatMoney } from "@/lib/claimRules";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Trash2,
  Filter,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Lock,
  LogOut,
} from "lucide-react";

export default function AdminPage() {
  const {
    state,
    currentUser,
    sessionEmail,
    adminApproveClaimable,
    adminRejectClaimable,
    adminDeleteClaimable,
    flash,
  } = useExchange();

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminEmailInput, setAdminEmailInput] = useState("");
  const [adminPassInput, setAdminPassInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const savedAdminAuth = sessionStorage.getItem("claim_admin_authenticated");
    if (savedAdminAuth === "true") {
      setIsAdminAuthenticated(true);
    }
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthBusy(true);

    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: adminEmailInput.trim(),
          password: adminPassInput.trim(),
        }),
      });

      const data = await res.json();

      if (data.success) {
        setIsAdminAuthenticated(true);
        sessionStorage.setItem("claim_admin_authenticated", "true");
        flash("Master Admin access granted.");
      } else {
        setAuthError(data.message || "Invalid admin credentials.");
      }
    } catch (err: any) {
      setAuthError("Failed to reach authentication server.");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    sessionStorage.removeItem("claim_admin_authenticated");
    flash("Admin logged out.");
  };

  if (!isAdminAuthenticated) {
    return (
      <div style={{ maxWidth: 420, margin: "60px auto 0", textAlign: "center" }}>
        <div className="card" style={{ padding: "32px 24px" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "var(--radius-full)",
              background: "var(--alert-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--alert)",
              margin: "0 auto 14px",
            }}
          >
            <Lock style={{ width: 22, height: 22 }} />
          </div>

          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
            Restricted Admin Portal
          </h3>
          <p style={{ color: "var(--ink-muted)", fontSize: 13, lineHeight: 1.45, marginBottom: 20 }}>
            Enter your Master Admin credentials to moderate claimables and manage database records.
          </p>

          {authError && (
            <div
              style={{
                padding: "8px 12px",
                background: "var(--alert-light)",
                border: "1px solid rgba(194,65,45,0.2)",
                borderRadius: "var(--radius-sm)",
                fontSize: 12.5,
                color: "var(--alert)",
                marginBottom: 14,
                textAlign: "left",
              }}
            >
              {authError}
            </div>
          )}

          <form onSubmit={handleAdminLogin}>
            <div style={{ marginBottom: 12, textAlign: "left" }}>
              <label className="label">Master Admin Email</label>
              <input
                type="email"
                className="input"
                placeholder="your-admin@email.com"
                required
                value={adminEmailInput}
                onChange={(e) => setAdminEmailInput(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 18, textAlign: "left" }}>
              <label className="label">Master Admin Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input"
                  placeholder="••••••••"
                  required
                  value={adminPassInput}
                  onChange={(e) => setAdminPassInput(e.target.value)}
                  style={{ paddingRight: 38 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--ink-muted)",
                    display: "flex",
                    alignItems: "center",
                    padding: 4,
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff style={{ width: 16, height: 16 }} />
                  ) : (
                    <Eye style={{ width: 16, height: 16 }} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn alert"
              style={{ width: "100%", padding: "10px 14px" }}
              disabled={authBusy}
            >
              {authBusy ? "Verifying..." : "Unlock Admin Portal"}
              {!authBusy && <ArrowRight style={{ width: 14, height: 14 }} />}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredClaimables = state.claimables.filter((c) => {
    if (statusFilter === "all") return true;
    return c.status === statusFilter;
  });

  return (
    <div style={{ paddingTop: 28 }}>
      {/* Header */}
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="pill alert" style={{ fontSize: 11, padding: "2px 8px" }}>
              <ShieldCheck style={{ width: 12, height: 12 }} />
              Authenticated Master Admin
            </span>
            <button
              type="button"
              className="btn secondary small"
              onClick={handleAdminLogout}
              style={{ padding: "2px 8px", fontSize: 11.5 }}
            >
              <LogOut style={{ width: 11, height: 11 }} />
              Lock Admin
            </button>
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: 2,
            }}
          >
            Exchange Database & Moderation
          </h2>
          <p style={{ color: "var(--ink-muted)", fontSize: 13.5 }}>
            Total vouchers in system: <strong>{state.claimables.length}</strong> · Active users: <strong>{Object.keys(state.users).length}</strong>
          </p>
        </div>

        {/* Status Filter */}
        <select
          className="input"
          style={{ width: "auto", fontSize: 13 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Vouchers ({state.claimables.length})</option>
          <option value="valid">Live Valid</option>
          <option value="pending_confirmation">Pending Confirmation</option>
          <option value="disputed">Disputed / Flagged</option>
          <option value="admin_review">Awaiting Admin Review</option>
        </select>
      </div>

      {filteredClaimables.length === 0 ? (
        <div className="card" style={{ padding: "36px 20px", textAlign: "center" }}>
          <p style={{ color: "var(--ink-muted)", fontSize: 13.5 }}>
            No vouchers found matching the current filter.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredClaimables.map((c) => (
            <div key={c.id} className="card" style={{ padding: "16px 18px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 10,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span className="pill gold" style={{ fontSize: 11, padding: "2px 7px" }}>{c.category}</span>
                    <span className="pill neutral" style={{ fontSize: 11, padding: "2px 7px" }}>{c.redemptionMethod}</span>
                    <span className="pill brand" style={{ fontSize: 11, padding: "2px 7px" }}>Uploader: {c.uploader}</span>
                  </div>
                  <h4 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
                    {c.brand} — {c.offerTitle}
                  </h4>
                  <div style={{ fontSize: 12.5, color: "var(--ink-muted)" }}>
                    Value: <strong>{formatMoney(c.value, c.currency)}</strong> · Total: <strong>{c.points_total} pts</strong> · Expires: {c.expiry}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {c.status !== "valid" && (
                    <button
                      type="button"
                      className="btn primary small"
                      onClick={() => adminApproveClaimable(c.id)}
                      title="Make this voucher live"
                    >
                      <CheckCircle style={{ width: 13, height: 13 }} />
                      Make Live
                    </button>
                  )}
                  {c.status === "valid" && (
                    <button
                      type="button"
                      className="btn secondary small"
                      onClick={() => adminRejectClaimable(c.id)}
                      title="Flag/hide this voucher"
                    >
                      <XCircle style={{ width: 13, height: 13, color: "var(--alert)" }} />
                      Reject
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn alert small"
                    onClick={() => {
                      if (window.confirm(`Permanently delete "${c.brand} - ${c.offerTitle}"?`)) {
                        adminDeleteClaimable(c.id);
                      }
                    }}
                    title="Delete permanently from database"
                  >
                    <Trash2 style={{ width: 13, height: 13 }} />
                    Delete
                  </button>
                </div>
              </div>

              {/* Inspection Details */}
              <div
                style={{
                  padding: "8px 12px",
                  background: "var(--canvas)",
                  borderRadius: "var(--radius-sm)",
                  border: "1px dashed var(--border)",
                  fontSize: 12.5,
                }}
              >
                {c.type === "code" ? (
                  <div>
                    Coupon Code: <strong style={{ fontFamily: "var(--font-mono)" }}>{c.code || "N/A"}</strong>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {c.imageDataUrl && (
                      <img
                        src={`data:${c.imageMediaType || "image/jpeg"};base64,${c.imageDataUrl}`}
                        alt="Admin preview"
                        style={{ height: 48, borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}
                      />
                    )}
                    <div>
                      <div>Photo Voucher</div>
                      {c.ai_detected_code && <div>Detected OCR: <code>{c.ai_detected_code}</code></div>}
                    </div>
                  </div>
                )}

                {c.ai_reason && (
                  <div style={{ marginTop: 4, color: "var(--ink-muted)", fontSize: 12 }}>
                    Claim AI Log: <em>{c.ai_reason}</em>
                  </div>
                )}

                {c.dispute_reason && (
                  <div style={{ marginTop: 4, color: "var(--alert)", fontSize: 12, fontWeight: 600 }}>
                    Dispute Reason: {c.dispute_reason}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
