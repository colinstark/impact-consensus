-- Friends and sending topics to them.
-- A member adds another by nickname (one row). They are friends once both have added each other,
-- and only friends can send each other topics, so strangers can't fill someone's inbox.

create table friends (
  user_id uuid not null references auth.users on delete cascade default auth.uid(),
  friend_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);
create index on friends (friend_id);

create table shares (
  id bigint generated always as identity primary key,
  sender_id uuid not null references auth.users on delete cascade default auth.uid(),
  recipient_id uuid not null references auth.users on delete cascade,
  article_id bigint not null references articles on delete cascade,
  note text check (char_length(note) <= 280),
  -- The sender's vote, only when they chose to include it.
  sender_stance vote_stance,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index on shares (recipient_id, created_at desc);

alter table friends enable row level security;
alter table shares enable row level security;

-- True when both people have added each other.
create function public.are_friends(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.friends where user_id = a and friend_id = b)
     and exists (select 1 from public.friends where user_id = b and friend_id = a)
$$;

-- You see who you added and who added you; nobody else's list.
create policy "see own friend rows" on friends for select to authenticated
  using ((select auth.uid()) in (user_id, friend_id));
create policy "members add friends" on friends for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from profiles where id = (select auth.uid()))
    and exists (select 1 from profiles where id = friend_id)
  );
create policy "remove own friend rows" on friends for delete to authenticated
  using ((select auth.uid()) in (user_id, friend_id));

create policy "see own shares" on shares for select to authenticated
  using ((select auth.uid()) in (sender_id, recipient_id));
create policy "send to friends" on shares for insert to authenticated
  with check (sender_id = (select auth.uid()) and public.are_friends(sender_id, recipient_id));
create policy "recipient marks read" on shares for update to authenticated
  using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));
create policy "either side deletes" on shares for delete to authenticated
  using ((select auth.uid()) in (sender_id, recipient_id));

alter publication supabase_realtime add table friends, shares;

-- Marking as read is the only change a recipient can make.
revoke update on shares from authenticated, anon;
grant update (read_at) on shares to authenticated;
