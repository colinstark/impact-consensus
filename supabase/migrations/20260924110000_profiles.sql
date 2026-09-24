create table barrios (
  id smallint primary key,
  name text not null unique,
  district text not null
);

insert into barrios (id, name, district) values
  (1, 'el Raval', 'Ciutat Vella'),
  (2, 'el Barri Gòtic', 'Ciutat Vella'),
  (3, 'la Barceloneta', 'Ciutat Vella'),
  (4, 'Sant Pere, Santa Caterina i la Ribera', 'Ciutat Vella'),
  (5, 'el Fort Pienc', 'Eixample'),
  (6, 'la Sagrada Família', 'Eixample'),
  (7, 'la Dreta de l''Eixample', 'Eixample'),
  (8, 'l''Antiga Esquerra de l''Eixample', 'Eixample'),
  (9, 'la Nova Esquerra de l''Eixample', 'Eixample'),
  (10, 'Sant Antoni', 'Eixample'),
  (11, 'el Poble-sec', 'Sants-Montjuïc'),
  (12, 'la Marina del Prat Vermell', 'Sants-Montjuïc'),
  (13, 'la Marina de Port', 'Sants-Montjuïc'),
  (14, 'la Font de la Guatlla', 'Sants-Montjuïc'),
  (15, 'Hostafrancs', 'Sants-Montjuïc'),
  (16, 'la Bordeta', 'Sants-Montjuïc'),
  (17, 'Sants - Badal', 'Sants-Montjuïc'),
  (18, 'Sants', 'Sants-Montjuïc'),
  (19, 'les Corts', 'Les Corts'),
  (20, 'la Maternitat i Sant Ramon', 'Les Corts'),
  (21, 'Pedralbes', 'Les Corts'),
  (22, 'Vallvidrera, el Tibidabo i les Planes', 'Sarrià-Sant Gervasi'),
  (23, 'Sarrià', 'Sarrià-Sant Gervasi'),
  (24, 'les Tres Torres', 'Sarrià-Sant Gervasi'),
  (25, 'Sant Gervasi - la Bonanova', 'Sarrià-Sant Gervasi'),
  (26, 'Sant Gervasi - Galvany', 'Sarrià-Sant Gervasi'),
  (27, 'el Putxet i el Farró', 'Sarrià-Sant Gervasi'),
  (28, 'Vallcarca i els Penitents', 'Gràcia'),
  (29, 'el Coll', 'Gràcia'),
  (30, 'la Salut', 'Gràcia'),
  (31, 'la Vila de Gràcia', 'Gràcia'),
  (32, 'el Camp d''en Grassot i Gràcia Nova', 'Gràcia'),
  (33, 'el Baix Guinardó', 'Horta-Guinardó'),
  (34, 'Can Baró', 'Horta-Guinardó'),
  (35, 'el Guinardó', 'Horta-Guinardó'),
  (36, 'la Font d''en Fargues', 'Horta-Guinardó'),
  (37, 'el Carmel', 'Horta-Guinardó'),
  (38, 'la Teixonera', 'Horta-Guinardó'),
  (39, 'Sant Genís dels Agudells', 'Horta-Guinardó'),
  (40, 'Montbau', 'Horta-Guinardó'),
  (41, 'la Vall d''Hebron', 'Horta-Guinardó'),
  (42, 'la Clota', 'Horta-Guinardó'),
  (43, 'Horta', 'Horta-Guinardó'),
  (44, 'Vilapicina i la Torre Llobeta', 'Nou Barris'),
  (45, 'Porta', 'Nou Barris'),
  (46, 'el Turó de la Peira', 'Nou Barris'),
  (47, 'Can Peguera', 'Nou Barris'),
  (48, 'la Guineueta', 'Nou Barris'),
  (49, 'Canyelles', 'Nou Barris'),
  (50, 'les Roquetes', 'Nou Barris'),
  (51, 'Verdun', 'Nou Barris'),
  (52, 'la Prosperitat', 'Nou Barris'),
  (53, 'la Trinitat Nova', 'Nou Barris'),
  (54, 'Torre Baró', 'Nou Barris'),
  (55, 'Ciutat Meridiana', 'Nou Barris'),
  (56, 'Vallbona', 'Nou Barris'),
  (57, 'la Trinitat Vella', 'Sant Andreu'),
  (58, 'Baró de Viver', 'Sant Andreu'),
  (59, 'el Bon Pastor', 'Sant Andreu'),
  (60, 'Sant Andreu', 'Sant Andreu'),
  (61, 'la Sagrera', 'Sant Andreu'),
  (62, 'el Congrés i els Indians', 'Sant Andreu'),
  (63, 'Navas', 'Sant Andreu'),
  (64, 'el Camp de l''Arpa del Clot', 'Sant Martí'),
  (65, 'el Clot', 'Sant Martí'),
  (66, 'el Parc i la Llacuna del Poblenou', 'Sant Martí'),
  (67, 'la Vila Olímpica del Poblenou', 'Sant Martí'),
  (68, 'el Poblenou', 'Sant Martí'),
  (69, 'Diagonal Mar i el Front Marítim del Poblenou', 'Sant Martí'),
  (70, 'el Besòs i el Maresme', 'Sant Martí'),
  (71, 'Provençals del Poblenou', 'Sant Martí'),
  (72, 'Sant Martí de Provençals', 'Sant Martí'),
  (73, 'la Verneda i la Pau', 'Sant Martí');

create table profiles (
  id uuid primary key references auth.users on delete cascade default auth.uid(),
  nickname text not null check (nickname ~ '^[[:alnum:]_.-]{2,24}$'),
  barrio_id smallint references barrios,
  created_at timestamptz not null default now()
);

create unique index profiles_nickname_key on profiles (lower(nickname));

-- Lets PostgREST embed author profiles. NOT VALID skips rows posted before profiles existed.
alter table articles add foreign key (submitted_by) references profiles not valid;
alter table article_context add foreign key (user_id) references profiles not valid;

alter table barrios enable row level security;
alter table profiles enable row level security;

create policy "barrios are public" on barrios for select using (true);

create policy "profiles are public" on profiles for select using (true);
-- Anonymous users can vote but not claim a nickname.
create policy "members create own profile" on profiles for insert to authenticated
  with check (id = (select auth.uid()) and not coalesce(((select auth.jwt()) ->> 'is_anonymous')::boolean, false));
create policy "members update own profile" on profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Posting requires a profile, which also rules out anonymous users.
drop policy "signed-in users submit articles" on articles;
create policy "members submit articles" on articles for insert to authenticated
  with check (submitted_by = (select auth.uid()) and exists (select 1 from profiles where id = (select auth.uid())));

drop policy "users add context" on article_context;
create policy "members add context" on article_context for insert to authenticated
  with check (user_id = (select auth.uid()) and exists (select 1 from profiles where id = (select auth.uid())));
