-- Add selected_categories column to user_settings for tier-based category label limits
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS selected_categories TEXT[] DEFAULT ARRAY['important', 'work', 'social']::TEXT[];
