"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useExchange } from "@/lib/ExchangeContext";
import { isValidEmail } from "@/lib/claimRules";
import {
  Coins,
  ShieldCheck,
  Ticket,
  User,
  LogIn,
  LogOut,
  Sparkles,
  AlertCircle,
  Lock,
  Mail,
  ArrowRight,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { sessionEmail, currentUser, logout, login, signup, flash } = useExchange();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/browse", label: "Browse" },
    { href: "/upload", label: "Upload" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/profile", label: "Profile" },
  ];

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const cleanEmail = authEmail.trim().toLowerCase();

    if (!cleanEmail) {
      setAuthError("Please enter your email address.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setAuthError("Please enter a valid email address.");
      return;
    }

    if (authPassword.length < 4) {
      setAuthError("Password must be at least 4 characters.");
      return;
    }

    setAuthBusy(true);
    try {
      if (authMode === "signup") {
        const success = await signup(cleanEmail, authPassword);
        if (success) {
          setShowAuthModal(false);
          setAuthEmail("");
          setAuthPassword("");
        }
      } else {
        const success = await login(cleanEmail, authPassword);
        if (success) {
          setShowAuthModal(false);
          setAuthEmail("");
          setAuthPassword("");
        }
      }
    } catch (err: any) {
      setAuthError(err?.message || "Authentication failed.");
    } finally {
      setAuthBusy(false);
    }
  };

  return (
    <>
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          background: "rgba(251, 249, 245, 0.9)",
          backdropFilter: "blur(10px)",
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: 1040,
            margin: "0 auto",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "var(--ink)",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "var(--radius-sm)",
                background: "var(--brand-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--brand)",
                border: "1px solid rgba(30, 94, 58, 0.2)",
              }}
            >
              <Ticket style={{ width: 17, height: 17 }} />
            </div>
            <span>Claim<span style={{ color: "var(--brand)" }}>Exchange</span></span>
          </Link>

          {/* Navigation Links */}
          <nav style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            {navItems.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`navlink ${isActive ? "active" : ""}`}
                >
                  {label}
                </Link>
              );
            })}
            {currentUser?.role === "admin" && (
              <Link
                href="/admin"
                className={`navlink ${pathname === "/admin" ? "active" : ""}`}
                style={{ color: "var(--alert)" }}
              >
                Admin
              </Link>
            )}
          </nav>

          {/* User Status / Auth Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {currentUser ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Credit Score & Points Badges */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-full)",
                    padding: "3px 10px",
                    fontSize: 12.5,
                  }}
                >
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontWeight: 700,
                      color: "var(--gold)",
                    }}
                    title="Points Balance"
                  >
                    <Coins style={{ width: 13, height: 13 }} />
                    {currentUser.points} pts
                  </span>
                  <span style={{ color: "var(--border)" }}>|</span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontWeight: 700,
                      color: "var(--brand)",
                    }}
                    title="Credit Trust Score"
                  >
                    <ShieldCheck style={{ width: 13, height: 13 }} />
                    {currentUser.credit_score}
                  </span>
                </div>

                {/* User Sign Out */}
                <button
                  type="button"
                  className="btn secondary small"
                  onClick={logout}
                  title={`Signed in as ${sessionEmail}`}
                  style={{ borderRadius: "var(--radius-full)" }}
                >
                  <LogOut style={{ width: 12, height: 12 }} />
                  Sign out
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="btn secondary small"
                  style={{ borderRadius: "var(--radius-full)" }}
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError("");
                    setShowAuthModal(true);
                  }}
                >
                  <LogIn style={{ width: 13, height: 13 }} />
                  Log in
                </button>
                <button
                  type="button"
                  className="btn primary small"
                  style={{ borderRadius: "var(--radius-full)" }}
                  onClick={() => {
                    setAuthMode("signup");
                    setAuthError("");
                    setShowAuthModal(true);
                  }}
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Sleek Auth Modal */}
      {showAuthModal && (
        <div className="modal-backdrop" onClick={() => setShowAuthModal(false)}>
          <div
            className="card"
            style={{ width: "100%", maxWidth: 390, padding: "26px 24px" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Tabs */}
            <div
              style={{
                display: "flex",
                background: "var(--canvas)",
                padding: 3,
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border)",
                marginBottom: 18,
              }}
            >
              <button
                type="button"
                className={`btn ${authMode === "login" ? "primary" : "secondary"}`}
                style={{
                  flex: 1,
                  padding: "7px 10px",
                  fontSize: 13,
                  border: "none",
                  boxShadow: authMode === "login" ? "var(--shadow-xs)" : "none",
                  background: authMode === "login" ? "var(--brand)" : "transparent",
                }}
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                }}
              >
                Log In
              </button>
              <button
                type="button"
                className={`btn ${authMode === "signup" ? "primary" : "secondary"}`}
                style={{
                  flex: 1,
                  padding: "7px 10px",
                  fontSize: 13,
                  border: "none",
                  boxShadow: authMode === "signup" ? "var(--shadow-xs)" : "none",
                  background: authMode === "signup" ? "var(--brand)" : "transparent",
                }}
                onClick={() => {
                  setAuthMode("signup");
                  setAuthError("");
                }}
              >
                Sign Up
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 21, fontWeight: 700, marginBottom: 4 }}>
                {authMode === "login" ? "Welcome back" : "Create your account"}
              </h3>
              <p style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.4 }}>
                {authMode === "login"
                  ? "Access your points wallet, uploaded vouchers, and active redemptions."
                  : "Join the exchange and receive +20 welcome bonus points with a credit score of 50."}
              </p>
            </div>

            {authError && (
              <div
                style={{
                  padding: "9px 12px",
                  background: "var(--alert-light)",
                  border: "1px solid rgba(194,65,45,0.2)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 12.5,
                  color: "var(--alert)",
                  marginBottom: 14,
                }}
              >
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="submit"
                  className="btn primary"
                  style={{ flex: 1, padding: "10px 14px" }}
                  disabled={authBusy}
                >
                  {authBusy
                    ? "Working..."
                    : authMode === "login"
                    ? "Log In"
                    : "Create Account"}
                  {!authBusy && <ArrowRight style={{ width: 14, height: 14 }} />}
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowAuthModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
