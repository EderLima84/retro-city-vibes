-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create enum for user roles
create type user_role as enum ('user', 'moderator', 'admin', 'prefeito');

-- Create profiles table (Casa Virtual)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  bio text,
  avatar_url text,
  house_theme text default 'default',
  house_background text,
  house_music text,
  points integer default 0,
  level integer default 1,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create user_roles table
create table public.user_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  role user_role not null default 'user',
  created_at timestamp with time zone default now(),
  unique(user_id, role)
);

-- Create scraps table (Mural de Recados)
create table public.scraps (
  id uuid primary key default uuid_generate_v4(),
  from_user_id uuid references public.profiles(id) on delete cascade not null,
  to_user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Create posts table (Praça Central)
create table public.posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  image_url text,
  likes_count integer default 0,
  comments_count integer default 0,
  created_at timestamp with time zone default now()
);

-- Create comments table
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Create communities table (Clubes)
create table public.communities (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  category text not null,
  icon text,
  creator_id uuid references public.profiles(id) on delete cascade not null,
  members_count integer default 0,
  created_at timestamp with time zone default now()
);

-- Create community_members table
create table public.community_members (
  id uuid primary key default uuid_generate_v4(),
  community_id uuid references public.communities(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member',
  joined_at timestamp with time zone default now(),
  unique(community_id, user_id)
);

-- Create achievements table (Conquistas)
create table public.achievements (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text not null,
  icon text,
  points integer not null
);

-- Create user_achievements table
create table public.user_achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  achievement_id uuid references public.achievements(id) on delete cascade not null,
  earned_at timestamp with time zone default now(),
  unique(user_id, achievement_id)
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.scraps enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- User roles policies
create policy "User roles are viewable by everyone"
  on public.user_roles for select
  using (true);

-- Scraps policies
create policy "Users can view scraps on their wall or sent by them"
  on public.scraps for select
  using (auth.uid() = to_user_id or auth.uid() = from_user_id);

create policy "Users can create scraps"
  on public.scraps for insert
  with check (auth.uid() = from_user_id);

create policy "Users can delete scraps on their wall"
  on public.scraps for delete
  using (auth.uid() = to_user_id);

-- Posts policies
create policy "Posts are viewable by everyone"
  on public.posts for select
  using (true);

create policy "Authenticated users can create posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own posts"
  on public.posts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own posts"
  on public.posts for delete
  using (auth.uid() = user_id);

-- Comments policies
create policy "Comments are viewable by everyone"
  on public.comments for select
  using (true);

create policy "Authenticated users can create comments"
  on public.comments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

-- Communities policies
create policy "Communities are viewable by everyone"
  on public.communities for select
  using (true);

create policy "Authenticated users can create communities"
  on public.communities for insert
  with check (auth.uid() = creator_id);

create policy "Community creators can update their communities"
  on public.communities for update
  using (auth.uid() = creator_id);

-- Community members policies
create policy "Community members are viewable by everyone"
  on public.community_members for select
  using (true);

create policy "Users can join communities"
  on public.community_members for insert
  with check (auth.uid() = user_id);

create policy "Users can leave communities"
  on public.community_members for delete
  using (auth.uid() = user_id);

-- Achievements policies
create policy "Achievements are viewable by everyone"
  on public.achievements for select
  using (true);

-- User achievements policies
create policy "User achievements are viewable by everyone"
  on public.user_achievements for select
  using (true);

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for profiles
create trigger set_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();

-- Create function to handle new user registration
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  
  insert into public.user_roles (user_id, role)
  values (new.id, 'user');
  
  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user registration
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();