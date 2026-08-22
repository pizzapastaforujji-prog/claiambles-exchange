"use client";

import React from "react";
import Link from "next/link";
import { useExchange } from "@/lib/ExchangeContext";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Coins,
} from "lucide-react";

export default function HomePage() {
  const { state } = useExchange();
  const liveCount = state.claimables.filter((c) => c.status === "valid").length;

  return (
    <div style={{ paddingTop: 20 }}>
      {/* Hero Section */}
      <section
        style={{
          padding: "44px 0 36px",
          display: "flex",
          gap: 36,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ flex: "1 1 480px", maxWidth: 580 }}>
          <div
            className="pill brand"
            style={{ marginBottom: 14 }}
          >
            <Sparkles style={{ width: 13, height: 13 }} />
            Zero-Waste Promo & Voucher Exchange
          </div>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 44,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: "var(--ink)",
              marginBottom: 16,
            }}
          >
            Pass the promo. Don&apos;t let great deals expire.
          </h1>

          <p
            style={{
              fontSize: 15.5,
              lineHeight: 1.6,
              color: "var(--ink-secondary)",
              marginBottom: 26,
            }}
          >
            Trade gift cards, discount codes, percentage vouchers, and complimentary perks you&apos;ll never use.
            Powered by <strong>Google Gemini Vision AI</strong> for deep photo inspection and fraud detection,
            protecting peers with fair upfront points and escrow security.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/upload" className="btn primary large">
              Pass a Promo
              <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
            <Link href="/browse" className="btn secondary large">
              Explore Marketplace
            </Link>
          </div>
        </div>

        {/* Live Marketplace Widget */}
        <div
          className="card"
          style={{
            flex: "0 0 300px",
            padding: "26px 22px",
            background: "#ffffff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span className="label" style={{ marginBottom: 0 }}>Live on PassThePromo</span>
            <span className="pill brand" style={{ fontSize: 11, padding: "2px 7px" }}>
              Active
            </span>
          </div>

          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 48,
              fontWeight: 800,
              color: "var(--brand)",
              lineHeight: 1,
              margin: "6px 0",
              letterSpacing: "-0.03em",
            }}
          >
            {liveCount}
          </div>

          <div style={{ fontSize: 13, color: "var(--ink-muted)", marginBottom: 18 }}>
            verified vouchers available right now
          </div>

          <div className="dashed-line" />

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Coins style={{ width: 14, height: 14, color: "var(--gold)" }} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--gold)" }}>
              Two-Phase Escrow
            </span>
          </div>
          <p style={{ fontSize: 12.5, color: "var(--ink-secondary)", lineHeight: 1.45 }}>
            <strong>25% upfront</strong> points arrive immediately upon AI approval. The remaining <strong>75%</strong> transfers once confirmed by the redeemer.
          </p>
        </div>
      </section>

      {/* Built on Trust Section */}
      <section style={{ marginTop: 20, marginBottom: 48 }}>
        <div style={{ marginBottom: 18 }}>
          <div className="label" style={{ color: "var(--brand)", marginBottom: 4 }}>
            Why This Works
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>
            Built on Verifiable Trust
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 14,
          }}
        >
          <div className="card" style={{ padding: "20px 18px" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-sm)",
                background: "var(--brand-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--brand)",
                marginBottom: 12,
              }}
            >
              <ShieldCheck style={{ width: 18, height: 18 }} />
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
              Real Accounts & Trust
            </h3>
            <p style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.5 }}>
              Users earn trust score (0–100) based on authenticity. Trusted uploaders unlock higher reward multipliers.
            </p>
          </div>

          <div className="card" style={{ padding: "20px 18px" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-sm)",
                background: "var(--gold-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--gold)",
                marginBottom: 12,
              }}
            >
              <Coins style={{ width: 18, height: 18 }} />
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
              Two-Phase Escrow
            </h3>
            <p style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.5 }}>
              Earn points immediately on upload. Escrow holds the remainder until the recipient verifies the code or 3 days pass.
            </p>
          </div>

          <div className="card" style={{ padding: "20px 18px" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-sm)",
                background: "var(--alert-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--alert)",
                marginBottom: 12,
              }}
            >
              <Lock style={{ width: 18, height: 18 }} />
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
              Dispute Protection
            </h3>
            <p style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.5 }}>
              If a redeemed code is invalid, reporting it refunds the redeemer completely and claws back upfront points from bad uploaders.
            </p>
          </div>

          <div className="card" style={{ padding: "20px 18px" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-sm)",
                background: "var(--brand-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--brand)",
                marginBottom: 12,
              }}
            >
              <Zap style={{ width: 18, height: 18 }} />
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
              Gemini Vision AI
            </h3>
            <p style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.5 }}>
              Google Gemini 2.0 Flash inspects voucher photos, auto-extracts brand & dates, and strictly catches expired or mismatching submissions.
            </p>
          </div>
        </div>
      </section>

      {/* Getting Started Guide */}
      <section style={{ marginBottom: 30 }}>
        <div style={{ marginBottom: 18 }}>
          <div className="label" style={{ color: "var(--gold)", marginBottom: 4 }}>
            Getting Started
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>
            How to Pass a Promo
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 14,
          }}
        >
          <div className="card" style={{ padding: "18px 16px" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--brand)", marginBottom: 4 }}>
              STEP 1
            </div>
            <h4 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              Choose a Type
            </h4>
            <p style={{ fontSize: 12.5, color: "var(--ink-muted)", lineHeight: 1.45 }}>
              Select <strong>Text Code</strong> for digital promo codes or <strong>Voucher Photo</strong> for physical receipts & barcode cards.
            </p>
          </div>

          <div className="card" style={{ padding: "18px 16px" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--brand)", marginBottom: 4 }}>
              STEP 2
            </div>
            <h4 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              Discount Format
            </h4>
            <p style={{ fontSize: 12.5, color: "var(--ink-muted)", lineHeight: 1.45 }}>
              Choose between <strong>Cash $ Value</strong>, <strong>Percentage % Off</strong>, or <strong>Free Perk / Service</strong>.
            </p>
          </div>

          <div className="card" style={{ padding: "18px 16px" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--brand)", marginBottom: 4 }}>
              STEP 3
            </div>
            <h4 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              AI Vision Auto-Extract
            </h4>
            <p style={{ fontSize: 12.5, color: "var(--ink-muted)", lineHeight: 1.45 }}>
              Attach your photo and let Gemini AI automatically read the brand, expiry, and offer without tedious typing.
            </p>
          </div>

          <div className="card" style={{ padding: "18px 16px" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--brand)", marginBottom: 4 }}>
              STEP 4
            </div>
            <h4 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
              Instant Points
            </h4>
            <p style={{ fontSize: 12.5, color: "var(--ink-muted)", lineHeight: 1.45 }}>
              Receive 25% upfront points immediately upon approval. The rest transfers once redeemed and verified!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
