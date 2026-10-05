// ============================================================
//  GymStreet · Carrito
//  Se guarda en el navegador del cliente, así que no se pierde
//  si recarga la página o se va y vuelve.
// ============================================================
const KEY = 'gymstreet_cart_v1';

let items = [];

/** Clave única de una línea del carrito: mismo producto + talla + color. */
const lineKey = i => `${i.productId}|${i.size}|${i.color}`;

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    items = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(items)) items = [];
  } catch {
    items = [];   // navegación privada, almacenamiento bloqueado, datos corruptos
  }
  return items;
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Si no se puede guardar (modo privado o sin espacio) el carrito
    // igual funciona durante la visita; solo no sobrevive a la recarga.
  }
  window.dispatchEvent(new CustomEvent('cart:change'));
}

export const all = () => items;
export const count = () => items.reduce((a, i) => a + i.qty, 0);
export const subtotal = () => items.reduce((a, i) => a + i.unitPrice * i.qty, 0);
export const isEmpty = () => items.length === 0;

/** Agrega una combinación. Nunca deja pasar más de lo que hay en stock. */
export function add(line) {
  const key = lineKey(line);
  const found = items.find(i => lineKey(i) === key);
  const max = Math.max(0, Number(line.maxStock) || 0);
  if (max === 0) return { ok: false, reason: 'Esa talla y color están agotados.' };

  if (found) {
    const nueva = found.qty + line.qty;
    if (nueva > max) {
      found.qty = max;
      save();
      return { ok: false, reason: `Solo quedan ${max} disponibles. Dejamos ${max} en el carrito.` };
    }
    found.qty = nueva;
  } else {
    if (line.qty > max) return { ok: false, reason: `Solo quedan ${max} disponibles.` };
    items.push({ ...line, qty: line.qty, maxStock: max });
  }
  save();
  return { ok: true };
}

export function setQty(key, qty) {
  const it = items.find(i => lineKey(i) === key);
  if (!it) return;
  const q = Math.max(1, Math.min(Number(qty) || 1, it.maxStock));
  it.qty = q;
  save();
}

export function remove(key) {
  items = items.filter(i => lineKey(i) !== key);
  save();
}

export function clear() {
  items = [];
  save();
}

export { lineKey };

/**
 * Vuelve a comparar el carrito contra el inventario actual.
 * Si algo se agotó mientras el cliente paseaba, lo recorta o lo saca
 * y devuelve los avisos para mostrárselos.
 */
export function reconcile(products) {
  const avisos = [];
  const byId = Object.fromEntries(products.map(p => [p.id, p]));
  items = items.filter(i => {
    const p = byId[i.productId];
    if (!p || p.status === 'hidden') {
      avisos.push(`"${i.name}" ya no está disponible y se quitó del carrito.`);
      return false;
    }
    const v = p.variants.find(x => x.size === i.size && x.color === i.color);
    const stock = v ? v.stock : 0;
    if (stock === 0) {
      avisos.push(`"${i.name}" (${i.size} / ${i.color}) se agotó y se quitó del carrito.`);
      return false;
    }
    i.maxStock = stock;
    if (i.qty > stock) {
      avisos.push(`De "${i.name}" (${i.size} / ${i.color}) solo quedan ${stock}.`);
      i.qty = stock;
    }
    // el precio también puede haber cambiado
    i.unitPrice = p.finalPrice;
    if (v) i.variantId = v.id;
    return true;
  });
  if (avisos.length) save();
  return avisos;
}
