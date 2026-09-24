-- Places now span the Àrea Metropolitana: Barcelona by barrio, the other 35 municipalities whole.
alter table barrios
  add column municipality text not null default 'Barcelona',
  alter column district drop not null;

insert into barrios (id, name, district, municipality) values
  (101, 'Badalona', null, 'Badalona'),
  (102, 'Badia del Vallès', null, 'Badia del Vallès'),
  (103, 'Barberà del Vallès', null, 'Barberà del Vallès'),
  (104, 'Begues', null, 'Begues'),
  (105, 'Castellbisbal', null, 'Castellbisbal'),
  (106, 'Castelldefels', null, 'Castelldefels'),
  (107, 'Cerdanyola del Vallès', null, 'Cerdanyola del Vallès'),
  (108, 'Cervelló', null, 'Cervelló'),
  (109, 'Corbera de Llobregat', null, 'Corbera de Llobregat'),
  (110, 'Cornellà de Llobregat', null, 'Cornellà de Llobregat'),
  (111, 'Esplugues de Llobregat', null, 'Esplugues de Llobregat'),
  (112, 'Gavà', null, 'Gavà'),
  (113, 'L''Hospitalet de Llobregat', null, 'L''Hospitalet de Llobregat'),
  (114, 'Molins de Rei', null, 'Molins de Rei'),
  (115, 'Montcada i Reixac', null, 'Montcada i Reixac'),
  (116, 'Montgat', null, 'Montgat'),
  (117, 'El Papiol', null, 'El Papiol'),
  (118, 'Pallejà', null, 'Pallejà'),
  (119, 'La Palma de Cervelló', null, 'La Palma de Cervelló'),
  (120, 'El Prat de Llobregat', null, 'El Prat de Llobregat'),
  (121, 'Ripollet', null, 'Ripollet'),
  (122, 'Sant Adrià de Besòs', null, 'Sant Adrià de Besòs'),
  (123, 'Sant Andreu de la Barca', null, 'Sant Andreu de la Barca'),
  (124, 'Sant Boi de Llobregat', null, 'Sant Boi de Llobregat'),
  (125, 'Sant Climent de Llobregat', null, 'Sant Climent de Llobregat'),
  (126, 'Sant Cugat del Vallès', null, 'Sant Cugat del Vallès'),
  (127, 'Sant Feliu de Llobregat', null, 'Sant Feliu de Llobregat'),
  (128, 'Sant Joan Despí', null, 'Sant Joan Despí'),
  (129, 'Sant Just Desvern', null, 'Sant Just Desvern'),
  (130, 'Sant Vicenç dels Horts', null, 'Sant Vicenç dels Horts'),
  (131, 'Santa Coloma de Cervelló', null, 'Santa Coloma de Cervelló'),
  (132, 'Santa Coloma de Gramenet', null, 'Santa Coloma de Gramenet'),
  (133, 'Tiana', null, 'Tiana'),
  (134, 'Torrelles de Llobregat', null, 'Torrelles de Llobregat'),
  (135, 'Viladecans', null, 'Viladecans');

-- Where the voter lived when they voted; guests pick it on their first vote, members inherit their profile's.
alter table votes add column barrio_id smallint references barrios;
