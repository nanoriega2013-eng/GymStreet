// ============================================================
//  GymStreet · Capa de datos (Supabase)
//  Todo lo que habla con la base de datos pasa por aquí.
// ============================================================
import { SUPABASE_URL, SUPABASE_ANON_KEY, isConfigured } from './config.js';

let _client = null;

/** Cliente de Supabase, o null si todavía no se configuraron las claves. */
export async function client() {
  if (!isConfigured()) return null;
  if (_client) return _client;
  const { createClient } = await import(
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
  );
  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _client;
}

export { isConfigured };

// El público solo puede leer estas columnas (ver schema.sql).
// "cost" y "sold_count" quedan fuera a propósito.
const PRODUCT_COLS =
  'id, sku, name, description, category_id, price, sale_price, status, featured, position, images, created_at';
const VARIANT_COLS = 'id, product_id, size, color, stock, sku';
const SETTINGS_COLS =
  'id, store_name, logo_url, whatsapp_number, shipping_price, free_shipping_from, instagram_url, facebook_url, store_address, payment_methods';

// ------------------------------------------------------------
//  Normalización: deja todos los productos con la misma forma,
//  vengan de la base de datos o del catálogo fijo de respaldo.
// ------------------------------------------------------------
export function normalize(row, categoriesById = {}) {
  const variants = (row.product_variants || row.variants || []).map(v => ({
    id: v.id,
    size: v.size,
    color: v.color,
    stock: Number(v.stock) || 0,
  }));
  const stock = variants.reduce((a, v) => a + v.stock, 0);
  const price = Number(row.price) || 0;
  const salePrice = row.sale_price == null ? null : Number(row.sale_price);
  const hasVariants = variants.length > 0;

  return {
    id: row.id,
    sku: row.sku || '',
    name: row.name,
    description: row.description || '',
    category: categoriesById[row.category_id]?.slug || row.category || 'otros',
    categoryName: categoriesById[row.category_id]?.name || row.categoryName || '',
    price,
    salePrice,
    // lo que realmente paga el cliente
    finalPrice: salePrice ?? price,
    discount: salePrice ? Math.round((1 - salePrice / price) * 100) : 0,
    status: row.status || 'available',
    featured: Boolean(row.featured),
    position: Number(row.position) || 0,
    images: Array.isArray(row.images) ? row.images : [],
    variants,
    stock,
    // agotado si lo marcaron así, o si hay variantes y todas están en cero
    soldOut: row.status === 'sold_out' || (hasVariants && stock === 0),
    sizes: [...new Set(variants.map(v => v.size))],
    colors: [...new Set(variants.map(v => v.color))],
  };
}

/** Stock de una combinación talla + color. */
export function variantStock(product, size, color) {
  const v = product.variants.find(x => x.size === size && x.color === color);
  return v ? v.stock : 0;
}

/** Busca el id de la variante para una combinación. */
export function findVariant(product, size, color) {
  return product.variants.find(x => x.size === size && x.color === color) || null;
}

// ------------------------------------------------------------
//  LECTURA PÚBLICA
// ------------------------------------------------------------
export async function getSettings() {
  const sb = await client();
  if (!sb) return null;
  const { data, error } = await sb.from('settings').select(SETTINGS_COLS).eq('id', 1).single();
  if (error) { console.warn('[GymStreet] settings:', error.message); return null; }
  return data;
}

export async function getCategories() {
  const sb = await client();
  if (!sb) return [];
  const { data, error } = await sb.from('categories').select('*').order('position');
  if (error) { console.warn('[GymStreet] categorías:', error.message); return []; }
  return data || [];
}

/** Catálogo completo con el inventario de cada talla y color. */
export async function getProducts() {
  const sb = await client();
  if (!sb) return null;
  const cats = await getCategories();
  const byId = Object.fromEntries(cats.map(c => [c.id, c]));

  const { data, error } = await sb
    .from('products')
    .select(`${PRODUCT_COLS}, product_variants(${VARIANT_COLS})`)
    .neq('status', 'hidden')
    .order('position')
    .order('created_at', { ascending: false });

  if (error) { console.warn('[GymStreet] productos:', error.message); return null; }
  return (data || []).map(r => normalize(r, byId));
}

// ------------------------------------------------------------
//  CREAR PEDIDO
//  Los precios y el total los calcula el servidor (ver create_order
//  en schema.sql). Acá solo mandamos qué variante y cuántas.
// ------------------------------------------------------------
export async function createOrder({ customer, items }) {
  const sb = await client();
  if (!sb) throw new Error('La tienda todavía no está conectada a la base de datos.');

  const { data, error } = await sb.rpc('create_order', {
    payload: {
      customer,
      items: items.map(i => ({ variant_id: i.variantId, qty: i.qty })),
    },
  });
  if (error) throw new Error(error.message);
  return data;
}

// ------------------------------------------------------------
//  AUTENTICACIÓN (panel de administración)
// ------------------------------------------------------------
export async function signIn(email, password) {
  const sb = await client();
  if (!sb) throw new Error('Falta configurar Supabase en assets/js/config.js');
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data.user;
}

