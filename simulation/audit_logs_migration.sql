-- Create Audit Logs Table
create table if not exists public.audit_logs (
    id uuid not null default gen_random_uuid(),
    created_at timestamp with time zone not null default now(),
    actor_name text not null,
    action text not null,
    target_id text,
    details jsonb,
    constraint audit_logs_pkey primary key (id)
);

-- Policy (Optional: if RLS is enabled)
-- create policy "Enable read access for all users" on "public"."audit_logs"
-- as permissive for select
-- to public
-- using (true);

-- create policy "Enable insert for all users" on "public"."audit_logs"
-- as permissive for insert
-- to public
-- with check (true);
