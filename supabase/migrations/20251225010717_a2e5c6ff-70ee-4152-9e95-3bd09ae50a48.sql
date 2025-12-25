-- Add admin INSERT policy for minute_transactions
CREATE POLICY "Admins can insert transactions for any user"
ON public.minute_transactions
FOR INSERT
TO public
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add admin INSERT policy for user_minutes (in case they need to create a record)
CREATE POLICY "Admins can insert minutes for any user"
ON public.user_minutes
FOR INSERT
TO public
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));