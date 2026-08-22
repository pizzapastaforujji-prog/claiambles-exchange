import type { Metadata } from "next";
import "./globals.css";
import { ExchangeProvider } from "@/lib/ExchangeContext";
import Navbar from "@/components/Navbar";
import Toast from "@/components/Toast";

export const metadata: Metadata = {
  title: "PassThePromo — Zero-Waste Coupon & Voucher Exchange",
  description:
    "Pass your unused discount codes, vouchers, and gift cards to others before they expire. Verified by Gemini Vision AI with fair two-phase escrow.",
  applicationName: "PassThePromo",
  generator: "Next.js",
  keywords: ["coupons", "vouchers", "discount codes", "promo codes", "exchange", "gift cards", "passthepromo"],
  authors: [{ name: "PassThePromo Team" }],
  creator: "PassThePromo",
  publisher: "PassThePromo",
  metadataBase: new URL("https://passthepromo.vercel.app"),
  alternates: {
    canonical: "https://passthepromo.vercel.app",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://passthepromo.vercel.app",
    siteName: "PassThePromo",
    title: "PassThePromo — Zero-Waste Coupon & Voucher Exchange",
    description:
      "Pass your unused discount codes, vouchers, and gift cards to others before they expire. Verified by Gemini Vision AI.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PassThePromo — Zero-Waste Coupon & Voucher Exchange",
    description: "Exchange unused discount codes and promo vouchers before they expire.",
  },
  verification: {
    google: "R0Rtdb5LUX3KG2onu35lSZpu_lNL2a0XHp_VikIo9pI",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "PassThePromo",
  alternateName: ["Pass The Promo", "PassThePromo Exchange"],
  url: "https://passthepromo.vercel.app",
  description: "Zero-waste coupon and voucher exchange platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
