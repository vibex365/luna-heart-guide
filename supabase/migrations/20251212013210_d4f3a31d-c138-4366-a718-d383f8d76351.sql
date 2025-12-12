-- Create Luna AI configuration table
CREATE TABLE public.luna_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.luna_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read config (needed for app functionality)
CREATE POLICY "Anyone can view luna config"
ON public.luna_config
FOR SELECT
USING (true);

-- Only admins can modify config
CREATE POLICY "Admins can manage luna config"
ON public.luna_config
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_luna_config_updated_at
BEFORE UPDATE ON public.luna_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configuration
INSERT INTO public.luna_config (key, value, description) VALUES
(
  'tone',
  '{"intensity": 0.3, "labels": {"0": "Gentle", "0.5": "Balanced", "1": "Direct"}}'::jsonb,
  'Controls how gentle or direct Luna responds'
),
(
  'depth',
  '{"level": 0.5, "labels": {"0": "Surface", "0.5": "Moderate", "1": "Deep Emotional"}}'::jsonb,
  'Controls the depth of emotional analysis'
),
(
  'conversation',
  '{"max_length": 50, "memory_window": 20}'::jsonb,
  'Conversation length and memory settings'
),
(
  'safety',
  '{"enabled": true, "crisis_detection": true, "content_filter": true, "escalation_alerts": true}'::jsonb,
  'Safety filters and crisis detection'
),
(
  'modules',
  '{
    "communication_coaching": {"enabled": true, "label": "Communication Coaching", "description": "Help users express themselves better"},
    "conflict_deescalation": {"enabled": true, "label": "Conflict De-escalation", "description": "Calm heated situations"},
    "breakup_recovery": {"enabled": true, "label": "Breakup Recovery", "description": "Support through relationship endings"},
    "boundary_building": {"enabled": true, "label": "Boundary Building", "description": "Help establish healthy boundaries"},
    "anxiety_support": {"enabled": true, "label": "Anxiety Support", "description": "Techniques for managing anxiety"},
    "self_esteem": {"enabled": true, "label": "Self-Esteem Building", "description": "Boost confidence and self-worth"},
    "grief_support": {"enabled": false, "label": "Grief Support", "description": "Navigate loss and mourning"},
    "couples_therapy": {"enabled": true, "label": "Couples Therapy", "description": "Support for relationship issues"}
  }'::jsonb,
  'Luna conversation modules and capabilities'
);