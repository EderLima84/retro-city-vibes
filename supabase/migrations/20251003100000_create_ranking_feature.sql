CREATE TABLE public.weekly_rankings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    rank INT NOT NULL,
    score INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, week_start_date)
);

ALTER TABLE public.weekly_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Weekly rankings are viewable by everyone" 
ON public.weekly_rankings FOR SELECT 
USING (true);

CREATE OR REPLACE FUNCTION public.calculate_weekly_ranking() 
RETURNS void AS $$
DECLARE
    last_week_start_date DATE;
    last_week_end_date DATE;
BEGIN
    -- Define the start and end of the last week
    last_week_start_date := date_trunc('week', now() - interval '1 week');
    last_week_end_date := last_week_start_date + interval '6 days';

    -- Clear previous rankings for the same week to avoid duplicates
    DELETE FROM public.weekly_rankings
    WHERE week_start_date = last_week_start_date;

    -- Insert the new weekly ranking
    INSERT INTO public.weekly_rankings (user_id, week_start_date, week_end_date, rank, score)
    WITH user_scores AS (
        SELECT 
            p.id as user_id,
            (
                -- Points from posts (2 points per post)
                (SELECT COUNT(*) FROM public.posts WHERE user_id = p.id AND created_at BETWEEN last_week_start_date AND last_week_end_date) * 2 +
                -- Points from comments (1 point per comment)
                (SELECT COUNT(*) FROM public.comments WHERE user_id = p.id AND created_at BETWEEN last_week_start_date AND last_week_end_date) * 1 +
                -- Points from likes on their posts
                (SELECT COALESCE(SUM(likes_count), 0) FROM public.posts WHERE user_id = p.id AND created_at BETWEEN last_week_start_date AND last_week_end_date) +
                -- Points from achievements
                (SELECT COALESCE(SUM(a.points), 0) FROM public.user_achievements ua JOIN public.achievements a ON ua.achievement_id = a.id WHERE ua.user_id = p.id AND ua.earned_at BETWEEN last_week_start_date AND last_week_end_date)
            ) as total_score
        FROM public.profiles p
    ),
    ranked_users AS (
        SELECT
            user_id,
            total_score,
            RANK() OVER (ORDER BY total_score DESC) as rank
        FROM user_scores
    )
    SELECT 
        ru.user_id,
        last_week_start_date,
        last_week_end_date,
        ru.rank,
        ru.total_score
    FROM ranked_users ru
    WHERE ru.rank <= 10;

    -- Also update the main points on the profiles table
    UPDATE public.profiles
    SET points = (SELECT total_score FROM user_scores WHERE user_scores.user_id = public.profiles.id)
    WHERE id IN (SELECT user_id FROM user_scores);

END;
$$ LANGUAGE plpgsql;