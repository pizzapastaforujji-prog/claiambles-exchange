import { NextRequest, NextResponse } from "next/server";
import { runGeminiPlausibilityCheck, PlausibilityParams } from "@/lib/gemini";
import { toUSD, tierFor, totalPointsFor, splitPoints, todayISO } from "@/lib/claimRules";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PlausibilityParams & { creditScore?: number };

    // For photo uploads, brand & offer can be auto-extracted by Gemini Vision
    if (body.type === "code" && (!body.brand || !body.offerTitle || !body.expiry)) {
      return NextResponse.json(
        { valid: false, reason: "Please fill in the brand, offer description, and expiration date." },
        { status: 400 }
      );
    }

    if (body.type === "photo" && !body.imageDataUrl) {
      return NextResponse.json(
        { valid: false, reason: "Please attach a clear photo of the voucher." },
        { status: 400 }
      );
    }

    // Call Google Gemini 2.0 Flash with strict vision analysis
    const verdict = await runGeminiPlausibilityCheck({
      ...body,
      currentDate: todayISO(),
    });

    const discountType = verdict.detectedDiscountType || body.discountType || "amount";
    const valueNum = verdict.detectedValue || Number(body.value) || 0;
    const valueUSD = toUSD(valueNum, (body.currency as any) || "USD");
    const tier = tierFor(valueUSD, discountType, body.percentOff ? Number(body.percentOff) : undefined);
    const creditScore = body.creditScore || 50;
    const totalPoints = totalPointsFor(tier, creditScore, discountType);
    const { upfront, final } = splitPoints(totalPoints);

    return NextResponse.json({
      ...verdict,
      tier,
      points_total: totalPoints,
      points_upfront: upfront,
      points_final: final,
    });
  } catch (error: any) {
    console.error("API claim-ai error:", error);
    return NextResponse.json(
      {
        valid: false,
        reason: error?.message || "Internal server verification error.",
        source: "rules-fallback",
      },
      { status: 500 }
    );
  }
}
