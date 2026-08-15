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
      flash("Please log in before uploading.");
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

  return (
    <div style={{ maxWidth: 620, margin: "40px auto 0" }}>
      <div style={{ marginBottom: 24, textAlign: "center" }}>
        <h2 style={{ fontFamily: "var(--display)", fontSize: 40, marginBottom: 4 }}>
          UPLOAD A CLAIMABLE
        </h2>
        <p style={{ color: "var(--ink-muted)", fontSize: 14, maxWidth: 520, margin: "0 auto" }}>
          Deterministic checks run instantly in milliseconds, followed by Google Gemini <strong>Claim AI</strong> review.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="ticket" style={{ padding: 28 }}>
        {/* Type Toggle */}
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <button
            type="button"
            className={`btn ${type === "code" ? "stamp" : "secondary"}`}
            style={{ flex: 1, padding: "12px 14px" }}
            onClick={() => setType("code")}
          >
            <FileText style={{ width: 16, height: 16 }} />
            Text Code
          </button>
          <button
            type="button"
            className={`btn ${type === "photo" ? "stamp" : "secondary"}`}
            style={{ flex: 1, padding: "12px 14px" }}
            onClick={() => setType("photo")}
          >
            <Camera style={{ width: 16, height: 16 }} />
            Voucher Photo
          </button>
        </div>

        {/* Brand & Offer Title */}
        <div style={{ marginBottom: 16 }}>
          <label className="label">Brand / Company</label>
          <input
            className="input"
            required
            placeholder="e.g. Starbucks, Target, Nike, DoorDash"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
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
          <div style={{ marginBottom: 16 }}>
            <label className="label">Coupon / Voucher Code</label>
            <input
              className="input"
              required
              style={{ fontFamily: "var(--mono)", letterSpacing: "0.05em" }}
              placeholder="e.g. COFFEE20OFF or VOUCHER-9876"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </div>
        ) : (
          <div style={{ marginBottom: 18 }}>
            <label className="label">Photo of Voucher / Gift Card Receipt</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              required={!imageDataUrl}
              onChange={onFileChange}
              style={{ marginBottom: 10, fontSize: 13, display: "block" }}
            />

            {imageBusy && (
              <div style={{ fontSize: 12, color: "var(--ink-subtle)", marginBottom: 10 }}>
                Compressing image for Gemini Vision...
              </div>
            )}

            {imageDataUrl && (
              <div style={{ position: "relative", display: "inline-block", marginBottom: 12 }}>
                <img
                  src={`data:${imageMediaType || "image/jpeg"};base64,${imageDataUrl}`}
                  alt="Uploaded preview"
                  style={{
                    maxWidth: 180,
                    borderRadius: 4,
                    border: "1px solid var(--line)",
                    display: "block",
                  }}
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  aria-label="Remove photo"
                  style={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "var(--alert)",
                    color: "#ffffff",
                    border: "2px solid var(--paper)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
            )}

            <label className="label" style={{ marginTop: 6 }}>
              Notes for Claim AI Vision (Optional)
            </label>
            <input
              className="input"
              placeholder="e.g. Pin code is located on the lower right corner under the scratch layer"
              value={imageNote}
              onChange={(e) => setImageNote(e.target.value)}
            />
          </div>
        )}

        {/* Category & Redemption Method */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
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
            <label className="label">Redemption Channel</label>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1.6fr", gap: 12, marginBottom: 24 }}>
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
            <label className="label">Expiration Date</label>
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
          className="btn stamp"
          style={{ width: "100%", padding: "14px 20px", fontSize: 16 }}
          disabled={checking || imageBusy}
        >
          {checking ? (
            <>
              <Sparkles style={{ width: 18, height: 18 }} />
              Auditing with Gemini Claim AI...
            </>
          ) : (
            <>
              <UploadCloud style={{ width: 18, height: 18 }} />
              Submit to Claim AI
            </>
          )}
        </button>
      </form>

      {/* AI Review Result Card */}
      {result && (
        <div
          className="ticket"
          style={{
            marginTop: 20,
            padding: 22,
            borderWidth: 2,
            borderColor: result.valid ? "var(--stamp)" : "var(--alert)",
            background: result.valid ? "var(--stamp-light)" : "var(--alert-light)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            {result.valid ? (
              <CheckCircle2 style={{ width: 22, height: 22, color: "var(--stamp)" }} />
            ) : (
              <ShieldAlert style={{ width: 22, height: 22, color: "var(--alert)" }} />
            )}
            <h4
              style={{
                fontFamily: "var(--display)",
                fontSize: 24,
                color: result.valid ? "var(--stamp)" : "var(--alert)",
              }}
            >
              {result.valid ? "APPROVED & VERIFIED" : "VERIFICATION FAILED"}
            </h4>
          </div>

          <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--ink)" }}>
            {result.reason}
          </p>

          {result.detectedCode && (
            <div style={{ marginTop: 10, fontSize: 13, color: "var(--ink-secondary)" }}>
              OCR Identifier Scanned:{" "}
              <strong style={{ fontFamily: "var(--mono)" }}>{result.detectedCode}</strong>
            </div>
          )}

          {result.valid && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 14px",
                background: "#ffffff",
                borderRadius: 4,
                border: "1px dashed var(--line)",
                fontSize: 13,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Coins style={{ width: 16, height: 16, color: "var(--gold)" }} />
              <span>
                <strong>25% upfront points</strong> added to your wallet now. The remaining{" "}
                <strong>75% points</strong> will transfer once a recipient redeems and confirms it!
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
