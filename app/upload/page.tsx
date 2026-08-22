"use client";

import React, { useState, useRef } from "react";
import { useExchange } from "@/lib/ExchangeContext";
import {
  CATEGORIES,
  CURRENCIES,
  REDEMPTION_METHODS,
  MAX_DAILY_UPLOADS,
  hardValidate,
  resizeImageToBase64,
  todayISO,
  addDays,
} from "@/lib/claimRules";
import { ClaimAIVerdict, ClaimableType, DiscountType } from "@/lib/types";
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
  Percent,
  DollarSign,
  Gift,
  Scan,
} from "lucide-react";

export default function UploadPage() {
  const { state, currentUser, sessionEmail, addClaimable, flash } = useExchange();

  const [type, setType] = useState<ClaimableType>("code");
  const [discountType, setDiscountType] = useState<DiscountType>("amount");
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
  const [percentOff, setPercentOff] = useState("");
  const [expiry, setExpiry] = useState(addDays(todayISO(), 14));

  const [checking, setChecking] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [result, setResult] = useState<ClaimAIVerdict | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const today = todayISO();
  const todayUploadCount = sessionEmail
    ? state.claimables.filter((c) => c.uploader === sessionEmail && c.uploaded_at === today).length
    : 0;

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
      flash("Photo attached. Click 'AI Auto-Extract' to auto-fill details!");
    } catch (err: any) {
      flash(err.message || "Failed to process photo.");
    } finally {
      setImageBusy(false);
    }
  };

  // Quick auto-extract feature with Gemini Vision
  const handleAutoExtractFromPhoto = async () => {
    if (!imageDataUrl) {
      flash("Please attach a photo first.");
      return;
    }
    setScanning(true);
    try {
      const res = await fetch("/api/claim-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "photo",
          imageDataUrl,
          imageMediaType,
          currentDate: todayISO(),
        }),
      });

      const verdict: ClaimAIVerdict = await res.json();
      if (verdict.detectedBrand) setBrand(verdict.detectedBrand);
      if (verdict.detectedOffer) setOfferTitle(verdict.detectedOffer);
      if (verdict.detectedExpiry) setExpiry(verdict.detectedExpiry);
      if (verdict.detectedCode) setCode(verdict.detectedCode);
      if (verdict.detectedDiscountType) {
        setDiscountType(verdict.detectedDiscountType);
        if (verdict.detectedDiscountType === "amount" && verdict.detectedValue) {
          setValue(String(verdict.detectedValue));
        } else if (verdict.detectedDiscountType === "percent" && verdict.detectedValue) {
          setPercentOff(String(verdict.detectedValue));
        }
      }
      flash("Details auto-extracted from photo by Gemini Vision!");
    } catch (e) {
      flash("Auto-extract failed. You can still fill in details manually.");
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      flash("Please sign in before uploading.");
      return;
    }
    if (checking || imageBusy) return;

    if (todayUploadCount >= MAX_DAILY_UPLOADS) {
      flash(`Daily upload limit reached (${MAX_DAILY_UPLOADS}/day). Please try again tomorrow.`);
      return;
    }

    const candidate = {
      type,
      discountType,
      brand: brand.trim(),
      offerTitle: offerTitle.trim(),
      code: type === "code" ? code.trim() : "",
      imageDataUrl: type === "photo" ? imageDataUrl : null,
      imageMediaType: type === "photo" ? imageMediaType : null,
      imageNote: imageNote.trim(),
      category,
      redemptionMethod,
      currency,
      value: discountType === "amount" ? Number(value) : discountType === "percent" ? Number(percentOff) : 0,
      percentOff: discountType === "percent" ? Number(percentOff) : undefined,
      expiry,
    };

    // 1. Instant deterministic validation
    const hardCheck = hardValidate({ ...candidate, uploader: sessionEmail }, state.claimables);
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
          currentDate: todayISO(),
        }),
      });

      const verdict: ClaimAIVerdict = await res.json();
      setResult(verdict);

      // 3. Update store and credit points
      const addRes = await addClaimable(candidate, verdict);

      if (addRes.success && verdict.valid) {
        setBrand("");
        setOfferTitle("");
        setCode("");
        setImageDataUrl(null);
        setImageMediaType(null);
        setImageNote("");
        setValue("");
        setPercentOff("");
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
            Sign in to PassThePromo
          </h2>
          <p style={{ color: "var(--ink-muted)", fontSize: 13.5, lineHeight: 1.5, marginBottom: 20 }}>
            Create an account or sign in to upload coupons, earn upfront points, and start trading with peers.
          </p>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              const navBtn = document.querySelector("header button.btn.primary") as HTMLButtonElement;
              if (navBtn) navBtn.click();
              else flash("Click 'Sign up' in the top navigation to get started.");
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
    <div style={{ maxWidth: 560, margin: "30px auto 0" }}>
      <div style={{ marginBottom: 20, textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
          Pass a Promo
        </h2>
        <p style={{ color: "var(--ink-muted)", fontSize: 13.5, maxWidth: 460, margin: "0 auto 8px" }}>
          Audited by <strong>Google Gemini Vision AI</strong> for authenticity, OCR code scanning, and instant upfront points.
        </p>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-subtle)" }}>
          <span>Daily uploads:</span>
          <strong style={{ color: todayUploadCount >= MAX_DAILY_UPLOADS ? "var(--alert)" : "var(--brand)" }}>
            {todayUploadCount} / {MAX_DAILY_UPLOADS} used today
          </strong>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: "24px 22px" }}>
        {/* Upload Mode Toggle */}
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

        {/* Photo Upload Section */}
        {type === "photo" && (
          <div
            style={{
              marginBottom: 16,
              padding: "16px",
              background: "var(--canvas)",
              borderRadius: "var(--radius-md)",
              border: "1px dashed var(--border)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label className="label" style={{ marginBottom: 0 }}>
                Attach Voucher Photo / Receipt
              </label>
              {imageDataUrl && (
                <button
                  type="button"
                  className="btn secondary small"
                  onClick={handleAutoExtractFromPhoto}
                  disabled={scanning}
                  style={{ fontSize: 11.5, padding: "3px 8px" }}
                >
                  <Scan style={{ width: 12, height: 12 }} />
                  {scanning ? "Scanning Photo..." : "AI Auto-Extract"}
                </button>
              )}
            </div>

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
                Processing image for Gemini Vision...
              </div>
            )}

            {imageDataUrl && (
              <div style={{ position: "relative", display: "inline-block", marginTop: 4, marginBottom: 8 }}>
                <img
                  src={`data:${imageMediaType || "image/jpeg"};base64,${imageDataUrl}`}
                  alt="Uploaded preview"
                  style={{
                    maxWidth: 180,
                    maxHeight: 140,
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

            <input
              className="input"
              placeholder="Notes for AI Vision (e.g. Barcode on reverse side)"
              value={imageNote}
              onChange={(e) => setImageNote(e.target.value)}
              style={{ fontSize: 12.5 }}
            />
          </div>
        )}

        {/* Brand & Offer Title */}
        <div style={{ marginBottom: 12 }}>
          <label className="label">Brand / Store Name</label>
          <input
            className="input"
            required
            placeholder="e.g. Starbucks, Nike, Subway, Target"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label className="label">Offer Description</label>
          <input
            className="input"
            required
            placeholder="e.g. $15 off $50 spend, 20% off all shoes, Free large beverage"
            value={offerTitle}
            onChange={(e) => setOfferTitle(e.target.value)}
          />
        </div>

        {/* Text Code (if type == code) */}
        {type === "code" && (
          <div style={{ marginBottom: 14 }}>
            <label className="label">Coupon / Promo Code</label>
            <input
              className="input"
              required
              style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}
              placeholder="e.g. SAVE20OFF or VOUCHER-9876"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>
        )}

        {/* Discount Type Selector */}
        <div style={{ marginBottom: 14 }}>
          <label className="label">Discount Format</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: 6 }}>
            <button
              type="button"
              className={`btn ${discountType === "amount" ? "primary" : "secondary"} small`}
              onClick={() => setDiscountType("amount")}
            >
              <DollarSign style={{ width: 13, height: 13 }} />
              Cash / $ Value
            </button>
            <button
              type="button"
              className={`btn ${discountType === "percent" ? "primary" : "secondary"} small`}
              onClick={() => setDiscountType("percent")}
            >
              <Percent style={{ width: 13, height: 13 }} />
              Percentage %
            </button>
            <button
              type="button"
              className={`btn ${discountType === "perk" ? "primary" : "secondary"} small`}
              onClick={() => setDiscountType("perk")}
            >
              <Gift style={{ width: 13, height: 13 }} />
              Free Perk / Service
            </button>
          </div>
        </div>

        {/* Dynamic Value Inputs */}
        {discountType === "amount" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginBottom: 14 }}>
            <div>
              <label className="label">Currency</label>
              <select
                className="input"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Face Value ($ Amount)</label>
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
          </div>
        )}

        {discountType === "percent" && (
          <div style={{ marginBottom: 14 }}>
            <label className="label">Discount Percentage (% Off)</label>
            <input
              className="input"
              type="number"
              min="1"
              max="100"
              required
              placeholder="e.g. 20 (for 20% off)"
              value={percentOff}
              onChange={(e) => setPercentOff(e.target.value)}
            />
          </div>
        )}

        {discountType === "perk" && (
          <div
            style={{
              padding: "9px 12px",
              background: "var(--gold-light)",
              border: "1px solid rgba(192, 125, 22, 0.2)",
              borderRadius: "var(--radius-sm)",
              fontSize: 12.5,
              color: "var(--gold)",
              marginBottom: 14,
            }}
          >
            <strong>Free Perk / Service Voucher:</strong> Points reward is calculated as a baseline starter reward (4 pts) without requiring a cash price.
          </div>
        )}

        {/* Category, Method, Expiry */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.3fr", gap: 10, marginBottom: 18 }}>
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
          disabled={checking || imageBusy || todayUploadCount >= MAX_DAILY_UPLOADS}
        >
          {checking ? (
            <>
              <Sparkles style={{ width: 16, height: 16 }} />
              Auditing with Gemini Vision AI...
            </>
          ) : todayUploadCount >= MAX_DAILY_UPLOADS ? (
            "Daily Upload Limit Reached (10/day)"
          ) : (
            <>
              <UploadCloud style={{ width: 16, height: 16 }} />
              Submit to Gemini Vision AI
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
              {result.valid ? "APPROVED & LIVE" : "VERIFICATION REJECTED"}
            </h4>
          </div>

          <p style={{ fontSize: 13, lineHeight: 1.45, color: "var(--ink)" }}>
            {result.reason}
          </p>

          {result.detectedCode && (
            <div style={{ marginTop: 8, fontSize: 12.5, color: "var(--ink-secondary)" }}>
              OCR Identifier: <strong style={{ fontFamily: "var(--font-mono)" }}>{result.detectedCode}</strong>
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
                <strong>75%</strong> will transfer once confirmed by a recipient!
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
