"use client";

import React from "react";
import { useExchange } from "@/lib/ExchangeContext";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export default function Toast() {
  const { toast, flash } = useExchange();

  if (!toast || !toast.trim()) return null;

  const isAlert =
    toast.toLowerCase().includes("reject") ||
    toast.toLowerCase().includes("error") ||
    toast.toLowerCase().includes("failed") ||
    toast.toLowerCase().includes("flagged") ||
    toast.toLowerCase().includes("dispute") ||
    toast.toLowerCase().includes("invalid") ||
    toast.toLowerCase().includes("incorrect");

  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#181613",
        color: "#FFFFFF",
        padding: "10px 18px",
        borderRadius: "var(--radius-full, 9999px)",
        fontSize: 13.5,
        fontWeight: 500,
        boxShadow: "0 10px 28px -4px rgba(24, 22, 19, 0.35), 0 2px 8px rgba(24, 22, 19, 0.15)",
        zIndex: 200,
        maxWidth: "min(92vw, 460px)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        border: isAlert ? "1px solid #E5484D" : "1px solid #2B8A3E",
        animation: "toastSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {isAlert ? (
        <AlertTriangle style={{ width: 16, height: 16, color: "#FF8787", flexShrink: 0 }} />
      ) : (
        <CheckCircle2 style={{ width: 16, height: 16, color: "#69DB7C", flexShrink: 0 }} />
      )}
      <span style={{ lineHeight: 1.35, color: "#FFFFFF", flex: 1 }}>{toast}</span>

      <style jsx>{`
        @keyframes toastSlideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 14px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
