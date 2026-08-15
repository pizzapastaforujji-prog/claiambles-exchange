import type { Metadata } from "next";
import "./globals.css";
import { ExchangeProvider } from "@/lib/ExchangeContext";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";

export const metadata: Metadata = {
  title: "ClaimExchange – Capstone Coupon & Voucher Exchange",
  description:
    "Exchange unused discount codes, gift cards, and promotional vouchers before they expire. Powered by Google Gemini Claim AI verification.",
  verification: {
    google: "R0Rtdb5LUX3KG2onu35lSZpu_lNL2a0XHp_VikIo9pI",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ExchangeProvider>
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Navbar />
            <main
              style={{
                flex: 1,
                maxWidth: 1080,
                width: "100%",
                margin: "0 auto",
                padding: "0 20px 80px",
              }}
            >
              {children}
            </main>
            <Toast />
          </div>
        </ExchangeProvider>
      </body>
    </html>
  );
}