export async function signOut() {
  const sb = await client();
  if (sb) await sb.auth.signOut();
}

export async function currentUser() {
  const sb = await client();
  if (!sb) return null;
  const { data } = await sb.auth.getUser();
  return data?.user || null;
}

/** ¿El usuario que inició sesión está en la tabla admin_users? */
export async function isAdmin() {
  const sb = await client();
  if (!sb) return false;
  const { data, error } = await sb.rpc('is_admin');
  if (error) { console.warn('[GymStreet] is_admin:', error.message); return false; }
  return Boolean(data);
}

// ============================================================
//  ADMINISTRACIÓN
//  Todo lo de abajo exige sesión iniciada y estar en admin_users.
//  Si alguien llama a esto sin permiso, Postgres lo rechaza.
// ============================================================

export async function adminGetProducts() {
  const sb = await client();
  const cats = await getCategories();
  const byId = Object.fromEntries(cats.map(c => [c.id, c]));
  const { data, error } = await sb
    .from('products')
    .select('*, product_variants(*)')
    .order('position')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(r => ({
    ...normalize(r, byId),
    cost: Number(r.cost) || 0,
    soldCount: Number(r.sold_count) || 0,
    lowStockThreshold: Number(r.low_stock_threshold) || 3,
    categoryId: r.category_id,
    rawStatus: r.status,
  }));
}

/** Crea o actualiza un producto junto con todas sus variantes. */
export async function adminSaveProduct(p, variants) {
  const sb = await client();
  const row = {
    sku: p.sku || null,
    name: p.name,
    description: p.description || '',
    category_id: p.categoryId || null,
    price: Number(p.price),
    sale_price: p.salePrice === '' || p.salePrice == null ? null : Number(p.salePrice),
    cost: Number(p.cost) || 0,
    status: p.status || 'available',
    featured: Boolean(p.featured),
    position: Number(p.position) || 0,
    low_stock_threshold: Number(p.lowStockThreshold) || 3,
    images: p.images || [],
  };

  let productId = p.id;
  if (productId) {
    const { error } = await sb.from('products').update(row).eq('id', productId);
    if (error) throw new Error(error.message);
  } else {
    const { data, error } = await sb.from('products').insert(row).select('id').single();
    if (error) throw new Error(error.message);
    productId = data.id;
  }

  // Reescribimos las variantes: borramos las que ya no están y
  // subimos las nuevas. Nunca tocamos el stock a mano, solo lo que
  // el administrador escribió en el formulario.
  const keep = variants.filter(v => v.id).map(v => v.id);
  let del = sb.from('product_variants').delete().eq('product_id', productId);
  if (keep.length) del = del.not('id', 'in', `(${keep.join(',')})`);
  const { error: delErr } = await del;
  if (delErr) throw new Error(delErr.message);

  const rows = variants.map(v => ({
    ...(v.id ? { id: v.id } : {}),
    product_id: productId,
    size: v.size || 'Única',
    color: v.color || 'Único',
    stock: Math.max(0, Number(v.stock) || 0),
  }));
  if (rows.length) {
    const { error } = await sb.from('product_variants').upsert(rows, { onConflict: 'id' });
    if (error) throw new Error(error.message);
  }
  return productId;
}

export async function adminDeleteProduct(id) {
  const sb = await client();
  const { error } = await sb.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** Sube una foto desde el teléfono o la computadora y devuelve su URL. */
export async function adminUploadImage(file) {
  const sb = await client();
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage
    .from('product-images')
    .upload(path, file, { cacheControl: '31536000', upsert: false });
  if (error) throw new Error(error.message);
  const { data } = sb.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function adminGetOrders() {
  const sb = await client();
  const { data, error } = await sb
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function adminSetOrderStatus(orderId, status) {
  const sb = await client();
  const { data, error } = await sb.rpc('set_order_status', {
    p_order_id: orderId,
    p_status: status,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function adminGetSettings() {
  const sb = await client();
  const { data, error } = await sb.from('settings').select('*').eq('id', 1).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function adminSaveSettings(s) {
  const sb = await client();
  const { error } = await sb.from('settings').update({
    store_name: s.store_name,
    logo_url: s.logo_url || null,
    whatsapp_number: String(s.whatsapp_number || '').replace(/\D/g, ''),
    shipping_price: Number(s.shipping_price) || 0,
    free_shipping_from: s.free_shipping_from === '' || s.free_shipping_from == null
      ? null : Number(s.free_shipping_from),
    instagram_url: s.instagram_url || null,
    facebook_url: s.facebook_url || null,
    store_address: s.store_address || null,
    whatsapp_intro: s.whatsapp_intro || '🛍️ NUEVO PEDIDO',
    payment_methods: s.payment_methods || [],
    low_stock_threshold: Number(s.low_stock_threshold) || 3,
  }).eq('id', 1);
  if (error) throw new Error(error.message);
}

export async function adminGetCategories() {
  const sb = await client();
  const { data, error } = await sb.from('categories').select('*').order('position');
  if (error) throw new Error(error.message);
  return data || [];
}
