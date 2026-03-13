-- Cybersecurity Audit Response System Database Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- User Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'viewer' check (role in ('admin', 'editor', 'viewer')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_admin_select_all" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Knowledge Base Categories
create table if not exists public.kb_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz default now()
);

alter table public.kb_categories enable row level security;

create policy "kb_categories_select_all" on public.kb_categories for select using (auth.uid() is not null);
create policy "kb_categories_insert_admin" on public.kb_categories for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'editor'))
);
create policy "kb_categories_update_admin" on public.kb_categories for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'editor'))
);
create policy "kb_categories_delete_admin" on public.kb_categories for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Knowledge Base Entries
create table if not exists public.kb_entries (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.kb_categories(id) on delete set null,
  question text not null,
  answer text not null,
  tags text[] default '{}',
  source text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.kb_entries enable row level security;

create policy "kb_entries_select_all" on public.kb_entries for select using (auth.uid() is not null);
create policy "kb_entries_insert_editor" on public.kb_entries for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'editor'))
);
create policy "kb_entries_update_editor" on public.kb_entries for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'editor'))
);
create policy "kb_entries_delete_admin" on public.kb_entries for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Audit Questionnaires
create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  file_name text,
  file_type text,
  status text not null default 'draft' check (status in ('draft', 'in_progress', 'pending_approval', 'approved', 'exported')),
  created_by uuid references public.profiles(id),
  assigned_to uuid references public.profiles(id),
  due_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.audits enable row level security;

create policy "audits_select_all" on public.audits for select using (auth.uid() is not null);
create policy "audits_insert_editor" on public.audits for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'editor'))
);
create policy "audits_update_editor" on public.audits for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'editor'))
);
create policy "audits_delete_admin" on public.audits for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Audit Questions
create table if not exists public.audit_questions (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits(id) on delete cascade,
  question_number integer not null,
  question_text text not null,
  suggested_answer text,
  final_answer text,
  confidence_score decimal(3,2),
  status text not null default 'pending' check (status in ('pending', 'answered', 'reviewed', 'approved')),
  kb_reference_id uuid references public.kb_entries(id),
  reviewer_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.audit_questions enable row level security;

create policy "audit_questions_select_all" on public.audit_questions for select using (auth.uid() is not null);
create policy "audit_questions_insert_editor" on public.audit_questions for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'editor'))
);
create policy "audit_questions_update_editor" on public.audit_questions for update using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'editor'))
);
create policy "audit_questions_delete_admin" on public.audit_questions for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- Approval History
create table if not exists public.approval_history (
  id uuid primary key default gen_random_uuid(),
  audit_id uuid not null references public.audits(id) on delete cascade,
  action text not null check (action in ('submitted', 'approved', 'rejected', 'revision_requested')),
  performed_by uuid references public.profiles(id),
  comments text,
  created_at timestamptz default now()
);

alter table public.approval_history enable row level security;

create policy "approval_history_select_all" on public.approval_history for select using (auth.uid() is not null);
create policy "approval_history_insert_admin" on public.approval_history for insert with check (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'editor'))
);

-- Trigger to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', null),
    coalesce(new.raw_user_meta_data ->> 'role', 'viewer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger update_profiles_updated_at before update on public.profiles for each row execute function public.update_updated_at_column();
create trigger update_kb_entries_updated_at before update on public.kb_entries for each row execute function public.update_updated_at_column();
create trigger update_audits_updated_at before update on public.audits for each row execute function public.update_updated_at_column();
create trigger update_audit_questions_updated_at before update on public.audit_questions for each row execute function public.update_updated_at_column();
