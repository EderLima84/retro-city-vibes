CREATE TABLE "public"."testimonials" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "from_user_id" uuid NOT NULL,
    "to_user_id" uuid NOT NULL,
    "content" text NOT NULL,
    "status" text NOT NULL DEFAULT 'pending'::text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "testimonials_from_user_id_fkey" FOREIGN KEY (from_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT "testimonials_to_user_id_fkey" FOREIGN KEY (to_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

ALTER TABLE "public"."testimonials" OWNER TO "postgres";

-- Enable RLS
ALTER TABLE "public"."testimonials" ENABLE ROW LEVEL SECURITY;

-- Policies for testimonials
CREATE POLICY "Public testimonials are viewable by everyone."
    ON public.testimonials FOR SELECT
    USING ( status = 'approved' );

CREATE POLICY "Users can insert their own testimonials."
    ON public.testimonials FOR INSERT
    WITH CHECK ( auth.uid() = from_user_id );

CREATE POLICY "Users can update their own testimonials."
    ON public.testimonials FOR UPDATE
    USING ( auth.uid() = from_user_id );

CREATE POLICY "Users can delete their own testimonials."
    ON public.testimonials FOR DELETE
    USING ( auth.uid() = from_user_id );

CREATE POLICY "Profile owners can manage their testimonials."
    ON public.testimonials FOR ALL
    USING ( auth.uid() = to_user_id );