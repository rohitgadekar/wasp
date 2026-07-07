-- Add unique constraint to daily_task_status to ensure one entry per user per date
-- This allows for safe upserts when automating leave status
ALTER TABLE public.daily_task_status 
ADD CONSTRAINT daily_task_status_user_id_date_key UNIQUE (user_id, date);
