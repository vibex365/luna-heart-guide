-- Drop and recreate the leaderboard view with SECURITY INVOKER
DROP VIEW IF EXISTS public.referral_leaderboard;

CREATE VIEW public.referral_leaderboard 
WITH (security_invoker = true)
AS
SELECT 
  rp.user_id,
  COALESCE(p.display_name, 'Anonymous') as display_name,
  rp.lifetime_earned,
  rp.total_referrals,
  rp.successful_conversions,
  rp.level,
  rp.current_streak,
  ROW_NUMBER() OVER (ORDER BY rp.lifetime_earned DESC) as rank
FROM public.referral_points rp
LEFT JOIN public.profiles p ON rp.user_id = p.user_id
WHERE rp.total_referrals > 0
ORDER BY rp.lifetime_earned DESC
LIMIT 100;