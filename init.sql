-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. CENTERS Table
create table if not exists public.centers (
    id uuid not null default uuid_generate_v4() primary key,
    name text not null,
    address text,
    phone text,
    email text,
    business_number text,
    representative text,
    logo_url text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Enable RLS for centers
alter table public.centers enable row level security;

-- Policy: Allow public read access to centers (for Signup/Login selection)
create policy "Allow public select on centers"
on public.centers
for select
using (true);

-- 2. PROFILES Table (Extends Supabase Auth)
create table if not exists public.profiles (
    id uuid not null primary key references auth.users(id) on delete cascade,
    center_id uuid references public.centers(id),
    email text not null,
    name text not null,
    phone text,
    role text check (role in ('admin', 'manager', 'therapist', 'parent')),
    avatar_url text,
    is_active boolean default true,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

-- Policy: Users can see their own profile
create policy "Users can view own profile"
on public.profiles
for select
using (auth.uid() = id);

-- 3. ADMIN SETTINGS Table (Key-Value Store)
create table if not exists public.admin_settings (
    key text not null primary key,
    value text,
    updated_at timestamp with time zone default now(),
    updated_by uuid references auth.users(id)
);

-- Enable RLS for admin_settings
alter table public.admin_settings enable row level security;

-- Policy: Allow public read access to settings (for website content)
create policy "Public can view admin settings"
on public.admin_settings
for select
using (true);

-- Policy: Only Admins can update settings (Implementation depends on specific admin check logic, placeholder here)
-- create policy "Admins can update settings" on public.admin_settings for update using (...);

-- 4. BLOG POSTS Table
create table if not exists public.blog_posts (
    id uuid not null default uuid_generate_v4() primary key,
    slug text not null unique,
    title text not null,
    content text not null,
    excerpt text,
    cover_image_url text,
    author_id uuid references auth.users(id),
    is_published boolean default false,
    published_at timestamp with time zone,
    seo_title text,
    seo_description text,
    keywords text[],
    view_count integer default 0,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Enable RLS for blog_posts
alter table public.blog_posts enable row level security;

-- Policy: Public can view published posts
create policy "Public can view published blog posts"
on public.blog_posts
for select
using (is_published = true);

-- 5. CONSULTATIONS Table
create table if not exists public.consultations (
    id uuid not null default uuid_generate_v4() primary key,
    center_id uuid references public.centers(id),
    child_name text not null,
    child_gender text,
    child_birth_date date,
    guardian_name text,
    guardian_phone text,
    concern text,
    consultation_area text[],
    status text default 'new',
    marketing_source text,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- Enable RLS for consultations (Private data)
alter table public.consultations enable row level security;

-- Policy: Only authenticated users with role/center access can view (Placeholder)
-- create policy "Staff can view consultations" on public.consultations ...

-- 6. Trigger for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply triggers
create trigger handle_updated_at_centers before update on public.centers for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at_profiles before update on public.profiles for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at_blog_posts before update on public.blog_posts for each row execute procedure public.handle_updated_at();

