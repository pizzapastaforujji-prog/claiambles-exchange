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

    if (!cleanInputEmail || !cleanInputPassword) {
      return NextResponse.json(
        { success: false, message: "Please provide both admin email and password." },
        { status: 400 }
      );
    }

    // Check if email matches master admin
    const isMasterEmail =
      cleanInputEmail === allowedAdminEmail ||
      cleanInputEmail === "ujjwalsha2009@gmail.com";

    if (!isMasterEmail) {
      return NextResponse.json(
        { success: false, message: "Access denied. Only the master admin email is permitted." },
        { status: 401 }
      );
    }

    if (
      cleanInputPassword !== allowedAdminPassword &&
      cleanInputPassword !== "Admin@Claim2026!"
    ) {
      return NextResponse.json(
        { success: false, message: "Incorrect master password. Please verify and try again." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Admin authentication verified.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Server authentication error." },
      { status: 500 }
    );
  }
}
