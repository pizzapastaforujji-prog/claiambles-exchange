"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useExchange } from "@/lib/ExchangeContext";
import { isValidEmail } from "@/lib/claimRules";
import {
  Coins,
  ShieldCheck,
  User,
  LogIn,
  LogOut,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { sessionEmail, currentUser, logout, login, signup, refreshFromCloud, flash } = useExchange();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

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
        const res = await signup(cleanEmail, authPassword);
        if (res.success) {
          setShowAuthModal(false);
          setAuthEmail("");
          setAuthPassword("");
          setAuthError("");
        } else {
          setAuthError(res.message || "Failed to create account.");
        }
      } else {
        const res = await login(cleanEmail, authPassword);
        if (res.success) {
          setShowAuthModal(false);
          setAuthEmail("");
          setAuthPassword("");
          setAuthError("");
        } else {
          setAuthError(res.message || "Incorrect email or password.");
        }
      }
    } catch (err: any) {
      setAuthError(err?.message || "Authentication error occurred.");
    } finally {
      setAuthBusy(false);
    }
  };

  const handleManualSync = async () => {
    setRefreshing(true);
    await refreshFromCloud();
    flash("Cloud database synced!");
    setTimeout(() => setRefreshing(false), 500);
  };

  const isAdmin =
    currentUser?.role === "admin" ||
    Boolean(
      sessionEmail &&
        (sessionEmail.toLowerCase().includes("admin") ||
          sessionEmail.toLowerCase() === "ujjwalsha2009@gmail.com")
    );

  return (
    <>
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          background: "rgba(251, 249, 245, 0.92)",
          backdropFilter: "blur(12px)",
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: 1060,
            margin: "0 auto",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          {/* Brand Logo & Name */}
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 21,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              display: "flex",
              alignItems: "center",
              gap: 9,
              color: "var(--ink)",
            }}
          >
            {/* Custom Aesthetic PassThePromo Logo Icon */}
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "linear-gradient(135deg, #1E5E3A 0%, #2A8251 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 4px 10px rgba(30, 94, 58, 0.25)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 8C4 6.89543 4.89543 6 6 6H18C19.1046 6 20 6.89543 20 8V9C18.8954 9 18 9.89543 18 11C18 12.1046 18.8954 13 20 13V16C20 17.1046 19.1046 18 18 18H6C4.89543 18 4 17.1046 4 16V13C5.10457 13 6 12.1046 6 11C6 9.89543 5.10457 9 4 9V8Z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M10 11L14 11M14 11L12 9M14 11L12 13" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span>
              Pass<span style={{ color: "var(--brand)" }}>ThePromo</span>
            </span>
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
            {isAdmin && (
              <Link
                href="/admin"
                className={`navlink ${pathname === "/admin" ? "active" : ""}`}
                style={{ color: "var(--alert)", fontWeight: 700 }}
              >
                🛡️ Admin
              </Link>
            )}
          </nav>

          {/* User Status / Auth Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Real-time Cloud Sync Button */}
            <button
              type="button"
              className="btn secondary small"
              onClick={handleManualSync}
              title="Sync live data with cloud"
              style={{ padding: "6px 8px", borderRadius: "var(--radius-full)" }}
            >
              <RefreshCw style={{ width: 13, height: 13, transform: refreshing ? "rotate(180deg)" : "none", transition: "transform 0.4s ease" }} />
            </button>

            {currentUser ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                    title="Trust Score"
                  >
                    <ShieldCheck style={{ width: 13, height: 13 }} />
                    {currentUser.credit_score}
                  </span>
                </div>

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
                {authMode === "login" ? "Welcome back" : "Create your PassThePromo account"}
              </h3>
              <p style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.4 }}>
                {authMode === "login"
                  ? "Access your points wallet, uploaded vouchers, and active deals."
                  : "Join the community and get +20 welcome bonus points with a credit score of 50."}
              </p>
            </div>

            {Boolean(authError && authError.trim().length > 0) && (
              <div
                style={{
                  padding: "9px 12px",
                  background: "var(--alert-light)",
                  border: "1px solid rgba(194,65,45,0.2)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: 12.5,
                  color: "var(--alert)",
                  marginBottom: 14,
                  lineHeight: 1.4,
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
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="input"
                    placeholder="••••••••"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
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
