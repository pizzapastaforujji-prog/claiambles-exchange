"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useExchange } from "@/lib/ExchangeContext";
import { Coins, ShieldCheck, Ticket, User, LogIn, LogOut, Sparkles, AlertCircle } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { sessionEmail, currentUser, logout, login } = useExchange();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState("");

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/browse", label: "Browse" },
    { href: "/upload", label: "Upload" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/profile", label: "Profile" },
  ];

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim()) return;
    await login(authEmail);
    setShowAuthModal(false);
    setAuthEmail("");
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
              <button
                type="button"
                className="btn stamp small"
                onClick={() => setShowAuthModal(true)}
              >
                <LogIn style={{ width: 14, height: 14 }} />
                Log in / Sign up
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="modal-backdrop" onClick={() => setShowAuthModal(false)}>
          <div
            className="ticket ticket-no-notches"
            style={{ width: "100%", maxWidth: 380, padding: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Sparkles style={{ width: 22, height: 22, color: "var(--stamp)" }} />
              <h3 style={{ fontFamily: "var(--display)", fontSize: 26 }}>
                Welcome to ClaimExchange
              </h3>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-muted)", marginBottom: 20 }}>
              Sign in with your email to start uploading vouchers, earning points, and redeeming exclusive discounts.
            </p>

            <form onSubmit={handleQuickLogin}>
              <label className="label">Your Email Address</label>
              <input
                type="email"
                className="input"
                placeholder="you@example.com"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                style={{ marginBottom: 16 }}
                autoFocus
              />

              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" className="btn stamp" style={{ flex: 1 }}>
                  Continue
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
                marginTop: 20,
                padding: "10px 12px",
                background: "var(--paper)",
                borderRadius: 4,
                border: "1px dashed var(--line)",
                fontSize: 12,
                color: "var(--ink-subtle)",
                display: "flex",
                gap: 8,
              }}
            >
              <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, color: "var(--stamp)" }} />
              <span>
                New members automatically receive <strong>20 bonus points</strong> and an initial credit score of <strong>50</strong>!
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
