create table if not exists public.organizations (
    id uuid primary key default gen_random_uuid(),
    name text not null check (char_length(trim(name)) between 1 and 120),
    created_by uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
    organization_id uuid not null references public.organizations(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    role text not null default 'owner' check (role in ('owner', 'admin', 'analyst')),
    created_at timestamptz not null default now(),
    primary key (organization_id, user_id)
);

create table if not exists public.employee_datasets (
    organization_id uuid primary key references public.organizations(id) on delete cascade,
    records jsonb not null default '[]'::jsonb check (jsonb_typeof(records) = 'array'),
    updated_at timestamptz not null default now()
);

create index if not exists organization_members_user_id_idx
    on public.organization_members(user_id);

create or replace function public.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.organization_members
        where organization_id = target_organization_id
          and user_id = (select auth.uid())
    );
$$;

revoke all on function public.is_organization_member(uuid) from public;
grant execute on function public.is_organization_member(uuid) to authenticated;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.employee_datasets enable row level security;

create policy "members can read their organizations"
    on public.organizations for select to authenticated
    using (created_by = (select auth.uid()) or public.is_organization_member(id));

create policy "users can create organizations they own"
    on public.organizations for insert to authenticated
    with check (created_by = (select auth.uid()));

create policy "users can read their own memberships"
    on public.organization_members for select to authenticated
    using (user_id = (select auth.uid()));

create policy "organization creators can add their owner membership"
    on public.organization_members for insert to authenticated
    with check (
        user_id = (select auth.uid())
        and role = 'owner'
        and exists (
            select 1 from public.organizations
            where id = organization_id
              and created_by = (select auth.uid())
        )
    );

create policy "organization members can read employee datasets"
    on public.employee_datasets for select to authenticated
    using (public.is_organization_member(organization_id));

create policy "organization members can create employee datasets"
    on public.employee_datasets for insert to authenticated
    with check (public.is_organization_member(organization_id));

create policy "organization members can update employee datasets"
    on public.employee_datasets for update to authenticated
    using (public.is_organization_member(organization_id))
    with check (public.is_organization_member(organization_id));

create policy "organization owners and admins can delete employee datasets"
    on public.employee_datasets for delete to authenticated
    using (
        exists (
            select 1 from public.organization_members
            where organization_id = employee_datasets.organization_id
              and user_id = (select auth.uid())
              and role in ('owner', 'admin')
        )
    );

grant select, insert on public.organizations to authenticated;
grant select, insert on public.organization_members to authenticated;
grant select, insert, update, delete on public.employee_datasets to authenticated;