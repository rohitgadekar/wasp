-- Add manager role to app_role enum
-- Note: This must be committed before it can be used in policies or functions.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
