import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const allowedAdminEmail = (
      process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
      process.env.ADMIN_EMAIL ||
      "ujjwalsha2009@gmail.com"
    ).trim().toLowerCase();

    const allowedAdminPassword = (
      process.env.ADMIN_SECRET_KEY ||
      process.env.ADMIN_PASSWORD ||
      "Admin@Claim2026!"
    ).trim();

    const cleanInputEmail = (email || "").trim().toLowerCase();
    const cleanInputPassword = (password || "").trim();

    if (
      cleanInputEmail === allowedAdminEmail &&
      cleanInputPassword === allowedAdminPassword
    ) {
      return NextResponse.json({
        success: true,
        message: "Admin authentication verified.",
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Invalid admin credentials. Access denied.",
      },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Server authentication error." },
      { status: 500 }
    );
  }
}
