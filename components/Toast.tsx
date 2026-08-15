"use client";

import React from "react";
import { useExchange } from "@/lib/ExchangeContext";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export default function Toast() {
  const { toast } = useExchange();

  if (!toast) return null;

  const isAlert = toast.toLowerCase().includes("reject") ||
                  toast.toLowerCase().includes("error") ||
                  toast.toLowerCase().includes("failed") ||
                  toast.toLowerCase().includes("flagged") ||
                  toast.toLowerCase().includes("dispute") ||
                  toast.toLowerCase().includes("invalid");

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        background: "var(--ink)",
        color: "var(--paper)",
        padding: "12px 20px",
        borderRadius: 4,
        fontSize: 14,
        boxShadow: "0 8px 24px rgba(34,31,27,0.25)",
        zIndex: 150,
        maxWidth: "min(92vw, 480px)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        border: `1px solid ${isAlert ? "var(--alert)" : "var(--stamp)"}`,
        animation: "slideUp 0.2s ease-out",
      }}
    >
      {isAlert ? (
        <AlertTriangle style={{ width: 18, height: 18, color: "var(--alert)", flexShrink: 0 }} />
      ) : (
        <CheckCircle2 style={{ width: 18, height: 18, color: "var(--stamp)", flexShrink: 0 }} />
      )}
      <span style={{ lineHeight: 1.4 }}>{toast}</span>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 12px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </div>
  );
}
