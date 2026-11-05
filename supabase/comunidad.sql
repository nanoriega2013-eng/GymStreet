-- ============================================================
--  GymStreet · Fotos de la comunidad
--  Pegá TODO este archivo en Supabase > SQL Editor > Run.
--  Se puede volver a correr sin romper nada ni duplicar fotos.
--
--  Esto crea la tabla donde se guardan las fotos de clientes que
--  salen en la pestaña "Comunidad" de la tienda, y deja que las
--  subas desde el panel de administración.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---- La tabla ----
create table if not exists community_photos (
  id         uuid primary key default gen_random_uuid(),
  caption    text not null default '',           -- "Gracias por tu compra @usuario"
  images     jsonb not null default '[]'::jsonb, -- ["url1","url2"]; la primera es la portada
  position   int  not null default 0,            -- menor aparece antes
  visible    boolean not null default true,      -- false = guardada pero sin publicar
  created_at timestamptz not null default now()
);

create index if not exists community_photos_visible_idx
  on community_photos(visible, position);

-- ---- Permisos ----
alter table community_photos enable row level security;

revoke all on community_photos from anon, authenticated;

-- el público solo lee lo publicado, y nunca la columna "visible"
grant select (id, caption, images, position, created_at)
  on community_photos to anon, authenticated;
grant all on community_photos to authenticated;

drop policy if exists community_public_read on community_photos;
create policy community_public_read on community_photos
  for select to anon, authenticated using (visible);

drop policy if exists community_admin on community_photos;
create policy community_admin on community_photos
  for all to authenticated using (is_admin()) with check (is_admin());

-- ---- Las fotos que ya tenía la página ----
-- Solo entran si la tabla está vacía, para no duplicarlas si volvés
-- a correr este archivo.
insert into community_photos (caption, images, position)
select * from (values
  ('Gracias por tu compra @sebas07_mendoza',
   '["img/23a34112-419c-497d-9453-d78c11cb6663.jpg","img/f76c6c72-0e09-4ced-8565-4f68c5493420.jpg"]'::jsonb, 1),
  ('Gracias por tu compra @alejandro_w23',
   '["img/08324a9e-56ff-421b-94ba-828061d19321.jpg"]'::jsonb, 2),
  ('Gracias por tu compra @danierxlas_cs',
   '["img/8fd3f3ce-6e9e-4681-869a-e0d5e104e227.jpg"]'::jsonb, 3),
  ('Gracias por tu compra @d_ledif_19',
   '["img/WhatsAppImage2025-12-03at5.10.50 PM.jpeg"]'::jsonb, 4),
  ('Gracias por tu compra @dylan_alfaro',
   '["img/2b5ba153-2d9a-4152-9f12-68de41b62c02.jpg"]'::jsonb, 5),
  ('Gracias por tu compra 💪',
   '["img/cliente-6.jpg"]'::jsonb, 6),
  ('"Lujo de ropa 🔥🔥" — gracias por etiquetarnos',
   '["img/cliente-7.jpg"]'::jsonb, 7)
) as v(caption, images, position)
where not exists (select 1 from community_photos);

-- ============================================================
--  Listo. Entrá a admin.html > Comunidad y subí las fotos nuevas.
-- ============================================================
