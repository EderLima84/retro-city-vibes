-- Create report types enum
CREATE TYPE public.report_type AS ENUM ('post', 'comment', 'user', 'video');

CREATE TYPE public.report_status AS ENUM ('pending', 'resolved', 'dismissed');

-- Create has_role function if not exists
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::text = _role
  )
$$;

-- Create reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_item_id UUID NOT NULL,
  report_type public.report_type NOT NULL,
  reason TEXT NOT NULL,
  status public.report_status NOT NULL DEFAULT 'pending',
  moderator_notes TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user is moderator or admin
CREATE OR REPLACE FUNCTION public.is_moderator_or_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = is_moderator_or_admin.user_id
      AND (role::text = 'admin' OR role::text = 'moderator')
  )
$$;

-- RLS Policies for reports
CREATE POLICY "Users can create reports"
  ON public.reports
  FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
  ON public.reports
  FOR SELECT
  USING (auth.uid() = reporter_id OR public.is_moderator_or_admin(auth.uid()));

CREATE POLICY "Moderators and admins can update reports"
  ON public.reports
  FOR UPDATE
  USING (public.is_moderator_or_admin(auth.uid()));

CREATE POLICY "Admins can delete reports"
  ON public.reports
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create index for better performance
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_reports_type ON public.reports(report_type);