/*
  # Fix Function Search Path Security Issue

  1. Problem
    - Function update_professional_documents_updated_at has a mutable search_path
    - This is a security vulnerability

  2. Solution
    - Recreate the function with SET search_path = public
    - This makes the search path immutable and secure

  3. Security
    - Prevents potential SQL injection through search_path manipulation
    - Follows Supabase security best practices
*/

-- Drop and recreate the function with proper search_path
CREATE OR REPLACE FUNCTION public.update_professional_documents_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;