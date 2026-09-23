-- Run this in your Supabase SQL Editor to create the contracts table.

create table if not exists contracts (
  id              uuid primary key default gen_random_uuid(),
  token           uuid unique not null default gen_random_uuid(),
  type            text not null check (type in ('tutor', 'student')),
  recipient_name  text not null,
  recipient_email text not null,
  contract_data   jsonb,
  status          text not null default 'pending' check (status in ('pending', 'signed')),
  signed_name     text,
  signed_at       timestamptz,
  drive_file_url  text,
  created_at      timestamptz not null default now()
);

-- Index for fast token lookups
create index if not exists contracts_token_idx on contracts (token);

-- Index for listing by type/status
create index if not exists contracts_type_status_idx on contracts (type, status);
