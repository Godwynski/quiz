
-- 
-- Quiz Attempts / History
-- 
create table if not exists quiz_attempts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  quiz_id text not null,
  quiz_title text not null,
  score integer not null,
  total_questions integer not null,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  answers jsonb
);

alter table quiz_attempts enable row level security;

create policy "Users can view their own attempts"
  on quiz_attempts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own attempts"
  on quiz_attempts for insert
  with check (auth.uid() = user_id);
