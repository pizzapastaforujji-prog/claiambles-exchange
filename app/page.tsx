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
  Clock,
  CheckCircle,
  FileText,
  Camera,
  Coins,
  Ticket,
} from "lucide-react";

export default function HomePage() {
  const { state } = useExchange();
  const liveCount = state.claimables.filter((c) => c.status === "valid").length;

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          padding: "64px 0 44px",
          display: "flex",
          gap: 40,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ flex: "1 1 440px" }}>
          <div className="label" style={{ color: "var(--stamp)", display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles style={{ width: 14, height: 14 }} />
            Nothing goes to waste
          </div>
          <h1
            style={{
              fontFamily: "var(--display)",
              fontSize: 58,
              lineHeight: 0.98,
              margin: "12px 0 20px",
              letterSpacing: "0.01em",
            }}
          >
            YOUR UNUSED COUPON IS<br />SOMEONE ELSE&apos;S WIN.
          </h1>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: "var(--ink-secondary)",
              maxWidth: 500,
              marginBottom: 30,
            }}
          >
            Upload the gift cards, promo codes, and vouchers you&apos;ll never use.
            Google Gemini <strong>Claim AI</strong> audits them, credits you upfront points, and puts
            them in front of peers who need them before they expire.
          </p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <Link href="/upload" className="btn stamp large">
              Upload a claimable
              <ArrowRight style={{ width: 18, height: 18 }} />
            </Link>
            <Link href="/browse" className="btn secondary large">
              Browse claimables
            </Link>
          </div>
        </div>

        {/* Live Stat Ticket */}
        <div
          className="ticket perf"
          style={{
            flex: "0 0 280px",
            padding: "30px 24px",
            background: "#ffffff",
          }}
        >
          <div className="label" style={{ color: "var(--ink-subtle)" }}>
            Live on the exchange
          </div>
          <div
            style={{
              fontFamily: "var(--display)",
              fontSize: 56,
              color: "var(--stamp)",
              lineHeight: 1,
              margin: "4px 0 6px",
            }}
          >
            {liveCount}
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-muted)", marginBottom: 22 }}>
            verified claimables ready to redeem
          </div>

          <div className="dashed-divider" />

          <div className="label" style={{ color: "var(--gold)", marginTop: 14 }}>
            How points work
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-secondary)", lineHeight: 1.5 }}>
            <strong>25% upfront</strong> arrives immediately once Claim AI verifies your submission.
            The remaining <strong>75%</strong> releases once a peer redeems and confirms it worked.
          </div>
        </div>
      </section>

      {/* Built on Trust Grid */}
      <section style={{ marginTop: 24, marginBottom: 54 }}>
        <div className="label" style={{ color: "var(--stamp)", marginBottom: 6 }}>
          Why this works
        </div>
        <h2 style={{ fontFamily: "var(--display)", fontSize: 36, marginBottom: 20 }}>
          BUILT ON TRUST
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 16,
          }}
        >
          <div className="ticket" style={{ padding: "20px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <ShieldCheck style={{ width: 20, height: 20, color: "var(--stamp)" }} />
              <h3 style={{ fontFamily: "var(--display)", fontSize: 20 }}>REAL ACCOUNTS</h3>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.5 }}>
              Every user carries a credit score (0–100) that evolves with their honesty. Reliable uploaders earn higher point multiples per coupon.
            </p>
          </div>

          <div className="ticket" style={{ padding: "20px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Coins style={{ width: 20, height: 20, color: "var(--gold)" }} />
              <h3 style={{ fontFamily: "var(--display)", fontSize: 20 }}>TWO-PHASE PAYOUT</h3>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.5 }}>
              Uploading pays upfront points immediately. Escrow holds the remainder until the recipient verifies the code or 3 days pass.
            </p>
          </div>

          <div className="ticket" style={{ padding: "20px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Lock style={{ width: 20, height: 20, color: "var(--alert)" }} />
              <h3 style={{ fontFamily: "var(--display)", fontSize: 20 }}>DISPUTE PROTECTION</h3>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.5 }}>
              If a redeemed code was invalid or already used, reporting it grants an immediate refund and penalizes the bad uploader.
            </p>
          </div>

          <div className="ticket" style={{ padding: "20px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Zap style={{ width: 20, height: 20, color: "var(--stamp)" }} />
              <h3 style={{ fontFamily: "var(--display)", fontSize: 20 }}>CLAIM AI AUDITING</h3>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.5 }}>
              Multimodal Gemini AI reads voucher photos, extracts barcodes/text with OCR, and enforces expiration and uniqueness rules.
            </p>
          </div>
        </div>
      </section>

      {/* How to Upload Step-by-Step */}
      <section style={{ marginBottom: 40 }}>
        <div className="label" style={{ color: "var(--gold)", marginBottom: 6 }}>
          Getting started
        </div>
        <h2 style={{ fontFamily: "var(--display)", fontSize: 36, marginBottom: 20 }}>
          HOW TO UPLOAD A CLAIMABLE
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <div className="ticket" style={{ padding: "20px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <FileText style={{ width: 18, height: 18, color: "var(--ink-subtle)" }} />
              <h4 style={{ fontFamily: "var(--display)", fontSize: 19 }}>1. CHOOSE A TYPE</h4>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.5 }}>
              Select <strong>Text code</strong> for digital promo codes or <strong>Photo</strong> for physical vouchers & gift card receipts.
            </p>
          </div>

          <div className="ticket" style={{ padding: "20px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Ticket style={{ width: 18, height: 18, color: "var(--ink-subtle)" }} />
              <h4 style={{ fontFamily: "var(--display)", fontSize: 19 }}>2. FILL IN DETAILS</h4>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.5 }}>
              Enter brand, offer discount, category, redemption channel (Online/In-store), currency, face value, and expiration date.
            </p>
          </div>

          <div className="ticket" style={{ padding: "20px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Camera style={{ width: 18, height: 18, color: "var(--ink-subtle)" }} />
              <h4 style={{ fontFamily: "var(--display)", fontSize: 19 }}>3. ATTACH PHOTO</h4>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.5 }}>
              For photos, Claim AI automatically scans and OCRs the voucher identifier, keeping the image blurred until availed.
            </p>
          </div>

          <div className="ticket" style={{ padding: "20px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <CheckCircle style={{ width: 18, height: 18, color: "var(--stamp)" }} />
              <h4 style={{ fontFamily: "var(--display)", fontSize: 19 }}>4. INSTANT AI AUDIT</h4>
            </div>
            <p style={{ fontSize: 13, color: "var(--ink-muted)", lineHeight: 1.5 }}>
              Deterministic checks run in milliseconds, followed by Gemini AI plausibility review. You get upfront points instantly!
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
