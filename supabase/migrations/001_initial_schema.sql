-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (linked to auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null,
  profile_image text,
  created_at timestamptz default now()
);

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'User'), new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Recipes table
create table public.recipes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  dish_name text not null,
  cuisine text default '',
  description text default '',
  servings integer default 4,
  prep_time integer default 0,
  cook_time integer default 0,
  difficulty text default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  rating integer,
  is_favorite boolean default false,
  source_url text,
  nutrition jsonb,
  instructions text[] default '{}',
  recipe_images text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ingredients table
create table public.ingredients (
  id uuid default uuid_generate_v4() primary key,
  recipe_id uuid references public.recipes(id) on delete cascade not null,
  name text not null,
  quantity text default '',
  unit text default '',
  category text default 'other',
  group_name text,
  notes text,
  is_selected boolean default true,
  sort_order integer default 0
);

-- Shopping items table
create table public.shopping_items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  quantity text default '',
  unit text default '',
  category text default 'other',
  notes text,
  is_checked boolean default false,
  recipe_id text,
  recipe_name text,
  created_at timestamptz default now()
);

-- Meal planner slots
create table public.meal_slots (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  recipe_id text not null,
  recipe_name text not null,
  recipe_image text,
  date date not null,
  meal_type text not null check (meal_type in ('frühstück', 'mittagessen', 'abendessen', 'snack')),
  servings integer default 4,
  created_at timestamptz default now()
);

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.recipes enable row level security;
alter table public.ingredients enable row level security;
alter table public.shopping_items enable row level security;
alter table public.meal_slots enable row level security;

-- RLS Policies: Users can only see/edit their own data

-- Profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Recipes
create policy "Users can view own recipes" on public.recipes for select using (auth.uid() = user_id);
create policy "Users can insert own recipes" on public.recipes for insert with check (auth.uid() = user_id);
create policy "Users can update own recipes" on public.recipes for update using (auth.uid() = user_id);
create policy "Users can delete own recipes" on public.recipes for delete using (auth.uid() = user_id);

-- Ingredients (via recipe ownership)
create policy "Users can view own ingredients" on public.ingredients for select using (
  exists (select 1 from public.recipes where recipes.id = ingredients.recipe_id and recipes.user_id = auth.uid())
);
create policy "Users can insert own ingredients" on public.ingredients for insert with check (
  exists (select 1 from public.recipes where recipes.id = ingredients.recipe_id and recipes.user_id = auth.uid())
);
create policy "Users can update own ingredients" on public.ingredients for update using (
  exists (select 1 from public.recipes where recipes.id = ingredients.recipe_id and recipes.user_id = auth.uid())
);
create policy "Users can delete own ingredients" on public.ingredients for delete using (
  exists (select 1 from public.recipes where recipes.id = ingredients.recipe_id and recipes.user_id = auth.uid())
);

-- Shopping items
create policy "Users can view own shopping" on public.shopping_items for select using (auth.uid() = user_id);
create policy "Users can insert own shopping" on public.shopping_items for insert with check (auth.uid() = user_id);
create policy "Users can update own shopping" on public.shopping_items for update using (auth.uid() = user_id);
create policy "Users can delete own shopping" on public.shopping_items for delete using (auth.uid() = user_id);

-- Meal slots
create policy "Users can view own meals" on public.meal_slots for select using (auth.uid() = user_id);
create policy "Users can insert own meals" on public.meal_slots for insert with check (auth.uid() = user_id);
create policy "Users can update own meals" on public.meal_slots for update using (auth.uid() = user_id);
create policy "Users can delete own meals" on public.meal_slots for delete using (auth.uid() = user_id);

-- Indexes for performance
create index idx_recipes_user_id on public.recipes(user_id);
create index idx_recipes_created_at on public.recipes(created_at desc);
create index idx_ingredients_recipe_id on public.ingredients(recipe_id);
create index idx_shopping_user_id on public.shopping_items(user_id);
create index idx_meal_slots_user_date on public.meal_slots(user_id, date);

-- Updated_at trigger for recipes
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger recipes_updated_at
  before update on public.recipes
  for each row execute function public.update_updated_at();
