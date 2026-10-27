import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";

const SYSTEM_PROMPT = `You are PromoBot, the official and friendly AI Customer Support Assistant for "PassThePromo" (https://passthepromo.vercel.app).

Your goal is to assist users with any questions about PassThePromo, explain how the platform works, troubleshoot issues, and provide helpful guidance.

CORE WEBSITE KNOWLEDGE:
1. WHAT IS PASSTHEPROMO:
   - A zero-waste, peer-to-peer exchange for unused discount codes, gift cards, coupons, and vouchers before they expire.
   - Users earn reward points by passing unused coupons, and spend points to claim coupons passed by others.

2. TWO-PHASE ESCROW & POINTS REWARD:
   - When a user uploads a valid coupon, they immediately get 25% UPFRONT POINTS in their wallet.
   - The remaining 75% ESCROW POINTS are safely locked until the recipient redeems and confirms the code works, or until the 3-day confirmation window automatically confirms it.
   - Points cost to redeem: Calculated based on discount value and uploader trust tier (typically 4 to 30 points).

3. DAILY LIMITS:
   - Upload Limit: Maximum 10 coupons per user per day.
   - Redemption Limit: Maximum 1 voucher claim per user per day (ensures fair access for everyone).

4. TRUST & CREDIT SCORE:
   - Every user starts with a Trust Score of 50 (scale: 0 to 100).
   - Trust score increases (+5) for verified uploads and confirming redemptions.
   - Dishonest uploader penalty: If a buyer disputes a bad/fake code, the uploader loses 20 trust points, and their upfront points are clawed back.

5. DISPUTES & REFUNDS:
   - If a buyer claims a coupon and it doesn't work (expired, invalid code, already used), they can click "Report / Dispute" on their Dashboard.
   - 100% of their points are instantly refunded.

6. THREE DISCOUNT FORMATS:
   - Cash / $ Value: Fixed monetary discount or gift card balance (e.g. $15, €20, ₹500).
   - Percentage %: Percentage off (e.g. 20% off, 50% off).
   - Free Perk / Service: Free items, buy-one-get-one, free trial with no dollar amount (yields 4 starter points).

7. AI VERIFICATION (GEMINI VISION AI):
   - Photos uploaded are audited by Google Gemini Vision AI for authenticity, expiration date verification, brand cross-checking, and OCR code scanning.
   - Expired vouchers or mismatched details are automatically rejected.
   - Users can use "AI Auto-Extract" to read details directly from the image without typing.

8. ADMIN & ACCOUNTS:
   - Master Admin Email: ujjwalsha2009@gmail.com
   - The admin panel allows reviewing flagged vouchers, approving, or removing suspicious uploads.

STYLE & GUIDELINES:
- Keep answers concise, clear, and friendly (2-4 sentences or short bullet points).
- If asked whether the AI is working, answer enthusiastically and mention you are powered by Google Gemini 3.6 Flash.
- If asked about an error with an upload, explain the 10/day limit, expiration date mismatch, or duplicate code checks.
`;

export async function POST(req: NextRequest) {
  try {
    const { messages, userContext } = await req.json();

    if (!GEMINI_API_KEY) {
      return NextResponse.json({
        reply: "AI Support is currently in offline mode (API key not configured). Please check back soon!",
      });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    // Format chat history for Google Generative AI
    const validHistory = (messages || [])
      .slice(-10) // Keep last 10 messages for context
      .map((m: { role: string; content: string }) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

    // If history is empty, respond to the last user message
    const lastMessage = validHistory.pop();
    if (!lastMessage || lastMessage.role !== "user") {
      return NextResponse.json({ reply: "Hello! How can I help you with PassThePromo today?" });
    }

    const chat = model.startChat({
      history: validHistory,
    });

    let promptWithContext = lastMessage.parts[0].text;
    if (userContext?.email) {
      promptWithContext = `[User: ${userContext.email}, Points: ${userContext.points || 0}, Trust: ${userContext.credit_score || 50}] ${promptWithContext}`;
    }

    const result = await chat.sendMessage(promptWithContext);
    const replyText = result.response.text();

    return NextResponse.json({ reply: replyText });
  } catch (error: any) {
    console.error("Support chat error:", error);
    return NextResponse.json(
      { reply: "I'm having a brief connection hiccup. Please try asking again in a moment!" },
      { status: 500 }
    );
  }
}
