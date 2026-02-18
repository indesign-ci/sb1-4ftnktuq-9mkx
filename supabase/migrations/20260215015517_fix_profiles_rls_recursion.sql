/*
  # Fix infinite recursion in profiles RLS policies

  1. Problem
    - Current policies query the profiles table within the policy itself
    - This creates infinite recursion when checking permissions
  
  2. Solution
    - Drop existing problematic policies
    - Create new policies that avoid self-referencing
    - Use a security definer function to safely get user's company_id
  
  3. Security
    - Users can read profiles in their own company
    - Users can update their own profile
    - Users can insert their own profile
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can view profiles in their company" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles in their company" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create a security definer function to get user's company_id
-- This function runs with elevated privileges and doesn't trigger RLS
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_company_id UUID;
BEGIN
  SELECT company_id INTO v_company_id
  FROM profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN v_company_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_company_id() TO authenticated;

-- Create new policies without recursion

-- SELECT: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- SELECT: Users can view other profiles in same company
CREATE POLICY "Users can view company profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (company_id = public.get_user_company_id() AND id != auth.uid());

-- UPDATE: Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- INSERT: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());
