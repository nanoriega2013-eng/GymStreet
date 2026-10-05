-- ============================================================
--  GymStreet · Esquema de base de datos
--  Pegar TODO este archivo en Supabase > SQL Editor > Run.
--  Se puede volver a correr sin romper nada.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. ADMINISTRADORES
--    Solo los usuarios listados aquí pueden tocar el panel.
--    Después de crear tu usuario en Authentication, corré:
--      insert into admin_users (user_id)
--      select id from auth.users where email = 'TU-CORREO';
-- ------------------------------------------------------------
create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;

-- ------------------------------------------------------------
-- 2. CATEGORÍAS
-- ------------------------------------------------------------
create table if not exists categories (
  id        uuid primary key default gen_random_uuid(),
  slug      text unique not null,
  name      text not null,
  position  int  not null default 0,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. PRODUCTOS
-- ------------------------------------------------------------
create table if not exists products (
  id            uuid primary key default gen_random_uuid(),
  sku           text unique,
  name          text not null,
  description   text not null default '',
  category_id   uuid references categories(id) on delete set null,
  price         numeric(10,2) not null check (price >= 0),           -- precio normal
  sale_price    numeric(10,2) check (sale_price >= 0),               -- precio de oferta (null = sin oferta)
  cost          numeric(10,2) not null default 0 check (cost >= 0),  -- costo (solo lo ve el admin)
  status        text not null default 'available'
                check (status in ('available','sold_out','hidden')),
  featured      boolean not null default false,
  position      int not null default 0,
  low_stock_threshold int not null default 3,
  sold_count    int not null default 0 check (sold_count >= 0),
  images        jsonb not null default '[]'::jsonb,                  -- ["url1","url2"]
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint sale_price_menor check (sale_price is null or sale_price < price)
);

create index if not exists products_category_idx on products(category_id);
create index if not exists products_status_idx   on products(status);

-- ------------------------------------------------------------
-- 4. VARIANTES (inventario por talla y color)
-- ------------------------------------------------------------
create table if not exists product_variants (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  size       text not null default 'Única',
  color      text not null default 'Único',
  stock      int  not null default 0 check (stock >= 0),   -- nunca negativo
  sku        text,
  unique (product_id, size, color)
);

create index if not exists variants_product_idx on product_variants(product_id);

-- stock total de un producto, calculado desde sus variantes
create or replace function product_stock(p_product_id uuid)
returns int
language sql
stable
as $$
  select coalesce(sum(stock), 0)::int from product_variants where product_id = p_product_id;
$$;

-- ------------------------------------------------------------
-- 5. CLIENTES
-- ------------------------------------------------------------
create table if not exists customers (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  phone        text not null,
  whatsapp     text,
  department   text,
  municipality text,
  address      text,
  reference    text,
  created_at   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 6. PEDIDOS
-- ------------------------------------------------------------
create sequence if not exists order_number_seq start 1;

create table if not exists orders (
  id            uuid primary key default gen_random_uuid(),
  order_number  bigint not null unique default nextval('order_number_seq'),
  customer_id   uuid references customers(id) on delete set null,

  -- copia de los datos del cliente (para que el pedido no cambie si el cliente se edita)
  customer_name     text not null,
  customer_phone    text not null,
  customer_whatsapp text,
  department        text,
  municipality      text,
  address           text,
  reference         text,
  receiver          text,
  payment_method    text,
  notes             text,

  subtotal  numeric(10,2) not null default 0,
  shipping  numeric(10,2) not null default 0,
  total     numeric(10,2) not null default 0,

  status text not null default 'nuevo'
         check (status in ('nuevo','pendiente','confirmado','preparando','enviado','entregado','cancelado')),

  stock_applied boolean not null default false,  -- si ya se descontó del inventario
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists orders_status_idx  on orders(status);
create index if not exists orders_created_idx on orders(created_at desc);

create table if not exists order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  product_id   uuid references products(id) on delete set null,
  variant_id   uuid references product_variants(id) on delete set null,
  product_name text not null,   -- copia, por si el producto se borra
  sku          text,
  size         text,
  color        text,
  qty          int not null check (qty > 0),
  unit_price   numeric(10,2) not null,
  subtotal     numeric(10,2) not null,
  image        text
);

create index if not exists order_items_order_idx on order_items(order_id);

-- ------------------------------------------------------------
-- 7. CONFIGURACIÓN (una sola fila)
-- ------------------------------------------------------------
create table if not exists settings (
  id                 int primary key default 1 check (id = 1),
  store_name         text not null default 'GymStreet',
  logo_url           text,
  whatsapp_number    text not null default '50247176818',
  shipping_price     numeric(10,2) not null default 35,
  free_shipping_from numeric(10,2),             -- null = nunca gratis
  instagram_url      text default 'https://www.instagram.com/gymstreet.gt',
  facebook_url       text,
  store_address      text,
  whatsapp_intro     text default '🛍️ NUEVO PEDIDO',
  payment_methods    jsonb not null default '["Pago contra entrega","Transferencia","Depósito bancario"]'::jsonb,
  low_stock_threshold int not null default 3,
  updated_at         timestamptz not null default now()
);

insert into settings (id) values (1) on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 8. updated_at automático
-- ------------------------------------------------------------
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists products_touch on products;
create trigger products_touch before update on products
  for each row execute function touch_updated_at();

drop trigger if exists orders_touch on orders;
create trigger orders_touch before update on orders
  for each row execute function touch_updated_at();

-- ------------------------------------------------------------
-- 9. CREAR PEDIDO
--    Lo llama el cliente desde la tienda. Es SECURITY DEFINER:
--    los precios y el total se calculan AQUÍ, leyendo la tabla
--    products, nunca se confía en lo que manda el navegador.
-- ------------------------------------------------------------
create or replace function create_order(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cust     jsonb := coalesce(payload->'customer', '{}'::jsonb);
  v_items    jsonb := coalesce(payload->'items', '[]'::jsonb);
  v_item     jsonb;
  v_variant  product_variants;
  v_product  products;
  v_settings settings;
  v_order    orders;
  v_customer_id uuid;
  v_price    numeric(10,2);
  v_qty      int;
  v_subtotal numeric(10,2) := 0;
  v_shipping numeric(10,2) := 0;
  v_items_out jsonb := '[]'::jsonb;
begin
  if jsonb_array_length(v_items) = 0 then
    raise exception 'El pedido no tiene productos.';
  end if;
  if coalesce(trim(v_cust->>'name'), '') = '' then
    raise exception 'Falta el nombre del cliente.';
  end if;
  if coalesce(trim(v_cust->>'phone'), '') = '' then
    raise exception 'Falta el teléfono del cliente.';
  end if;

  select * into v_settings from settings where id = 1;

  insert into customers (name, phone, whatsapp, department, municipality, address, reference)
  values (trim(v_cust->>'name'), trim(v_cust->>'phone'), v_cust->>'whatsapp',
          v_cust->>'department', v_cust->>'municipality', v_cust->>'address', v_cust->>'reference')
  returning id into v_customer_id;

  insert into orders (customer_id, customer_name, customer_phone, customer_whatsapp,
                      department, municipality, address, reference, receiver,
                      payment_method, notes)
  values (v_customer_id, trim(v_cust->>'name'), trim(v_cust->>'phone'), v_cust->>'whatsapp',
          v_cust->>'department', v_cust->>'municipality', v_cust->>'address',
          v_cust->>'reference', v_cust->>'receiver',
          v_cust->>'payment_method', v_cust->>'notes')
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(v_items) loop
    v_qty := greatest(coalesce((v_item->>'qty')::int, 0), 0);
    if v_qty = 0 then
      raise exception 'Cantidad inválida en el pedido.';
    end if;

    select * into v_variant from product_variants
      where id = (v_item->>'variant_id')::uuid;
    if not found then
      raise exception 'Una de las prendas ya no existe.';
    end if;

    select * into v_product from products where id = v_variant.product_id;
    if v_product.status <> 'available' then
      raise exception 'El producto "%" ya no está disponible.', v_product.name;
    end if;
    if v_qty > v_variant.stock then
      raise exception 'Solo quedan % de "%" en talla % color %.',
        v_variant.stock, v_product.name, v_variant.size, v_variant.color;
    end if;

    -- el precio sale de la base de datos, no del navegador
    v_price := coalesce(v_product.sale_price, v_product.price);

    insert into order_items (order_id, product_id, variant_id, product_name, sku,
                             size, color, qty, unit_price, subtotal, image)
    values (v_order.id, v_product.id, v_variant.id, v_product.name,
            coalesce(v_variant.sku, v_product.sku),
            v_variant.size, v_variant.color, v_qty, v_price, v_price * v_qty,
            nullif(v_product.images->>0, ''));

    v_subtotal := v_subtotal + (v_price * v_qty);

    v_items_out := v_items_out || jsonb_build_object(
      'name', v_product.name, 'size', v_variant.size, 'color', v_variant.color,
      'qty', v_qty, 'unit_price', v_price, 'subtotal', v_price * v_qty);
  end loop;

  v_shipping := coalesce(v_settings.shipping_price, 0);
  if v_settings.free_shipping_from is not null
     and v_subtotal >= v_settings.free_shipping_from then
    v_shipping := 0;
  end if;

  update orders
     set subtotal = v_subtotal,
         shipping = v_shipping,
         total    = v_subtotal + v_shipping
   where id = v_order.id
  returning * into v_order;

  return jsonb_build_object(
    'id', v_order.id,
    'order_number', v_order.order_number,
    'subtotal', v_order.subtotal,
    'shipping', v_order.shipping,
    'total', v_order.total,
    'items', v_items_out
  );
end; $$;

revoke all on function create_order(jsonb) from public;
grant execute on function create_order(jsonb) to anon, authenticated;

-- ------------------------------------------------------------
-- 10. STOCK: descontar al confirmar, devolver al cancelar
-- ------------------------------------------------------------
create or replace function apply_order_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders;
  r record;
begin
  if not is_admin() then raise exception 'No autorizado.'; end if;

  select * into v_order from orders where id = p_order_id;
  if not found then raise exception 'Pedido no encontrado.'; end if;
  if v_order.stock_applied then return; end if;   -- ya se descontó

  -- revisar que alcance ANTES de tocar nada
  for r in select oi.qty, oi.variant_id, oi.product_name, oi.size, oi.color,
                  coalesce(pv.stock, 0) as stock
             from order_items oi
             left join product_variants pv on pv.id = oi.variant_id
            where oi.order_id = p_order_id loop
    if r.variant_id is null then
      raise exception 'La prenda "%" ya no existe en el inventario.', r.product_name;
    end if;
    if r.qty > r.stock then
      raise exception 'No alcanza el stock de "%" (% / %): hay %, se piden %.',
        r.product_name, r.size, r.color, r.stock, r.qty;
    end if;
  end loop;

  update product_variants pv
     set stock = pv.stock - oi.qty
    from order_items oi
   where oi.order_id = p_order_id and pv.id = oi.variant_id;

  update products p
     set sold_count = p.sold_count + s.qty
    from (select product_id, sum(qty) as qty from order_items
           where order_id = p_order_id and product_id is not null
           group by product_id) s
   where p.id = s.product_id;

  update orders set stock_applied = true where id = p_order_id;
end; $$;

create or replace function revert_order_stock(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_order orders;
begin
  if not is_admin() then raise exception 'No autorizado.'; end if;

  select * into v_order from orders where id = p_order_id;
  if not found then raise exception 'Pedido no encontrado.'; end if;
  if not v_order.stock_applied then return; end if;   -- nunca se descontó

  update product_variants pv
     set stock = pv.stock + oi.qty
    from order_items oi
   where oi.order_id = p_order_id and pv.id = oi.variant_id;

  update products p
     set sold_count = greatest(p.sold_count - s.qty, 0)
    from (select product_id, sum(qty) as qty from order_items
           where order_id = p_order_id and product_id is not null
           group by product_id) s
   where p.id = s.product_id;

  update orders set stock_applied = false where id = p_order_id;
end; $$;

-- Cambiar estado. 'confirmado' descuenta, 'cancelado' devuelve.
create or replace function set_order_status(p_order_id uuid, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_order orders;
begin
  if not is_admin() then raise exception 'No autorizado.'; end if;
  if p_status not in ('nuevo','pendiente','confirmado','preparando','enviado','entregado','cancelado') then
    raise exception 'Estado inválido: %', p_status;
  end if;

  if p_status = 'cancelado' then
    perform revert_order_stock(p_order_id);
  elsif p_status in ('confirmado','preparando','enviado','entregado') then
    perform apply_order_stock(p_order_id);
  end if;

  update orders set status = p_status where id = p_order_id returning * into v_order;
  if not found then raise exception 'Pedido no encontrado.'; end if;

  return jsonb_build_object('id', v_order.id, 'status', v_order.status,
                            'stock_applied', v_order.stock_applied);
end; $$;

revoke all on function apply_order_stock(uuid)  from public;
revoke all on function revert_order_stock(uuid) from public;
revoke all on function set_order_status(uuid, text) from public;
grant execute on function apply_order_stock(uuid)      to authenticated;
grant execute on function revert_order_stock(uuid)     to authenticated;
grant execute on function set_order_status(uuid, text) to authenticated;

-- ------------------------------------------------------------
-- 11. SEGURIDAD (Row Level Security)
--     Regla general: el público solo LEE el catálogo.
--     Pedidos y clientes son invisibles para el público: se crean
--     únicamente a través de create_order(). El panel requiere
--     estar en la tabla admin_users.
-- ------------------------------------------------------------
alter table admin_users      enable row level security;
alter table categories       enable row level security;
alter table products         enable row level security;
alter table product_variants enable row level security;
alter table customers        enable row level security;
alter table orders           enable row level security;
alter table order_items      enable row level security;
alter table settings         enable row level security;

-- Partimos de cero: quitamos los permisos amplios que Supabase da por defecto
revoke all on admin_users, categories, products, product_variants,
              customers, orders, order_items, settings
  from anon, authenticated;

-- ---- Catálogo: lectura pública ----
-- Ojo: el público NO puede ver "cost" ni "sold_count" (datos del negocio).
grant select (id, sku, name, description, category_id, price, sale_price,
              status, featured, position, images, created_at)
  on products to anon, authenticated;
grant select (id, product_id, size, color, stock, sku)
  on product_variants to anon, authenticated;
grant select on categories to anon, authenticated;
grant select (id, store_name, logo_url, whatsapp_number, shipping_price,
              free_shipping_from, instagram_url, facebook_url, store_address,
              payment_methods)
  on settings to anon, authenticated;

-- ---- El admin puede todo ----
grant all on admin_users, categories, products, product_variants,
             customers, orders, order_items, settings
  to authenticated;

-- admin_users
drop policy if exists admin_users_read on admin_users;
create policy admin_users_read on admin_users
  for select to authenticated using (is_admin());

-- categories
drop policy if exists categories_public_read on categories;
create policy categories_public_read on categories
  for select to anon, authenticated using (true);
drop policy if exists categories_admin on categories;
create policy categories_admin on categories
  for all to authenticated using (is_admin()) with check (is_admin());

-- products: el público no ve los ocultos
drop policy if exists products_public_read on products;
create policy products_public_read on products
  for select to anon, authenticated using (status <> 'hidden');
drop policy if exists products_admin on products;
create policy products_admin on products
  for all to authenticated using (is_admin()) with check (is_admin());

-- variantes: solo las de productos visibles
drop policy if exists variants_public_read on product_variants;
create policy variants_public_read on product_variants
  for select to anon, authenticated
  using (exists (select 1 from products p
                  where p.id = product_id and p.status <> 'hidden'));
drop policy if exists variants_admin on product_variants;
create policy variants_admin on product_variants
  for all to authenticated using (is_admin()) with check (is_admin());

-- settings: lectura pública (número de WhatsApp, envío, redes)
drop policy if exists settings_public_read on settings;
create policy settings_public_read on settings
  for select to anon, authenticated using (true);
drop policy if exists settings_admin on settings;
create policy settings_admin on settings
  for all to authenticated using (is_admin()) with check (is_admin());

-- clientes y pedidos: SOLO el admin. El público nunca los lee ni escribe
-- directamente; los pedidos entran por create_order().
drop policy if exists customers_admin on customers;
create policy customers_admin on customers
  for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists orders_admin on orders;
create policy orders_admin on orders
  for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists order_items_admin on order_items;
create policy order_items_admin on order_items
  for all to authenticated using (is_admin()) with check (is_admin());

-- la secuencia del número de pedido la usa create_order (SECURITY DEFINER)
grant usage on sequence order_number_seq to anon, authenticated;

-- ------------------------------------------------------------
-- 12. FOTOGRAFÍAS (Supabase Storage)
--     Bucket público para lectura, escritura solo del admin.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "fotos lectura publica" on storage.objects;
create policy "fotos lectura publica" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'product-images');

drop policy if exists "fotos admin escribe" on storage.objects;
create policy "fotos admin escribe" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and is_admin());

drop policy if exists "fotos admin actualiza" on storage.objects;
create policy "fotos admin actualiza" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and is_admin());

drop policy if exists "fotos admin borra" on storage.objects;
create policy "fotos admin borra" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and is_admin());

-- ------------------------------------------------------------
-- 13. CATEGORÍAS INICIALES
-- ------------------------------------------------------------
insert into categories (slug, name, position) values
  ('camisas',    'Camisas',    1),
  ('pants',      'Pants',      2),
  ('oversize',   'Oversize',   3),
  ('shorts',     'Shorts',     4),
  ('hoodies',    'Hoodies',    5),
  ('accesorios', 'Accesorios', 6)
on conflict (slug) do nothing;

-- ============================================================
--  Listo. Ahora creá tu usuario en Authentication > Users y corré:
--
--    insert into admin_users (user_id)
--    select id from auth.users where email = 'TU-CORREO-AQUI';
--
-- ============================================================
