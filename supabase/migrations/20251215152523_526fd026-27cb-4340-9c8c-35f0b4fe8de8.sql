-- Add sexual_orientation column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN sexual_orientation text;

-- Add check constraint for valid values
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_sexual_orientation_check 
CHECK (sexual_orientation IS NULL OR sexual_orientation IN ('straight', 'gay', 'lesbian', 'bisexual', 'pansexual', 'asexual', 'prefer-not-to-say'));

-- Insert 30 days of affirmation templates for personal accounts (mixed genders)
INSERT INTO public.daily_affirmation_templates (message, category, account_type, is_active) VALUES
-- General affirmations
('You are worthy of love and respect exactly as you are today.', 'self-worth', 'personal', true),
('Your feelings are valid and important. Take time to honor them.', 'emotional', 'personal', true),
('Every step forward, no matter how small, is progress worth celebrating.', 'motivation', 'personal', true),
('You have the strength to face whatever challenges come your way.', 'strength', 'personal', true),
('Your voice matters. Don''t be afraid to speak your truth.', 'confidence', 'personal', true),
('It''s okay to set boundaries. Protecting your peace is self-love.', 'boundaries', 'personal', true),
('You are not defined by your past. Every day is a fresh start.', 'growth', 'personal', true),
('Your journey is unique. Stop comparing and start embracing.', 'self-acceptance', 'personal', true),
('Vulnerability is courage. Opening up takes real strength.', 'emotional', 'personal', true),
('You deserve relationships that nourish your soul.', 'relationships', 'personal', true),
('Trust the timing of your life. Everything is unfolding as it should.', 'trust', 'personal', true),
('Your mental health matters. Taking care of yourself is not selfish.', 'wellness', 'personal', true),
('You are capable of creating the life you dream of.', 'motivation', 'personal', true),
('It''s okay to ask for help. We all need support sometimes.', 'support', 'personal', true),
('Your imperfections make you beautifully human.', 'self-acceptance', 'personal', true),
('Today, choose to be gentle with yourself.', 'self-care', 'personal', true),
('You are stronger than you know and braver than you believe.', 'strength', 'personal', true),
('Let go of what you cannot control. Focus on what you can.', 'peace', 'personal', true),
('You are allowed to outgrow people, places, and patterns.', 'growth', 'personal', true),
('Your heart has so much love to give. Start by giving it to yourself.', 'self-love', 'personal', true),
('Progress, not perfection, is what matters most.', 'motivation', 'personal', true),
('You are not alone in this journey. Connection is always possible.', 'connection', 'personal', true),
('Your needs are not too much. The right people will meet you where you are.', 'relationships', 'personal', true),
('Today is full of possibilities. Embrace them with an open heart.', 'optimism', 'personal', true),
('You have survived every difficult day so far. You will survive this one too.', 'resilience', 'personal', true),
('Healing is not linear. Be patient with your process.', 'healing', 'personal', true),
('You are worthy of the same love and compassion you give to others.', 'self-worth', 'personal', true),
('Your story isn''t over. Keep writing beautiful chapters.', 'hope', 'personal', true),
('Celebrate how far you''ve come, even while striving for more.', 'gratitude', 'personal', true),
('You are enough. You have always been enough.', 'self-worth', 'personal', true),

-- Couples affirmations
('Together, you and your partner create a love that grows stronger each day.', 'love', 'couples', true),
('Every challenge you face together strengthens your bond.', 'resilience', 'couples', true),
('Your relationship is worth the effort you both invest in it.', 'commitment', 'couples', true),
('Open communication is the bridge that connects your hearts.', 'communication', 'couples', true),
('You both deserve to feel heard, seen, and appreciated.', 'appreciation', 'couples', true),
('Small acts of kindness create big waves of love in your relationship.', 'kindness', 'couples', true),
('Your love story is unique and beautiful in its own way.', 'love', 'couples', true),
('Together, you can overcome any obstacle that comes your way.', 'teamwork', 'couples', true),
('Choosing each other every day is the greatest act of love.', 'commitment', 'couples', true),
('Your partner is on the same team. Remember, it''s you two versus the problem.', 'teamwork', 'couples', true);