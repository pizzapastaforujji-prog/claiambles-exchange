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
  CheckCircle2,
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
          borderBottom: "1px solid var(--line)",
          position: "sticky",
          top: 0,
          background: "var(--paper)",
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            padding: "14px 20px",
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
              fontFamily: "var(--display)",
              fontSize: 28,
              letterSpacing: ".02em",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Ticket style={{ width: 24, height: 24, color: "var(--stamp)" }} />
            CLAIM<span style={{ color: "var(--stamp)" }}>EXCHANGE</span>
          </Link>

          {/* Navigation Links */}
          <nav style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {currentUser ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {/* Credit Score & Points Badges */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#ffffff",
                    border: "1px solid var(--line)",
                    borderRadius: 4,
                    padding: "4px 10px",
                    fontSize: 13,
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
                    title="Available Points Balance"
                  >
                    <Coins style={{ width: 14, height: 14 }} />
                    {currentUser.points} pts
                  </span>
                  <span style={{ color: "var(--line)" }}>|</span>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontWeight: 700,
                      color: "var(--stamp)",
                    }}
                    title="User Credit Score"
                  >
                    <ShieldCheck style={{ width: 14, height: 14 }} />
                    {currentUser.credit_score}
                  </span>
                </div>

                {/* User Dropdown / Sign Out */}
                <button
                  type="button"
                  className="btn secondary small"
                  onClick={logout}
                  title={`Signed in as ${sessionEmail}`}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <LogOut style={{ width: 13, height: 13 }} />
                  Sign out
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="btn secondary small"
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError("");
                    setShowAuthModal(true);
                  }}
                >
                  <LogIn style={{ width: 14, height: 14 }} />
                  Log in
                </button>
                <button
                  type="button"
                  className="btn stamp small"
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

      {/* Real Auth Modal */}
      {showAuthModal && (
        <div className="modal-backdrop" onClick={() => setShowAuthModal(false)}>
          <div
            className="ticket ticket-no-notches"
            style={{ width: "100%", maxWidth: 420, padding: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <button
                type="button"
                className={`btn ${authMode === "login" ? "stamp" : "secondary"}`}
                style={{ flex: 1, padding: "8px 12px" }}
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                }}
              >
                Log In
              </button>
              <button
                type="button"
                className={`btn ${authMode === "signup" ? "stamp" : "secondary"}`}
                style={{ flex: 1, padding: "8px 12px" }}
                onClick={() => {
                  setAuthMode("signup");
                  setAuthError("");
                }}
              >
                Sign Up
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontFamily: "var(--display)", fontSize: 26, marginBottom: 4 }}>
                {authMode === "login" ? "Log in to your account" : "Create a new account"}
              </h3>
              <p style={{ fontSize: 13, color: "var(--ink-muted)" }}>
                {authMode === "login"
                  ? "Access your uploaded vouchers, points, and active redemptions."
                  : "Join the exchange: get +20 welcome bonus points and a starting credit score of 50!"}
              </p>
            </div>

            {authError && (
              <div
                style={{
                  padding: "10px 12px",
                  background: "var(--alert-light)",
                  border: "1px solid rgba(178,70,50,0.2)",
                  borderRadius: 4,
                  fontSize: 13,
                  color: "var(--alert)",
                  marginBottom: 14,
                }}
              >
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label className="label">Email Address</label>
                <div style={{ position: "relative" }}>
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
              </div>

              <div style={{ marginBottom: 20 }}>
                <label className="label">Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="submit"
                  className="btn stamp"
                  style={{ flex: 1, padding: "12px 14px" }}
                  disabled={authBusy}
                >
                  {authBusy
                    ? "Working..."
                    : authMode === "login"
                    ? "Log In"
                    : "Create Account"}
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

            <div
              style={{
                marginTop: 18,
                padding: "10px 12px",
                background: "var(--paper)",
                borderRadius: 4,
                border: "1px dashed var(--line)",
                fontSize: 12,
                color: "var(--ink-subtle)",
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <Sparkles style={{ width: 16, height: 16, flexShrink: 0, color: "var(--stamp)" }} />
              <span>
                Each account maintains its own private points wallet, uploads, and 1-per-day redemption limit.
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
