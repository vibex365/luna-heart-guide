-- Fix 1: Restrict profiles table to only allow users to view their own profile
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Also allow admins to view all profiles for admin panel
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

-- Fix 2: Restrict luna_config to authenticated users only
DROP POLICY IF EXISTS "Anyone can view luna config" ON public.luna_config;
CREATE POLICY "Authenticated users can view luna config" 
ON public.luna_config 
FOR SELECT 
TO authenticated
USING (true);

-- Fix 3: Fix conversation_analytics insert policy to require authentication
DROP POLICY IF EXISTS "Service role can insert analytics" ON public.conversation_analytics;
CREATE POLICY "Authenticated users can insert their own analytics" 
ON public.conversation_analytics 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);