"use client";

import React, { useState, useRef } from "react";
import { useExchange } from "@/lib/ExchangeContext";
import {
  CATEGORIES,
  CURRENCIES,
  REDEMPTION_METHODS,
  hardValidate,
  resizeImageToBase64,
  todayISO,
  addDays,
} from "@/lib/claimRules";
import { ClaimAIVerdict, ClaimableType } from "@/lib/types";
import {
  FileText,
  Camera,
  Sparkles,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  X,
  ShieldAlert,
  Coins,
  ArrowRight,
  Lock,
} from "lucide-react";

export default function UploadPage() {
  const { state, currentUser, sessionEmail, addClaimable, flash } = useExchange();

  const [type, setType] = useState<ClaimableType>("code");
  const [brand, setBrand] = useState("");
  const [offerTitle, setOfferTitle] = useState("");
  const [code, setCode] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageMediaType, setImageMediaType] = useState<string | null>(null);
  const [imageNote, setImageNote] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [redemptionMethod, setRedemptionMethod] = useState(REDEMPTION_METHODS[0]);
  const [currency, setCurrency] = useState(currentUser?.preferred_currency || "USD");
  const [value, setValue] = useState("");
  const [expiry, setExpiry] = useState(addDays(todayISO(), 14));

  const [checking, setChecking] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [result, setResult] = useState<ClaimAIVerdict | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const removePhoto = () => {
    setImageDataUrl(null);
    setImageMediaType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setImageBusy(true);
    try {
      const { data, mediaType } = await resizeImageToBase64(file);
      setImageDataUrl(data);
      setImageMediaType(mediaType);
      flash("Photo attached and ready for Gemini Vision scan.");
    } catch (err: any) {
      flash(err.message || "Failed to process photo.");
    } finally {
      setImageBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      flash("Please sign in before uploading.");
      return;
    }
    if (checking || imageBusy) return;

    const candidate = {
      type,
      brand: brand.trim(),
      offerTitle: offerTitle.trim(),
      code: type === "code" ? code.trim() : "",
      imageDataUrl: type === "photo" ? imageDataUrl : null,
      imageMediaType: type === "photo" ? imageMediaType : null,
      imageNote: imageNote.trim(),
      category,
      redemptionMethod,
      currency,
      value: Number(value),
      expiry,
    };

    // 1. Instant deterministic hard validation
    const hardCheck = hardValidate(candidate, state.claimables);
    if (hardCheck.fail) {
      setResult({
        valid: false,
        reason: hardCheck.reason || "Validation failed.",
        source: "rules",
      });
      flash(hardCheck.reason || "Check your submission details.");
      return;
    }

    setChecking(true);
    setResult(null);

    try {
      // 2. Call Google Gemini Claim AI API
      const res = await fetch("/api/claim-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...candidate,
          creditScore: currentUser.credit_score,
        }),
      });

      const verdict: ClaimAIVerdict = await res.json();
      setResult(verdict);

      // 3. Update store and credit points
      await addClaimable(candidate, verdict);

      if (verdict.valid) {
        // Reset form
        setBrand("");
        setOfferTitle("");
        setCode("");
        setImageDataUrl(null);
        setImageMediaType(null);
        setImageNote("");
        setValue("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      flash("Claim AI check encountered a network error.");
    } finally {
      setChecking(false);
    }
  };

  if (!currentUser) {
    return (
      <div style={{ maxWidth: 460, margin: "50px auto 0", textAlign: "center" }}>
        <div className="card" style={{ padding: "32px 24px" }}>
          <div className="pill brand" style={{ marginBottom: 12 }}>
            <Lock style={{ width: 12, height: 12 }} />
            Authentication Required
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Sign in to Upload Claimables
          </h2>
          <p style={{ color: "var(--ink-muted)", fontSize: 13.5, lineHeight: 1.5, marginBottom: 20 }}>
            Create an account or sign in to submit vouchers, earn upfront points, and start trading with peers.
          </p>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              const navBtn = document.querySelector("header button.btn.primary") as HTMLButtonElement;
              if (navBtn) navBtn.click();
              else flash("Click 'Sign up' in the top right corner to get started.");
            }}
          >
            Log In / Sign Up
            <ArrowRight style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 540, margin: "30px auto 0" }}>
      <div style={{ marginBottom: 20, textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
          Upload a Claimable
        </h2>
        <p style={{ color: "var(--ink-muted)", fontSize: 13.5, maxWidth: 440, margin: "0 auto" }}>
          Audited by <strong>Google Gemini Claim AI</strong> for authenticity, OCR code scanning, and instant upfront points.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: "24px 22px" }}>
        {/* Type Toggle */}
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
            className={`btn ${type === "code" ? "primary" : "secondary"}`}
            style={{
              flex: 1,
              padding: "7px 12px",
              border: "none",
              boxShadow: type === "code" ? "var(--shadow-xs)" : "none",
              background: type === "code" ? "var(--brand)" : "transparent",
            }}
            onClick={() => setType("code")}
          >
            <FileText style={{ width: 14, height: 14 }} />
            Text Code
          </button>
          <button
            type="button"
            className={`btn ${type === "photo" ? "primary" : "secondary"}`}
            style={{
              flex: 1,
              padding: "7px 12px",
              border: "none",
              boxShadow: type === "photo" ? "var(--shadow-xs)" : "none",
              background: type === "photo" ? "var(--brand)" : "transparent",
            }}
            onClick={() => setType("photo")}
          >
            <Camera style={{ width: 14, height: 14 }} />
            Voucher Photo
          </button>
        </div>

        {/* Brand & Offer Title */}
        <div style={{ marginBottom: 12 }}>
          <label className="label">Brand / Company</label>
          <input
            className="input"
            required
            placeholder="e.g. Starbucks, Target, Nike, Uber Eats"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label className="label">Offer Title / Discount</label>
          <input
            className="input"
            required
            placeholder="e.g. 20% off any order, $15 off $50 minimum spend"
            value={offerTitle}
            onChange={(e) => setOfferTitle(e.target.value)}
          />
        </div>

        {/* Text Code or Photo Upload */}
        {type === "code" ? (
          <div style={{ marginBottom: 14 }}>
            <label className="label">Coupon / Voucher Code</label>
            <input
              className="input"
              required
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}
              placeholder="e.g. SAVE20OFF or VOUCHER-9876"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>
        ) : (
          <div style={{ marginBottom: 14 }}>
            <label className="label">Photo of Voucher / Gift Card Receipt</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              required={!imageDataUrl}
              onChange={onFileChange}
              style={{ marginBottom: 8, fontSize: 13, display: "block" }}
            />

            {imageBusy && (
              <div style={{ fontSize: 12, color: "var(--ink-subtle)", marginBottom: 8 }}>
                Compressing image for Gemini Vision...
              </div>
            )}

            {imageDataUrl && (
              <div style={{ position: "relative", display: "inline-block", marginBottom: 10 }}>
                <img
                  src={`data:${imageMediaType || "image/jpeg"};base64,${imageDataUrl}`}
                  alt="Uploaded preview"
                  style={{
                    maxWidth: 160,
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)",
                    display: "block",
                  }}
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  aria-label="Remove photo"
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "var(--alert)",
                    color: "#ffffff",
                    border: "2px solid #ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X style={{ width: 12, height: 12 }} />
                </button>
              </div>
            )}

            <label className="label" style={{ marginTop: 6 }}>
              Notes for Claim AI Vision (Optional)
            </label>
            <input
              className="input"
              placeholder="e.g. Barcode is on the reverse side"
              value={imageNote}
              onChange={(e) => setImageNote(e.target.value)}
            />
          </div>
        )}

        {/* Category & Redemption Method */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Channel</label>
            <select
              className="input"
              value={redemptionMethod}
              onChange={(e) => setRedemptionMethod(e.target.value as any)}
            >
              {REDEMPTION_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Currency, Value, Expiry */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1.5fr", gap: 10, marginBottom: 18 }}>
          <div>
            <label className="label">Currency</label>
            <select
              className="input"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Face Value</label>
            <input
              className="input"
              type="number"
              min="1"
              step="0.01"
              required
              placeholder="15.00"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Expiry Date</label>
            <input
              className="input"
              type="date"
              required
              min={todayISO()}
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn primary"
          style={{ width: "100%", padding: "11px 18px", fontSize: 14.5 }}
          disabled={checking || imageBusy}
        >
          {checking ? (
            <>
              <Sparkles style={{ width: 16, height: 16 }} />
              Auditing with Gemini Claim AI...
            </>
          ) : (
            <>
              <UploadCloud style={{ width: 16, height: 16 }} />
              Submit to Claim AI
            </>
          )}
        </button>
      </form>

      {/* AI Review Result Card */}
      {result && (
        <div
          className="card"
          style={{
            marginTop: 16,
            padding: 18,
            borderColor: result.valid ? "rgba(30,94,58,0.3)" : "rgba(194,65,45,0.3)",
            background: result.valid ? "var(--brand-light)" : "var(--alert-light)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            {result.valid ? (
              <CheckCircle2 style={{ width: 18, height: 18, color: "var(--brand)" }} />
            ) : (
              <ShieldAlert style={{ width: 18, height: 18, color: "var(--alert)" }} />
            )}
            <h4
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 16,
                fontWeight: 700,
                color: result.valid ? "var(--brand)" : "var(--alert)",
              }}
            >
              {result.valid ? "APPROVED & VERIFIED" : "VERIFICATION FAILED"}
            </h4>
          </div>

          <p style={{ fontSize: 13, lineHeight: 1.45, color: "var(--ink)" }}>
            {result.reason}
          </p>

          {result.detectedCode && (
            <div style={{ marginTop: 8, fontSize: 12.5, color: "var(--ink-secondary)" }}>
              OCR Identifier Scanned:{" "}
              <strong style={{ fontFamily: "var(--font-mono)" }}>{result.detectedCode}</strong>
            </div>
          )}

          {result.valid && (
            <div
              style={{
                marginTop: 10,
                padding: "8px 12px",
                background: "#ffffff",
                borderRadius: "var(--radius-sm)",
                border: "1px dashed var(--border)",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Coins style={{ width: 14, height: 14, color: "var(--gold)" }} />
              <span>
                <strong>25% upfront points</strong> credited to your wallet now. The remaining{" "}
                <strong>75%</strong> will transfer once confirmed by a redeemer!
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
