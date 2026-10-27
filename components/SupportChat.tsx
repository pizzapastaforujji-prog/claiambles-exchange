"use client";

import React, { useState, useRef, useEffect } from "react";
import { useExchange } from "@/lib/ExchangeContext";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Minus,
  Bot,
  User,
  HelpCircle,
  RotateCcw,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
}

const QUICK_PROMPTS = [
  "How does escrow work?",
  "What is the daily upload limit?",
  "How do points work?",
  "What if a coupon doesn't work?",
];

export default function SupportChat() {
  const { currentUser, sessionEmail } = useExchange();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "model",
      content:
        "Hi! 👋 I'm **PromoBot**, your PassThePromo assistant powered by **Gemini 3.6 Flash**. Ask me anything about uploading, redeeming, escrow points, or site rules!",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: "u-" + Date.now(),
      role: "user",
      content: text,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/support-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextHistory.map((m) => ({ role: m.role, content: m.content })),
          userContext: currentUser
            ? {
                email: sessionEmail,
                points: currentUser.points,
                credit_score: currentUser.credit_score,
              }
            : null,
        }),
      });

      const data = await res.json();
      const botReply = data.reply || "Sorry, I could not process that request. Please try again.";

      setMessages((prev) => [
        ...prev,
        {
          id: "m-" + Date.now(),
          role: "model",
          content: botReply,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "model",
          content: "I'm having trouble connecting right now. Please check your internet or try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome-reset",
        role: "model",
        content: "Chat cleared! How else can I assist you with PassThePromo?",
      },
    ]);
  };

  return (
    <aside
      aria-label="AI Support Chat"
      style={{
        position: "fixed",
        bottom: 22,
        right: 22,
        zIndex: 9999,
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Floating Action Bubble (Closed State) */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 16px 10px 12px",
            borderRadius: 9999,
            background: "linear-gradient(135deg, #1E5E3A 0%, #2A8251 100%)",
            color: "#ffffff",
            border: "2px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 8px 24px rgba(30, 94, 58, 0.35)",
            cursor: "pointer",
            transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
            e.currentTarget.style.boxShadow = "0 12px 28px rgba(30, 94, 58, 0.45)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(30, 94, 58, 0.35)";
          }}
          title="Open PassThePromo AI Assistant"
        >
          <div
            style={{
              position: "relative",
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles style={{ width: 17, height: 17, color: "#FDE68A" }} />
            <span
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: "#22c55e",
                border: "2px solid #1E5E3A",
              }}
            />
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.01em" }}>
              AI Support
            </div>
            <div style={{ fontSize: 10.5, opacity: 0.85, marginTop: -1 }}>
              Gemini 3.6 Online
            </div>
          </div>
        </button>
      )}

      {/* Expanded Chat Window (Open State) */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="PassThePromo Support Chat"
          style={{
            width: 380,
            maxWidth: "calc(100vw - 32px)",
            height: 520,
            maxHeight: "calc(100vh - 100px)",
            background: "#ffffff",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            boxShadow: "0 18px 45px rgba(24, 22, 19, 0.16)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "chatPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "linear-gradient(135deg, #1E5E3A 0%, #2A8251 100%)",
              color: "#ffffff",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: "rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bot style={{ width: 18, height: 18, color: "#FDE68A" }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                  PromoBot AI
                  <span
                    style={{
                      display: "inline-block",
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#4ade80",
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>
                  Customer Support • Gemini 3.6 Flash
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                type="button"
                onClick={clearChat}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ffffff",
                  opacity: 0.8,
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                }}
                title="Restart conversation"
              >
                <RotateCcw style={{ width: 14, height: 14 }} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ffffff",
                  opacity: 0.8,
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                }}
                title="Minimize chat"
              >
                <Minus style={{ width: 16, height: 16 }} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ffffff",
                  opacity: 0.8,
                  cursor: "pointer",
                  padding: 4,
                  display: "flex",
                }}
                title="Close chat"
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              background: "var(--canvas)",
            }}
          >
            {messages.map((m) => {
              const isBot = m.role === "model";
              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-start",
                    alignSelf: isBot ? "flex-start" : "flex-end",
                    maxWidth: "88%",
                  }}
                >
                  {isBot && (
                    <div
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: "var(--brand-light)",
                        color: "var(--brand)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      <Sparkles style={{ width: 13, height: 13 }} />
                    </div>
                  )}

                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: isBot
                        ? "4px 14px 14px 14px"
                        : "14px 4px 14px 14px",
                      background: isBot ? "#ffffff" : "var(--brand)",
                      color: isBot ? "var(--ink)" : "#ffffff",
                      fontSize: 13,
                      lineHeight: 1.45,
                      border: isBot ? "1px solid var(--border)" : "none",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "var(--brand-light)",
                    color: "var(--brand)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Sparkles style={{ width: 13, height: 13 }} />
                </div>
                <div
                  style={{
                    padding: "8px 14px",
                    borderRadius: "4px 14px 14px 14px",
                    background: "#ffffff",
                    border: "1px solid var(--border)",
                    fontSize: 12.5,
                    color: "var(--ink-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span>PromoBot is thinking</span>
                  <span className="dot-pulse" style={{ animation: "pulse 1.2s infinite" }}>...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips (Shown if only 1-2 messages) */}
          {messages.length <= 2 && (
            <div
              style={{
                padding: "8px 12px",
                background: "#ffffff",
                borderTop: "1px solid var(--border)",
                display: "flex",
                gap: 6,
                overflowX: "auto",
                whiteSpace: "nowrap",
              }}
            >
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSend(p)}
                  disabled={loading}
                  style={{
                    fontSize: 11.5,
                    padding: "4px 9px",
                    borderRadius: 9999,
                    border: "1px solid var(--border)",
                    background: "var(--canvas)",
                    color: "var(--ink-secondary)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  <HelpCircle style={{ width: 11, height: 11 }} />
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <div
            style={{
              padding: "10px 12px",
              background: "#ffffff",
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <input
              ref={inputRef}
              className="input"
              style={{
                flex: 1,
                fontSize: 13,
                padding: "8px 12px",
                borderRadius: "var(--radius-full)",
              }}
              placeholder="Ask PromoBot a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />

            <button
              type="button"
              className="btn primary"
              style={{
                width: 36,
                height: 36,
                padding: 0,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
              onClick={() => handleSend()}
              disabled={!input.trim() || loading}
              title="Send message"
            >
              <Send style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
