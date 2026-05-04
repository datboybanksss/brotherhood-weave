ALTER TABLE public.lessons ADD COLUMN is_released boolean NOT NULL DEFAULT false;
ALTER TABLE public.lessons ADD COLUMN release_date timestamptz NULL;
UPDATE public.lessons SET is_released = false;