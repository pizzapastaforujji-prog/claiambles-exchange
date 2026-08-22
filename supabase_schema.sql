-- ============================================================================
-- CLAIMABLES EXCHANGE (CLAIMEXCHANGE) - SUPABASE POSTGRESQL SCHEMA v2
-- ============================================================================
-- Instructions: Run this ENTIRE script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
--
-- This version uses custom email/password auth (NO Supabase Auth dependency).
-- Profiles and claimables are referenced by email, not auth UUID.
-- ============================================================================

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop old tables if re-running (safe for fresh setup)
DROP TABLE IF EXISTS public.credit_history CASCADE;
DROP TABLE IF EXISTS public.redemptions CASCADE;
DROP TABLE IF EXISTS public.claimables CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE (User Accounts, Credit Score, Points)
-- ----------------------------------------------------------------------------
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL DEFAULT '',         -- Plain-text for this demo (hash in production)
    credit_score INTEGER NOT NULL DEFAULT 50
        CHECK (credit_score >= 0 AND credit_score <= 100),
    points INTEGER NOT NULL DEFAULT 20
        CHECK (points >= 0),
    preferred_currency TEXT NOT NULL DEFAULT 'USD',
    role TEXT NOT NULL DEFAULT 'user'
        CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Trigger to auto-update `updated_at`
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 2. CLAIMABLES TABLE (Vouchers, Gift Cards, Coupons)
-- ----------------------------------------------------------------------------
CREATE TABLE public.claimables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_email TEXT NOT NULL REFERENCES public.profiles(email) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('code', 'photo')),
    brand TEXT NOT NULL,
    offer_title TEXT NOT NULL,
    code TEXT,                        -- Plain text coupon code
    image_url TEXT,                   -- URL in Supabase Storage (optional)
    image_data_base64 TEXT,           -- Base64 image fallback
    image_media_type TEXT DEFAULT 'image/jpeg',
    image_note TEXT,
    category TEXT NOT NULL
        CHECK (category IN ('Food & Drink', 'Shopping', 'Travel', 'Entertainment', 'Services', 'Other')),
    redemption_method TEXT NOT NULL
        CHECK (redemption_method IN ('Online', 'In-store', 'Both')),
    currency TEXT NOT NULL DEFAULT 'USD',
    face_value NUMERIC(10, 2) NOT NULL CHECK (face_value > 0),
    expiry_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'valid'
        CHECK (status IN ('valid', 'pending_confirmation', 'confirmed', 'disputed', 'expired', 'admin_review')),
    points_total INTEGER NOT NULL DEFAULT 6,
    points_upfront INTEGER NOT NULL DEFAULT 2,
    points_final INTEGER NOT NULL DEFAULT 4,
    redeemed_by TEXT REFERENCES public.profiles(email) ON DELETE SET NULL,
    redeemed_at DATE,
    confirm_by DATE,
    dispute_reason TEXT,
    ai_reason TEXT,
    ai_detected_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_claimables_status ON public.claimables(status);
CREATE INDEX idx_claimables_expiry ON public.claimables(expiry_date);
CREATE INDEX idx_claimables_uploader_email ON public.claimables(uploader_email);
CREATE INDEX idx_claimables_redeemed_by ON public.claimables(redeemed_by);

CREATE TRIGGER claimables_updated_at
  BEFORE UPDATE ON public.claimables
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 3. REDEMPTIONS TABLE (Audit Trail & Daily Limit Tracking)
-- ----------------------------------------------------------------------------
CREATE TABLE public.redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claimable_id UUID NOT NULL REFERENCES public.claimables(id) ON DELETE CASCADE,
    redeemed_by TEXT NOT NULL REFERENCES public.profiles(email) ON DELETE CASCADE,
    redeemed_at DATE NOT NULL DEFAULT CURRENT_DATE,
    points_spent INTEGER NOT NULL CHECK (points_spent >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_redemptions_user_date ON public.redemptions(redeemed_by, redeemed_at);

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claimables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

-- Allow ALL operations via the anon key (our custom auth manages access at app level)
-- In a production app you'd restrict these further.

CREATE POLICY "Allow full access to profiles" ON public.profiles
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to claimables" ON public.claimables
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access to redemptions" ON public.redemptions
    FOR ALL USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 5. STORAGE BUCKET FOR CLAIMABLE PHOTOS (optional)
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('claimable-photos', 'claimable-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view claimable photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'claimable-photos');

CREATE POLICY "Anyone can upload claimable photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'claimable-photos');

-- ============================================================================
-- DONE! Your database is ready.
-- ============================================================================
