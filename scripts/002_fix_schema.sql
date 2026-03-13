-- Fix schema to match application code

-- Update profiles table role constraint
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin', 'reviewer', 'analyst'));

-- Update default role from 'viewer' to 'analyst'
alter table public.profiles alter column role set default 'analyst';

-- Add source_file_name to audits if missing (rename file_name)
do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'audits' and column_name = 'file_name') then
    alter table public.audits rename column file_name to source_file_name;
  elsif not exists (select 1 from information_schema.columns where table_name = 'audits' and column_name = 'source_file_name') then
    alter table public.audits add column source_file_name text;
  end if;
end $$;

-- Drop file_type column if exists (not used in app)
alter table public.audits drop column if exists file_type;

-- Update audits status constraint
alter table public.audits drop constraint if exists audits_status_check;
alter table public.audits add constraint audits_status_check check (status in ('draft', 'in_progress', 'completed', 'archived'));

-- Add category column to audit_questions if missing
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'audit_questions' and column_name = 'category') then
    alter table public.audit_questions add column category text;
  end if;
end $$;

-- Add assigned_to column to audit_questions if missing
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'audit_questions' and column_name = 'assigned_to') then
    alter table public.audit_questions add column assigned_to uuid references public.profiles(id);
  end if;
end $$;

-- Add reviewed_by column to audit_questions if missing
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'audit_questions' and column_name = 'reviewed_by') then
    alter table public.audit_questions add column reviewed_by uuid references public.profiles(id);
  end if;
end $$;

-- Add reviewed_at column to audit_questions if missing
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'audit_questions' and column_name = 'reviewed_at') then
    alter table public.audit_questions add column reviewed_at timestamptz;
  end if;
end $$;

-- Rename kb_reference_id to kb_reference_ids (array) in audit_questions
do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'audit_questions' and column_name = 'kb_reference_id') then
    alter table public.audit_questions drop column kb_reference_id;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'audit_questions' and column_name = 'kb_reference_ids') then
    alter table public.audit_questions add column kb_reference_ids uuid[] default '{}';
  end if;
end $$;

-- Update audit_questions status constraint
alter table public.audit_questions drop constraint if exists audit_questions_status_check;
alter table public.audit_questions add constraint audit_questions_status_check check (status in ('pending', 'ai_suggested', 'in_review', 'approved', 'rejected'));

-- Fix approval_history to reference question_id instead of audit_id
do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'approval_history' and column_name = 'audit_id') then
    alter table public.approval_history drop column audit_id;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'approval_history' and column_name = 'question_id') then
    alter table public.approval_history add column question_id uuid references public.audit_questions(id) on delete cascade;
  end if;
end $$;

-- Add previous_answer and new_answer columns to approval_history
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'approval_history' and column_name = 'previous_answer') then
    alter table public.approval_history add column previous_answer text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'approval_history' and column_name = 'new_answer') then
    alter table public.approval_history add column new_answer text;
  end if;
end $$;

-- Rename comments to comment in approval_history
do $$
begin
  if exists (select 1 from information_schema.columns where table_name = 'approval_history' and column_name = 'comments') then
    alter table public.approval_history rename column comments to comment;
  elsif not exists (select 1 from information_schema.columns where table_name = 'approval_history' and column_name = 'comment') then
    alter table public.approval_history add column comment text;
  end if;
end $$;

-- Update approval_history action constraint
alter table public.approval_history drop constraint if exists approval_history_action_check;
alter table public.approval_history add constraint approval_history_action_check check (action in ('submitted', 'approved', 'rejected', 'edited'));

-- Update profile creation trigger to use 'analyst' as default role
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
    coalesce(new.raw_user_meta_data ->> 'role', 'analyst')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Update RLS policies for analyst/reviewer/admin roles
drop policy if exists "profiles_admin_select_all" on public.profiles;
create policy "profiles_admin_select_all" on public.profiles for select using (
  exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'reviewer'))
);

-- Allow analysts to also insert/update KB entries
drop policy if exists "kb_entries_insert_editor" on public.kb_entries;
drop policy if exists "kb_entries_update_editor" on public.kb_entries;
create policy "kb_entries_insert_auth" on public.kb_entries for insert with check (auth.uid() is not null);
create policy "kb_entries_update_auth" on public.kb_entries for update using (auth.uid() is not null);

-- Allow analysts to insert/update audit questions  
drop policy if exists "audit_questions_insert_editor" on public.audit_questions;
drop policy if exists "audit_questions_update_editor" on public.audit_questions;
create policy "audit_questions_insert_auth" on public.audit_questions for insert with check (auth.uid() is not null);
create policy "audit_questions_update_auth" on public.audit_questions for update using (auth.uid() is not null);

-- Allow analysts to create audits
drop policy if exists "audits_insert_editor" on public.audits;
drop policy if exists "audits_update_editor" on public.audits;
create policy "audits_insert_auth" on public.audits for insert with check (auth.uid() is not null);
create policy "audits_update_auth" on public.audits for update using (auth.uid() is not null);

-- Allow all authenticated users to insert approval history
drop policy if exists "approval_history_insert_admin" on public.approval_history;
create policy "approval_history_insert_auth" on public.approval_history for insert with check (auth.uid() is not null);

-- Allow all authenticated users to insert KB categories
drop policy if exists "kb_categories_insert_admin" on public.kb_categories;
drop policy if exists "kb_categories_update_admin" on public.kb_categories;
create policy "kb_categories_insert_auth" on public.kb_categories for insert with check (auth.uid() is not null);
create policy "kb_categories_update_auth" on public.kb_categories for update using (auth.uid() is not null);
