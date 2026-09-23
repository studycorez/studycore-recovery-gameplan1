-- Run this in your Supabase SQL Editor to create the tutor_strikes table.

create table tutor_strikes (
  id           uuid primary key default gen_random_uuid(),
  tutor_name   text not null,
  tutor_email  text not null,
  reason       text not null,
  student_name text,
  strike_num   int not null,
  created_at   timestamptz not null default now()
);

create index tutor_strikes_email_idx on tutor_strikes (tutor_email);
