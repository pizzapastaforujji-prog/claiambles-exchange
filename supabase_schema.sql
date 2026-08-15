-- ============================================================================
-- CLAIMABLES EXCHANGE (CLAIMEXCHANGE) - SUPABASE POSTGRESQL SCHEMA
-- ============================================================================
-- Instructions: Run this script in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- It creates all required tables, constraints, functions, triggers, and Row Level Security (RLS) policies.

-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE (User Accounts, Credit Score, Points)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    credit_score INTEGER NOT NULL DEFAULT 50 CHECK (credit_score >= 0 AND credit_score <= 100),
    points INTEGER NOT NULL DEFAULT 20 CHECK (points >= 0),
    preferred_currency TEXT NOT NULL DEFAULT 'USD',
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. CLAIMABLES TABLE (Vouchers, Gift Cards, Coupons)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.claimables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('code', 'photo')),
    brand TEXT NOT NULL,
    offer_title TEXT NOT NULL,
    code TEXT, -- Plain text code or encrypted token
    image_url TEXT, -- URL in Supabase Storage bucket
    image_data_base64 TEXT, -- Base64 fallback if storage not configured
    image_media_type TEXT DEFAULT 'image/jpeg',
    image_note TEXT,
    category TEXT NOT NULL CHECK (category IN ('Food & Drink', 'Shopping', 'Travel', 'Entertainment', 'Services', 'Other')),
    redemption_method TEXT NOT NULL CHECK (redemption_method IN ('Online', 'In-store', 'Both')),
    currency TEXT NOT NULL DEFAULT 'USD',
    face_value NUMERIC(10, 2) NOT NULL CHECK (face_value > 0),
    expiry_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'pending_confirmation', 'confirmed', 'disputed', 'expired', 'admin_review')),
    points_total INTEGER NOT NULL DEFAULT 6,
    points_upfront INTEGER NOT NULL DEFAULT 2,
    points_final INTEGER NOT NULL DEFAULT 4,
    redeemed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    redeemed_at DATE,
    confirm_by DATE,
    dispute_reason TEXT,
    ai_reason TEXT,
    ai_detected_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for searching and sorting claimables
CREATE INDEX IF NOT EXISTS idx_claimables_status ON public.claimables(status);
CREATE INDEX IF NOT EXISTS idx_claimables_expiry ON public.claimables(expiry_date);
CREATE INDEX IF NOT EXISTS idx_claimables_uploader ON public.claimables(uploader_id);
CREATE INDEX IF NOT EXISTS idx_claimables_redeemed_by ON public.claimables(redeemed_by);

-- ----------------------------------------------------------------------------
-- 3. REDEMPTIONS TABLE (Audit Trail & Daily Limit Tracking)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claimable_id UUID NOT NULL REFERENCES public.claimables(id) ON DELETE CASCADE,
    redeemed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    redeemed_at DATE NOT NULL DEFAULT CURRENT_DATE,
    points_spent INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_redemptions_user_date ON public.redemptions(redeemed_by, redeemed_at);

-- ----------------------------------------------------------------------------
-- 4. CREDIT HISTORY (Audit of Points & Credit Score Adjustments)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.credit_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    claimable_id UUID REFERENCES public.claimables(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('signup_bonus', 'upload_upfront', 'upload_final_confirmed', 'dispute_clawback', 'redeem_spent', 'dispute_refund', 'admin_adjustment')),
    points_delta INTEGER NOT NULL,
    credit_score_delta INTEGER NOT NULL DEFAULT 0,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claimables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_history ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone authenticated can read user public info; users can update their own row
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Claimables: Anyone can browse 'valid' claimables.
-- Code & unblurred photo should only be returned if user is uploader or redeemer.
CREATE POLICY "Anyone can browse active claimables" ON public.claimables
    FOR SELECT USING (status = 'valid' OR uploader_id = auth.uid() OR redeemed_by = auth.uid());

CREATE POLICY "Authenticated users can upload claimables" ON public.claimables
    FOR INSERT WITH CHECK (auth.uid() = uploader_id);

CREATE POLICY "Uploader or Redeemer can update claimable state" ON public.claimables
    FOR UPDATE USING (auth.uid() = uploader_id OR auth.uid() = redeemed_by);

-- Redemptions: Users can view their own redemptions
CREATE POLICY "Users can view own redemptions" ON public.redemptions
    FOR SELECT USING (auth.uid() = redeemed_by);

CREATE POLICY "Users can create redemptions" ON public.redemptions
    FOR INSERT WITH CHECK (auth.uid() = redeemed_by);

-- Credit History: Users can view their own transactions
CREATE POLICY "Users can view own credit history" ON public.credit_history
    FOR SELECT USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 6. AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, credit_score, points, preferred_currency, role)
    VALUES (new.id, new.email, 50, 20, 'USD', 'user');

    INSERT INTO public.credit_history (user_id, action_type, points_delta, credit_score_delta, note)
    VALUES (new.id, 'signup_bonus', 20, 50, 'Welcome bonus points & initial credit score');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 7. STORAGE BUCKET FOR CLAIMABLE PHOTOS
-- ----------------------------------------------------------------------------
-- Run in Supabase Storage: Create a public or private bucket named 'claimable-photos'
INSERT INTO storage.buckets (id, name, public)
VALUES ('claimable-photos', 'claimable-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view claimable photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'claimable-photos');

CREATE POLICY "Authenticated users can upload claimable photos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'claimable-photos' AND auth.role() = 'authenticated');
