import { NextRequest, NextResponse } from "next/server";
import { runGeminiPlausibilityCheck, PlausibilityParams } from "@/lib/gemini";
import { toUSD, tierFor, totalPointsFor, splitPoints } from "@/lib/claimRules";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PlausibilityParams & { creditScore?: number };

    if (!body.brand || !body.offerTitle || !body.value || !body.expiry) {
      return NextResponse.json(
        { valid: false, reason: "Missing required claimable fields." },
        { status: 400 }
      );
    }

    // Call Google Gemini Plausibility & Vision OCR
    const verdict = await runGeminiPlausibilityCheck(body);

    const valueUSD = toUSD(body.value, (body.currency as any) || "USD");
    const tier = tierFor(valueUSD);
    const creditScore = body.creditScore || 50;
    const totalPoints = totalPointsFor(tier, creditScore);
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
