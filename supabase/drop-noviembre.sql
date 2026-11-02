-- ============================================================
--  GymStreet · Drop de noviembre 2026
--  48 productos nuevos (239 unidades) del pedido del 29/oct/2026.
--  No incluye las fundas de teléfono: esas no son de la tienda.
--
--  CÓMO USARLO
--    1. Entrá a Supabase > SQL Editor > New query.
--    2. Pegá TODO este archivo y tocá Run.
--    3. Tiene que decir Success.
--
--  Se puede volver a correr sin duplicar nada: si el producto ya
--  existe (mismo SKU) se actualiza, no se crea otro. Las fotos NO
--  las toca, así que las que subas desde el panel no se borran.
-- ============================================================

-- ---------- Categorías (solo crea las que falten) ----------
insert into categories (slug, name, position) values
  ('camisas', 'Camisas', 1),
  ('pants', 'Pants', 2),
  ('shorts', 'Shorts', 3),
  ('mujer', 'Mujer', 4),
  ('accesorios', 'Accesorios', 5)
on conflict (slug) do nothing;

-- ---------- DROP26-01 · Camisa de Compresión Essential (15 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-01', 'Camisa de Compresión Essential', 'Camisa de compresión de manga corta. Tela elástica de secado rápido que se ajusta al cuerpo y aguanta la sesión completa.',
     (select id from categories where slug = 'camisas'),
     250, 134.18, 'available', true, 0,
     now() - interval '0 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'L', 'Gris oscuro', 1),
    (pid, 'M', 'Gris oscuro', 3),
    (pid, 'S', 'Gris oscuro', 1),
    (pid, 'L', 'Gris', 1),
    (pid, 'M', 'Gris', 3),
    (pid, 'S', 'Gris', 1),
    (pid, 'L', 'Negro', 1),
    (pid, 'M', 'Negro', 3),
    (pid, 'S', 'Negro', 1)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-02 · Tank de Compresión Dry-Fit (15 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-02', 'Tank de Compresión Dry-Fit', 'Camiseta sin mangas de compresión, muy elástica y de secado rápido. Ajuste al cuerpo, ideal para gimnasio y días de calor.',
     (select id from categories where slug = 'camisas'),
     250, 120.45, 'available', true, 0,
     now() - interval '1 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'L', 'Negro / Gris claro', 1),
    (pid, 'M', 'Negro / Gris claro', 3),
    (pid, 'S', 'Negro / Gris claro', 1),
    (pid, 'L', 'Negro / Gris oscuro', 1),
    (pid, 'M', 'Negro / Gris oscuro', 3),
    (pid, 'S', 'Negro / Gris oscuro', 1),
    (pid, 'L', 'Negro / Rojo', 1),
    (pid, 'M', 'Negro / Rojo', 3),
    (pid, 'S', 'Negro / Rojo', 1)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-03 · Camisa Manga Larga BFC (12 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-03', 'Camisa Manga Larga BFC', 'Camisa de compresión de manga larga. Alta elasticidad, abriga sin dar calor y sirve como capa base.',
     (select id from categories where slug = 'camisas'),
     275, 136.64, 'available', true, 0,
     now() - interval '2 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'L', 'Negro', 1),
    (pid, 'M', 'Negro', 2),
    (pid, 'S', 'Negro', 1),
    (pid, 'L', 'Blanco', 1),
    (pid, 'M', 'Blanco', 2),
    (pid, 'S', 'Blanco', 1),
    (pid, 'L', 'Gris', 1),
    (pid, 'M', 'Gris', 2),
    (pid, 'S', 'Gris', 1)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-04 · Camisa de Compresión Emblema (9 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-04', 'Camisa de Compresión Emblema', 'Camisa de compresión de secado rápido con estampado de emblema oscuro. Corte entallado de manga corta.',
     (select id from categories where slug = 'camisas'),
     250, 126.31, 'available', false, 0,
     now() - interval '3 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'L', 'Azul', 1),
    (pid, 'M', 'Azul', 2),
    (pid, 'S', 'Azul', 1),
    (pid, 'L', 'Negro', 1),
    (pid, 'M', 'Negro', 3),
    (pid, 'S', 'Negro', 1)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-05 · Camisa de Compresión Estampada (8 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-05', 'Camisa de Compresión Estampada', 'Camisa de compresión de manga corta con estampado a dos tonos. Secado rápido y ajuste firme.',
     (select id from categories where slug = 'camisas'),
     275, 131.72, 'available', false, 0,
     now() - interval '4 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'L', 'Negro / Púrpura', 1),
    (pid, 'M', 'Negro / Púrpura', 3),
    (pid, 'S', 'Negro / Púrpura', 1),
    (pid, 'L', 'Negro / Rojo', 1),
    (pid, 'M', 'Negro / Rojo', 1),
    (pid, 'S', 'Negro / Rojo', 1)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-06 · Camisa Shark ONYX 5.0 (8 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-06', 'Camisa Shark ONYX 5.0', 'Camisa de manga corta con estampado de tiburón. Tela técnica elástica, corte deportivo. Tallas asiáticas: quedan más pequeñas que las de acá. Si dudás entre dos, pedí la más grande.',
     (select id from categories where slug = 'camisas'),
     250, 101.26, 'available', false, 0,
     now() - interval '5 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'XL', 'Negro / Rojo', 1),
    (pid, 'L', 'Negro / Rojo', 2),
    (pid, 'M', 'Negro / Rojo', 1),
    (pid, 'XL', 'Negro', 1),
    (pid, 'L', 'Negro', 2),
    (pid, 'M', 'Negro', 1)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-07 · Camisa de Compresión Gótica (5 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-07', 'Camisa de Compresión Gótica', 'Camisa de compresión con estampado gótico. Tela de secado rápido y alta elasticidad, corte entallado.',
     (select id from categories where slug = 'camisas'),
     275, 127.01, 'available', false, 0,
     now() - interval '6 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'L', 'Negro / Blanco / Rojo', 1),
    (pid, 'M', 'Negro / Blanco / Rojo', 3),
    (pid, 'S', 'Negro / Blanco / Rojo', 1)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-08 · Camisa Elástica Geométrica (5 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-08', 'Camisa Elástica Geométrica', 'Camisa elástica con estampado geométrico. Tejido transpirable que absorbe el sudor, ideal para correr.',
     (select id from categories where slug = 'camisas'),
     250, 157.01, 'available', false, 0,
     now() - interval '7 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'L', 'Rojo', 1),
    (pid, 'M', 'Rojo', 3),
    (pid, 'S', 'Rojo', 1)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-09 · Tank Tribal Gótico (3 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-09', 'Tank Tribal Gótico', 'Camiseta sin mangas de corte ajustado con gráfico tribal gótico. Tela elástica y transpirable para entrenos de fuerza.',
     (select id from categories where slug = 'camisas'),
     250, 86.94, 'available', false, 0,
     now() - interval '8 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'XL', 'Negro', 1),
    (pid, 'M', 'Negro', 1),
    (pid, 'S', 'Negro', 1)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-10 · Camisa Manga Larga Compresión (2 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-10', 'Camisa Manga Larga Compresión', 'Camisa de compresión de manga larga y secado rápido. Moldea el torso y sirve como capa base. Tallas asiáticas: quedan más pequeñas que las de acá. Si dudás entre dos, pedí la más grande.',
     (select id from categories where slug = 'camisas'),
     250, 102.23, 'available', false, 0,
     now() - interval '9 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'L', 'Negro', 1),
    (pid, 'M', 'Negro', 1)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-11 · Tank Letras Casual (1 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-11', 'Tank Letras Casual', 'Camiseta de tirantes con estampado de letras. Tela elástica, corte casual para entrenar o salir.',
     (select id from categories where slug = 'camisas'),
     225, 80.84, 'available', false, 0,
     now() - interval '10 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'M', 'Negro', 1)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-12 · Tank Animal Print (1 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-12', 'Tank Animal Print', 'Camiseta sin mangas de verano con estampado animal. Pensada para entrenar fuerza y jugar baloncesto.',
     (select id from categories where slug = 'camisas'),
     225, 68.1, 'available', false, 0,
     now() - interval '11 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'XL', 'Negro', 1)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-13 · Pants Chándal Letras (2 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-13', 'Pants Chándal Letras', 'Pantalón de chándal de corte recto con grafismo de letras y cintura con cordón.',
     (select id from categories where slug = 'pants'),
     350, 203.0, 'available', false, 0,
     now() - interval '12 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'L', 'Azul marino', 1),
    (pid, 'M', 'Negro', 1)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-14 · Pants Dragón Chino (1 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-14', 'Pants Dragón Chino', 'Pantalón deportivo con estampado de dragón estilo chino. Corte recto, cintura con cordón ajustable.',
     (select id from categories where slug = 'pants'),
     275, 112.42, 'available', false, 0,
     now() - interval '13 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'M', 'Rojo', 1)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-15 · Pants Dark Print (1 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-15', 'Pants Dark Print', 'Pantalón casual de estilo oscuro en tejido de punto holgado, con cordón ajustable.',
     (select id from categories where slug = 'pants'),
     300, 174.5, 'available', false, 0,
     now() - interval '14 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'M', 'Negro', 1)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-16 · Pants Deportivo Casual (1 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-16', 'Pants Deportivo Casual', 'Pantalón deportivo casual de corte recto. Cae bien dentro y fuera del gimnasio.',
     (select id from categories where slug = 'pants'),
     325, 182.53, 'available', false, 0,
     now() - interval '15 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'M', 'Negro', 1)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-17 · Pants Espada Samurái (1 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-17', 'Pants Espada Samurái', 'Pantalón deportivo largo con estampado de espada samurái y pierna ancha.',
     (select id from categories where slug = 'pants'),
     350, 189.71, 'available', false, 0,
     now() - interval '16 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'M', 'Negro', 1)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-18 · Pants Dragón Blanco (1 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-18', 'Pants Dragón Blanco', 'Pantalón de chándal con estampado de dragón blanco. Corte largo y cómodo.',
     (select id from categories where slug = 'pants'),
     350, 199.21, 'available', false, 0,
     now() - interval '17 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'M', 'Negro', 1)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-19 · Short Letras Deportivo (2 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-19', 'Short Letras Deportivo', 'Short deportivo con estampado de letras y cintura con cordón ajustable. Corte cómodo.',
     (select id from categories where slug = 'shorts'),
     250, 128.33, 'available', false, 0,
     now() - interval '18 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'L', 'Negro', 1),
    (pid, 'M', 'Negro', 1)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-20 · Short Dragón Verano (1 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-20', 'Short Dragón Verano', 'Short de verano con estampado de dragón y cintura de cordón ajustable. Fresco y liviano.',
     (select id from categories where slug = 'shorts'),
     225, 110.98, 'available', false, 0,
     now() - interval '19 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'M', 'Negro', 1)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-21 · Conjunto Deportivo 2 Piezas (2 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-21', 'Conjunto Deportivo 2 Piezas', 'Conjunto de dos piezas: top de manga corta y pantalón a juego. Tela elástica de compresión suave que marca sin apretar. Tallas asiáticas: quedan más pequeñas que las de acá. Si dudás entre dos, pedí la más grande.',
     (select id from categories where slug = 'mujer'),
     500, 229.32, 'available', false, 0,
     now() - interval '20 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'L', 'Negro', 1),
    (pid, 'M', 'Borgoña', 1)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-22 · Leggings Shark Compresión (2 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-22', 'Leggings Shark Compresión', 'Leggings de compresión con estampado geométrico de tiburón. Tiro alto y tela gruesa que no transparenta. Tallas asiáticas: quedan más pequeñas que las de acá. Si dudás entre dos, pedí la más grande.',
     (select id from categories where slug = 'mujer'),
     300, 160.83, 'available', false, 0,
     now() - interval '21 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'M', 'Oculto profundo', 1),
    (pid, 'M', 'Negro', 1)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-23 · Short Push Up de Entreno (2 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-23', 'Short Push Up de Entreno', 'Short deportivo de tiro alto con efecto levantamiento. Tela elástica que se ajusta sin marcar costuras.',
     (select id from categories where slug = 'mujer'),
     200, 58.86, 'available', false, 0,
     now() - interval '22 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'M', 'Durazno', 2)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-24 · Collar Gótico Murciélago (6 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-24', 'Collar Gótico Murciélago', 'Colgante de murciélago con corazón, estilo gótico. Cadena incluida, largo ajustable. Pieza unisex.',
     (select id from categories where slug = 'accesorios'),
     125, 12.58, 'available', false, 0,
     now() - interval '23 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'Única', 'Rojo', 6)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-25 · Cadena Espada de Dragón (6 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-25', 'Cadena Espada de Dragón', 'Colgante de espada de dragón en acero inoxidable con piedras incrustadas. Cadena incluida.',
     (select id from categories where slug = 'accesorios'),
     150, 26.85, 'available', false, 0,
     now() - interval '24 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'Única', 'Rojo / Negro', 6)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-26 · Collar Murciélago Esmaltado (6 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-26', 'Collar Murciélago Esmaltado', 'Colgante de murciélago en aleación de zinc con esmaltado al goteo, estilo gótico vintage. Cadena incluida.',
     (select id from categories where slug = 'accesorios'),
     125, 18.0, 'available', false, 0,
     now() - interval '25 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'Única', 'Negro', 6)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-27 · Llavero Musculoso (6 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-27', 'Llavero Musculoso', 'Llavero de aleación de zinc con figura musculosa. Buen detalle de regalo para quien entrena.',
     (select id from categories where slug = 'accesorios'),
     100, 11.66, 'available', false, 0,
     now() - interval '26 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'Única', 'Único', 6)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-28 · Collar Moto Clásica (6 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-28', 'Collar Moto Clásica', 'Collar con colgante de motocicleta en aleación, acabado plata antigua. Unisex, cadena incluida.',
     (select id from categories where slug = 'accesorios'),
     125, 17.37, 'available', false, 0,
     now() - interval '27 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'Única', 'Plata antigua', 6)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-29 · Collar Casco de Moto 3D (6 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-29', 'Collar Casco de Moto 3D', 'Colgante de casco de motocicleta en 3D con acabado metálico. Cadena incluida.',
     (select id from categories where slug = 'accesorios'),
     125, 23.78, 'available', false, 0,
     now() - interval '28 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'Única', 'Dorado claro', 6)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-30 · Collar Subfusil Hip-Hop (6 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-30', 'Collar Subfusil Hip-Hop', 'Colgante estilo hip-hop con pedrería. Cadena incluida, pieza unisex.',
     (select id from categories where slug = 'accesorios'),
     125, 16.83, 'available', false, 0,
     now() - interval '29 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'Única', 'Plateado', 6)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-31 · Collar AK-47 (6 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-31', 'Collar AK-47', 'Colgante estilo punk rock con acabado dorado. Cadena incluida, pieza unisex.',
     (select id from categories where slug = 'accesorios'),
     150, 24.63, 'available', false, 0,
     now() - interval '30 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'Única', 'Dorado', 6)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-32 · Collar Pistola Retorcida (6 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-32', 'Collar Pistola Retorcida', 'Colgante en dos tonos con acabado plateado. Cadena incluida.',
     (select id from categories where slug = 'accesorios'),
     150, 18.99, 'available', false, 0,
     now() - interval '31 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'Única', 'Plateado', 6)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-33 · Colgante Anime Hip-Hop (6 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-33', 'Colgante Anime Hip-Hop', 'Colgante de acero inoxidable estilo hip-hop con detalle anime. Cadena incluida.',
     (select id from categories where slug = 'accesorios'),
     125, 23.72, 'available', false, 0,
     now() - interval '32 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'Única', 'Rojo', 6)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-34 · Collar Geométrico Minimal (6 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-34', 'Collar Geométrico Minimal', 'Collar de diseño geométrico, acabado plateado. Limpio y fácil de combinar con todo.',
     (select id from categories where slug = 'accesorios'),
     125, 16.21, 'available', false, 0,
     now() - interval '33 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'Única', 'Plateado', 6)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-35 · Collar Carácter Chino (6 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-35', 'Collar Carácter Chino', 'Collar de acero inoxidable con colgante de carácter chino. Unisex, cadena incluida.',
     (select id from categories where slug = 'accesorios'),
     100, 18.14, 'available', false, 0,
     now() - interval '34 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'Única', 'Plateado', 6)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-36 · Colgante Cruz Retro (6 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-36', 'Colgante Cruz Retro', 'Colgante de cruz en acero inoxidable, diseño retro para uso diario. Cadena incluida.',
     (select id from categories where slug = 'accesorios'),
     100, 19.96, 'available', false, 0,
     now() - interval '35 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'Única', 'Plateado', 6)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-37 · Pulsera San Benito (6 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-37', 'Pulsera San Benito', 'Pulsera con medalla de San Benito en aleación de zinc, acabado dorado.',
     (select id from categories where slug = 'accesorios'),
     125, 21.31, 'available', false, 0,
     now() - interval '36 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'Única', 'Dorado', 6)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-38 · Collar Medalla San Benito (6 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-38', 'Collar Medalla San Benito', 'Collar vintage con medalla jubilar de San Benito. Unisex, cadena incluida.',
     (select id from categories where slug = 'accesorios'),
     125, 17.52, 'available', false, 0,
     now() - interval '37 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'Única', 'Plateado', 6)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-39 · Pulseras Cruz (par) (6 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-39', 'Pulseras Cruz (par)', 'Par de pulseras ajustables de cuerda con cruz y cierre magnético. Ideal para parejas.',
     (select id from categories where slug = 'accesorios'),
     100, 17.53, 'available', false, 0,
     now() - interval '38 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'Única', 'Único', 6)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-40 · Pulsera Cruz 18K (6 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-40', 'Pulsera Cruz 18K', 'Pulsera de cruz en acero inoxidable 304 con baño de oro de 18K. Cierre ajustable.',
     (select id from categories where slug = 'accesorios'),
     100, 15.52, 'available', false, 0,
     now() - interval '39 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'Única', 'Plateado', 6)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-41 · Pulsera Doble Cadena Cruz (6 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-41', 'Pulsera Doble Cadena Cruz', 'Pulsera de doble cadena con cruz calada, en acero inoxidable 304. Acabado plateado.',
     (select id from categories where slug = 'accesorios'),
     100, 14.67, 'available', false, 0,
     now() - interval '40 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'Única', 'Plateado', 6)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-42 · Collar Cruz de Llama (6 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-42', 'Collar Cruz de Llama', 'Collar con cruz de llama, acabado plata antigua. Cadena incluida.',
     (select id from categories where slug = 'accesorios'),
     100, 17.44, 'available', false, 0,
     now() - interval '41 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'Única', 'Plata antigua', 6)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-43 · Collar Mancuerna Fitness (6 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-43', 'Collar Mancuerna Fitness', 'Collar con colgante de mancuerna en aleación de titanio, acabado negro. No se destiñe con el uso.',
     (select id from categories where slug = 'accesorios'),
     150, 27.37, 'available', false, 0,
     now() - interval '42 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'Única', 'Negro', 6)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-44 · Collar Barra de Mancuerna (6 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-44', 'Collar Barra de Mancuerna', 'Collar con colgante de barra de mancuerna en aleación, acabado plateado. Para quien vive el gimnasio.',
     (select id from categories where slug = 'accesorios'),
     150, 26.33, 'available', false, 0,
     now() - interval '43 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'Única', 'Plateado', 6)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-45 · Collar Calavera Hip-Hop (6 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-45', 'Collar Calavera Hip-Hop', 'Collar con colgante de calavera, estilo hip-hop retro. Acabado plata antigua.',
     (select id from categories where slug = 'accesorios'),
     100, 17.52, 'available', false, 0,
     now() - interval '44 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'Única', 'Plata antigua', 6)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-46 · Collar Tacos de Fútbol (3 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-46', 'Collar Tacos de Fútbol', 'Set de 2 collares con colgante de zapatilla de fútbol, estilo callejero. Cadena incluida.',
     (select id from categories where slug = 'accesorios'),
     200, 38.77, 'available', false, 0,
     now() - interval '45 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'Única', 'Único', 3)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-47 · Collar Moto 3D Zirconia (3 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-47', 'Collar Moto 3D Zirconia', 'Colgante de motocicleta en 3D con zirconia, estilo hip-hop. Cadena incluida.',
     (select id from categories where slug = 'accesorios'),
     175, 31.25, 'available', false, 0,
     now() - interval '46 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'Única', 'Dorado', 3)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- DROP26-48 · Colgante Cruz Minimal (1 u.) ----------
do $$
declare pid uuid;
begin
  insert into products
    (sku, name, description, category_id, price, cost, status, featured, position, created_at)
  values
    ('DROP26-48', 'Colgante Cruz Minimal', 'Colgante de cruz en acero inoxidable, línea minimalista. Cadena incluida.',
     (select id from categories where slug = 'accesorios'),
     100, 21.69, 'available', false, 0,
     now() - interval '47 seconds')
  on conflict (sku) do update set
    name        = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    price       = excluded.price,
    cost        = excluded.cost,
    featured    = excluded.featured,
    updated_at  = now()
  returning id into pid;

  insert into product_variants (product_id, size, color, stock) values
    (pid, 'Única', 'Único', 1)
  on conflict (product_id, size, color) do update set stock = excluded.stock;
end $$;

-- ---------- Listo ----------
-- Para revisar lo que quedó:
--   select sku, name, price, product_stock(id) as stock
--   from products where sku like 'DROP26-%' order by sku;
