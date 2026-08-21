-- Enforce one account per phone number at the database level.
--
-- The application checks phone uniqueness in createTaxpayerAccount, but a
-- database constraint is the real guarantee — no code path (server function,
-- trigger, backfill, manual insert) can create two profiles that share a phone.
--
-- Phone numbers are stored in free text ("0803 000 0000", "+2348030000000"),
-- so we index a normalized form (digits only) and take the last 7 digits, which
-- is stable across country-code and spacing variations.

-- Normalized phone: digits only, last 7. Two profiles collide only when the
-- meaningful tail of the number matches.
CREATE OR REPLACE FUNCTION public.normalize_phone(p_phone TEXT)
RETURNS TEXT LANGUAGE SQL IMMUTABLE AS $$
  SELECT right(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), 7)
$$;

-- Unique partial index: only rows that actually have a phone are constrained,
-- so profiles with no phone (allowed) are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS uq_profiles_phone_norm
  ON public.profiles (public.normalize_phone(phone))
  WHERE public.normalize_phone(phone) <> '';
