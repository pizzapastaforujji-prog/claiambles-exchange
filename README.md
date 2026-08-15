# 🎟️ ClaimExchange — Capstone Project

> **"Your unused coupon is someone else's win."**  
> An intelligent, trust-driven marketplace for exchanging unused discount codes, gift cards, and vouchers before they expire.

---

## 🌟 Key Features

1. **Claim AI Verification (Powered by Google Gemini 2.0 Flash)**:
   - **Text Codes**: Evaluates brand, discount percentage/value, and category consistency while detecting gibberish or spam codes.
   - **Photo Vouchers (Multimodal Vision OCR)**: Inspects physical vouchers/gift cards, extracts barcodes & coupon codes with OCR, and enforces authenticity.
2. **Two-Phase Escrow & Trust Model**:
   - **25% Upfront**: Awarded to the uploader immediately upon Claim AI approval.
   - **75% Confirmed Payout**: Released once the recipient redeems and confirms the voucher works (or after a 3-day auto-confirmation window).
3. **Credit Score Dynamics (0–100)**:
   - New accounts start at **50**.
   - Valid uploads & successful redemptions add **+5**.
   - Higher credit scores unlock higher point payouts per coupon.
   - Disputed/invalid codes trigger an immediate **-20 credit deduction** and claw back upfront points.
4. **Daily Fair-Usage Limit**:
   - Each account is permitted **1 redemption per day** to encourage fair distribution.
5. **Blurred Preview Protection**:
   - Voucher photos are kept safely blurred in the public marketplace and unmasked only in the authenticated redeemer's Dashboard.
6. **Admin Audit Console**:
   - Dedicated verification portal to approve or reject flagged submissions.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v18 or higher (v24 installed)
- **Google Gemini API Key** (Free): [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Supabase Account** (Free): [Supabase](https://supabase.com)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/your-username/claim-exchange.git
cd claim-exchange

# Install dependencies
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local` and add your keys:
```bash
cp .env.example .env.local
```

Inside `.env.local`:
```env
GEMINI_API_KEY=AIzaSy...
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Setup (Supabase)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) and click **"New Project"**.
2. Navigate to the **SQL Editor** tab on the left sidebar.
3. Open the [`supabase_schema.sql`](./supabase_schema.sql) file included in this repository.
4. Paste the entire SQL script into the editor and click **Run**.
5. Go to **Project Settings -> API** to copy your **Project URL** and **anon public key** into `.env.local`.

---

## ☁️ Deploying to Vercel

1. Push your repository to **GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of ClaimExchange Capstone"
   git branch -M main
   git remote add origin https://github.com/your-username/claim-exchange.git
   git push -u origin main
   ```
2. Go to [Vercel Dashboard](https://vercel.com/new).
3. Import your `claim-exchange` repository.
4. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**. Your site will be live on `https://your-app.vercel.app` in under 60 seconds!

---

## 👥 Capstone Group Members
- Ujjwal
- Sejal
- Prisha
- Shreyasi
