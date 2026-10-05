// ============================================================
//  GymStreet · Tienda
//  Lee el catálogo de Supabase. Si todavía no está configurado,
//  usa el catálogo fijo de abajo para que la página nunca se caiga.
// ============================================================
import * as db from './db.js';
import * as cart from './cart.js';
import { WHATSAPP_FALLBACK } from './config.js';
import { buildOrderMessage, waLink, money, orderCode, restockMessage } from './whatsapp.js';

// Departamentos a los que no hacés envío. Dejalo vacío para enviar
// a todos. Ej: ['Petén', 'Izabal']
const ZONAS_SIN_ENVIO = [];

// ------------------------------------------------------------
//  CATÁLOGO DE RESPALDO (el que ya tenía la página)
// ------------------------------------------------------------
const PRODUCTS_FALLBACK = [
  {
    id:"youngla-compresion-negra",
    name:"Camisa YoungLA • Compresión Negra",
    price:275,
    category:"camisas",
    tags:["hot","stock"],
    sizes:["S","M","L","XL"],
    images:[
      "https://img.kwcdn.com/product/fancy/8f630a5f-7d10-4c63-a8aa-32a235dfa1d8.jpg?imageView2/2/w/800/q/70/format/avif"
    ]
  },
  {
    id:"gymshark-compresion-negra",
    name:"Camisa GymShark • Compresión Negra",
    price:275,
    category:"camisas",
    tags:[],
    soldOut:true,
    sizes:["S","M","L","XL"],
    images:[
      "https://img.kwcdn.com/product/fancy/3c52300a-b21e-4747-8115-3bddeea0e58f.jpg?imageView2/2/w/800/q/70/format/avif"
    ]
  },
  {
    id:"youngla-compresion-blanca",
    name:"Camisa YoungLA • Compresión Blanca",
    price:275,
    category:"camisas",
    tags:["stock"],
    sizes:["S","M","L","XL"],
    images:[
      "https://img.kwcdn.com/product/fancy/b7b45753-f0e5-4168-8995-471071ba9e7f.jpg?imageView2/2/w/800/q/70/format/avif"
    ]
  },
  {
    id:"youngla-vintage-negra",
    name:"Camisa YoungLA • Vintage Negra",
    price:300,
    category:"camisas",
    tags:["hot"],
    sizes:["M","L","XL"],
    images:[
      "https://img.kwcdn.com/product/fancy/1f003ce6-72c5-4978-9a99-9f68e743d3fd.jpg?imageView2/2/w/800/q/70/format/avif"
    ]
  },
  {
    id:"youngla-vintage-sin-mangas",
    name:"Camisa YoungLA • Vintage Sin Mangas",
    price:300,
    category:"camisas",
    tags:["new"],
    sizes:["M","L","XL"],
    images:[
      "https://img.kwcdn.com/product/fancy/06ddcead-8bbd-439b-9d0a-8e4625c2d730.jpg?imageView2/2/w/800/q/70/format/avif"
    ]
  },
  {
    id:"youngla-oversize",
    name:"Camisa YoungLA • Oversize",
    price:350,
    category:"oversize",
    tags:["hot","stock"],
    sizes:["M","L","XL"],
    images:[
      "https://img.kwcdn.com/product/fancy/b66df733-f74c-42cd-bdd0-cdf3bb1154b8.jpg?imageView2/2/w/800/q/70/format/avif"
    ]
  },
  {
    id:"worldgym-oversize",
    name:"Camisa World Gym • Oversize",
    price:325,
    category:"oversize",
    tags:["stock"],
    sizes:["M","L","XL"],
    images:[
      "https://img.kwcdn.com/product/fancy/2d812e1c-748d-4c88-9f83-d2eb0d098b98.jpg?imageView2/2/w/800/q/70/format/avif"
    ]
  },
  {
    id:"youngla-pants-negro",
    name:"Pants YoungLA • Negro",
    price:250,
    category:"pants",
    tags:["stock"],
    sizes:["28","30","32","34","36"],
    images:[
      "https://img.kwcdn.com/product/fancy/fe70db5d-6d70-4a86-9495-2729b2e49b52.jpg?imageView2/2/w/800/q/70/format/avif"
    ]
  },
  {
    id:"youngla-y2k-negro",
    name:"Pants YoungLA • Y2K Streetwear Negro",
    price:350,
    category:"pants",
    tags:["hot"],
    sizes:["28","30","32","34","36"],
    images:[
      "https://img.kwcdn.com/product/open/89a9b65b47de43d9b4387c3486ad3fed-goods.jpeg?imageView2/2/w/800/q/70/format/avif"
    ]
  },
  {
    id:"youngla-y2k-mujer-negro",
    name:"Pants YoungLA • Y2K Mujer Negro",
    price:265,
    category:"pants",
    tags:["new"],
    sizes:["XS","S","M","L"],
    images:[
      "https://img.kwcdn.com/product/Fancyalgo/VirtualModelMatting/d2dc172e83bbc454dd34d32fa6476068.jpg?imageView2/2/w/800/q/70/format/avif"
    ]
  },
  {
    id:"breathedivinity-compresion-negro",
    name:"Camisa BreatheDivinity • Compresión Negra",
    price:250,
    category:"camisas",
    tags:["stock"],
    sizes:["S","M","L","XL"],
    images:[
      "https://img.kwcdn.com/product/fancy/d79752c0-a402-4f70-85e8-3c66251934aa.jpg?imageView2/2/w/800/q/70/format/avif"
    ]
  },
  {
    id:"breathedivinity-compresion-blanco",
    name:"Camisa BreatheDivinity • Compresión Blanca",
    price:250,
    category:"camisas",
    tags:["stock"],
    sizes:["S","M","L","XL"],
    images:[
      "https://img.kwcdn.com/product/fancy/59a337af-c431-404c-86c1-974f2b24268c.jpg?imageView2/2/w/800/q/70/format/avif"
    ]
  }
];

const COMMUNITY = [
  {
    id:"cliente-1",
    caption:"Gracias por tu compra @sebas07_mendoza",
    cover:"img/23a34112-419c-497d-9453-d78c11cb6663.jpg",
    images:[
      "img/23a34112-419c-497d-9453-d78c11cb6663.jpg",
      "img/f76c6c72-0e09-4ced-8565-4f68c5493420.jpg"
    ]
  },
  {
    id:"cliente-2",
    caption:"Gracias por tu compra @alejandro_w23",
    cover:"img/08324a9e-56ff-421b-94ba-828061d19321.jpg",
    images:[
      "img/08324a9e-56ff-421b-94ba-828061d19321.jpg"
    ]
  },
  {
    id:"cliente-3",
    caption:"Gracias por tu compra @danierxlas_cs",
    cover:"img/8fd3f3ce-6e9e-4681-869a-e0d5e104e227.jpg",
    images:[
      "img/8fd3f3ce-6e9e-4681-869a-e0d5e104e227.jpg"
    ]
  },
  {
    id:"cliente-4",
    caption:"Gracias por tu compra @d_ledif_19",
    cover:"img/WhatsAppImage2025-12-03at5.10.50 PM.jpeg",
    images:[
      "img/WhatsAppImage2025-12-03at5.10.50 PM.jpeg"
    ]
  },
  {
    id:"cliente-5",
    caption:"Gracias por tu compra @dylan_alfaro",
    cover:"img/2b5ba153-2d9a-4152-9f12-68de41b62c02.jpg",
    images:[
      "img/2b5ba153-2d9a-4152-9f12-68de41b62c02.jpg"
    ]
  },
  {
    id:"cliente-6",
    caption:"Gracias por tu compra 💪",
    cover:"img/cliente-6.jpg",
    images:[
      "img/cliente-6.jpg"
    ]
  },
  {
    id:"cliente-7",
    caption:"\"Lujo de ropa 🔥🔥\" — gracias por etiquetarnos",
    cover:"img/cliente-7.jpg",
    images:[
      "img/cliente-7.jpg"
    ]
  }
];
/** Convierte un producto del catálogo fijo a la misma forma que usa la base. */
function adaptFallback(p) {
  const variants = (p.sizes || ['Única']).map((s, i) => ({
    id: `fb-${p.id}-${i}`, size: s, color: 'Único',
    stock: p.soldOut ? 0 : 99,          // sin base de datos no hay inventario real
  }));
  return {
    id: p.id, sku: '', name: p.name, description: '',
    category: p.category, categoryName: p.category.toUpperCase(),
    price: p.price, salePrice: null, finalPrice: p.price, discount: 0,
    status: p.soldOut ? 'sold_out' : 'available',
    featured: (p.tags || []).includes('hot'),
    position: 0, images: p.images || [], variants,
    stock: p.soldOut ? 0 : 99,
    soldOut: Boolean(p.soldOut),
    sizes: p.sizes || ['Única'], colors: ['Único'],
    tags: p.tags || [],
  };
}

// ------------------------------------------------------------
//  ESTADO
// ------------------------------------------------------------
let PRODUCTS = [];
let SETTINGS = null;
let usingDB = false;

let activeCategory = 'all';
let activeSearch = '';
let activeSort = 'featured';
let activeProduct = null;
let sel = { size: null, color: null, qty: 1 };
let lastOrder = null;   // el pedido ya guardado, para el botón de WhatsApp

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const whatsappNumber = () => SETTINGS?.whatsapp_number || WHATSAPP_FALLBACK;
const shippingPrice  = () => Number(SETTINGS?.shipping_price ?? 0);
const freeFrom       = () => (SETTINGS?.free_shipping_from == null
                               ? null : Number(SETTINGS.free_shipping_from));

/**
 * Cómo mostrar el envío. Que cueste 0 no siempre significa "gratis":
 * si todavía no configuraste precio de envío, decimos "a convenir"
 * para no prometerle al cliente algo que no decidiste.
 */
function shippingLabel(sub, envio) {
  if (envio > 0) return money(envio);
  const f = freeFrom();
  if (f != null && sub >= f) return '¡Gratis!';
  if (shippingPrice() === 0 && f == null) return 'A convenir';
  return 'Gratis';
}

/** Envío que corresponde para un subtotal dado. */
function shippingFor(sub) {
  const f = freeFrom();
  if (f != null && sub >= f) return 0;
  return shippingPrice();
}

// ------------------------------------------------------------
//  AVISOS
// ------------------------------------------------------------
function toast(msg, kind = '') {
  const box = $('toasts');
  if (!box) return;
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .3s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, kind === 'err' ? 5200 : 3200);
}

// ------------------------------------------------------------
//  CATÁLOGO
// ------------------------------------------------------------
function visibleProducts() {
  let list = PRODUCTS.filter(p => p.status !== 'hidden');

  if (activeCategory !== 'all') list = list.filter(p => p.category === activeCategory);

  if (activeSearch.trim()) {
    const q = activeSearch.toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q));
  }

  if (activeSort === 'price-asc')  list.sort((a, b) => a.finalPrice - b.finalPrice);
  if (activeSort === 'price-desc') list.sort((a, b) => b.finalPrice - a.finalPrice);
  if (activeSort === 'name-asc')   list.sort((a, b) => a.name.localeCompare(b.name));
  if (activeSort === 'featured')   list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

  // los agotados siempre al final
  list.sort((a, b) => (a.soldOut ? 1 : 0) - (b.soldOut ? 1 : 0));
  return list;
}

function priceHtml(p) {
  if (p.salePrice != null && p.discount > 0) {
    return `<span>${money(p.finalPrice)}</span><span class="price-old">${money(p.price)}</span>`;
  }
  return `<span>${money(p.finalPrice)}</span>`;
}

function renderProducts() {
  const grid = $('productGrid');
  const list = visibleProducts();
  grid.innerHTML = '';

  if (!list.length) {
    grid.innerHTML = `<p class="section-subtitle">No encontramos prendas con esa búsqueda.</p>`;
  }

  list.forEach(p => {
    const card = document.createElement('div');
    card.className = p.soldOut ? 'card sold' : 'card';

    const tags = p.tags || [];
    const sizesHtml = p.sizes.filter(s => s !== 'Única').map(s => {
      const hay = p.variants.some(v => v.size === s && v.stock > 0);
      return `<span class="mini-opt ${hay ? '' : 'off'}">${esc(s)}</span>`;
    }).join('');
    const colorsHtml = p.colors.filter(c => c !== 'Único').map(c => {
      const hay = p.variants.some(v => v.color === c && v.stock > 0);
      return `<span class="mini-opt ${hay ? '' : 'off'}">${esc(c)}</span>`;
    }).join('');

    card.innerHTML = `
      <div class="media">
        <img loading="lazy" src="${esc(p.images[0] || '')}" alt="${esc(p.name)}">
        <div class="badges">
          ${p.discount > 0 ? `<span class="badge oferta">-${p.discount}%</span>` : ''}
          ${tags.includes('hot') || p.featured ? `<span class="badge hot">🔥 Hot</span>` : ''}
          ${tags.includes('new') ? `<span class="badge new">🆕 Nuevo</span>` : ''}
          ${!p.soldOut && tags.includes('stock') ? `<span class="badge stock">✅ Stock</span>` : ''}
        </div>
        ${p.soldOut ? `<div class="ribbon">Agotado</div>` : ''}
      </div>
      <div class="card-body">
        <h3 class="name">${esc(p.name)}</h3>
        <div class="meta">
          <div class="price price-row">${priceHtml(p)}</div>
          <div class="mini">${esc(p.categoryName || p.category.toUpperCase())}</div>
        </div>
        ${sizesHtml || colorsHtml ? `<div class="mini-opts">${colorsHtml}${sizesHtml}</div>` : ''}
        <div class="card-actions">
          <button class="btn" data-action="view">👁 Ver producto</button>
          ${p.soldOut
            ? `<button class="btn" data-action="order" disabled>Agotado</button>`
            : `<button class="btn primary" data-action="order">🟢 Pedir</button>`}
        </div>
      </div>`;

    card.querySelector('[data-action="view"]').addEventListener('click', e => {
      e.stopPropagation(); openProduct(p);
    });
    if (!p.soldOut) {
      card.querySelector('[data-action="order"]').addEventListener('click', e => {
        e.stopPropagation(); openProduct(p);
      });
    }
    card.addEventListener('click', () => openProduct(p));
    grid.appendChild(card);
  });

  const disponibles = list.filter(p => !p.soldOut).length;
  $('statProducts').textContent = disponibles === list.length
    ? `${list.length} activos`
    : `${disponibles} de ${list.length}`;
}

function renderCommunity() {
  const grid = $('communityGrid');
  grid.innerHTML = '';
  COMMUNITY.forEach(c => {
    const el = document.createElement('div');
    el.className = 'client';
    el.innerHTML = `<img loading="lazy" src="${esc(c.cover)}" alt="Cliente GymStreet">
                    <div class="cap">${esc(c.caption)}</div>`;
    el.addEventListener('click', () => openGallery(c.caption, c.images));
    grid.appendChild(el);
  });
}

// ------------------------------------------------------------
//  DETALLE DEL PRODUCTO
// ------------------------------------------------------------
function setGallery(images) {
  const main = $('modalMainImg');
  const thumbs = $('modalThumbs');
  main.src = images[0] || '';
  thumbs.innerHTML = '';
  images.forEach((src, i) => {
    const t = document.createElement('img');
    t.src = src;
    t.loading = 'lazy';
    if (i === 0) t.classList.add('active');
    t.addEventListener('click', () => {
      main.src = src;
      thumbs.querySelectorAll('img').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
    });
    thumbs.appendChild(t);
  });
}

function openModalShell(title) {
  $('modalTitle').textContent = title;
  $('modal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

export function closeModal() {
  $('modal').classList.remove('active');
  document.body.style.overflow = '';
  activeProduct = null;
}

/** Galería simple para las fotos de la comunidad. */
function openGallery(title, images) {
  activeProduct = null;
  openModalShell(title);
  setGallery(images);
  $('modalPrice').textContent = 'PRUEBA SOCIAL';
  $('modalCat').textContent = 'COMUNIDAD';
  $('modalDesc').textContent = '';
  $('modalHint').hidden = false;
  $('modalHint').textContent = 'Fotos reales de clientes. Si querés aparecer aquí, mandanos la tuya 💪';
  $('modalSold').hidden = true;
  $('groupColor').hidden = true;
  $('groupSize').hidden = true;
  $('groupQty').hidden = true;
  $('btnAddCart').hidden = true;
  $('btnWhatsApp').textContent = '🟢 Escribir por WhatsApp';
}

function openProduct(p) {
  activeProduct = p;
  sel = { size: null, color: null, qty: 1 };

  openModalShell(p.name);
  setGallery(p.images);

  $('modalPrice').innerHTML = priceHtml(p) +
    (p.discount > 0 ? ` <span class="badge oferta" style="margin-left:8px">-${p.discount}%</span>` : '');
  $('modalCat').textContent = p.categoryName || p.category.toUpperCase();
  $('modalDesc').textContent = p.description || '';

  const sold = p.soldOut;
  $('modalHint').hidden = sold;
  $('modalHint').textContent = 'Elegí talla y color, y agregá al carrito.';
  $('modalSold').hidden = !sold;
  $('groupQty').hidden = sold;
  $('btnAddCart').hidden = sold;
  $('btnWhatsApp').textContent = sold ? '✉ Avísame cuando entre' : '🟢 Pedir ahora';

  // colores y tallas reales
  const colors = p.colors.filter(c => c !== 'Único');
  const sizes  = p.sizes.filter(s => s !== 'Única');

  $('groupColor').hidden = sold || colors.length === 0;
  $('groupSize').hidden  = sold || sizes.length === 0;

  sel.color = colors.length ? (colors.find(c => p.variants.some(v => v.color === c && v.stock > 0)) || colors[0]) : 'Único';
  sel.size  = null;

  renderOptions();
}

function renderOptions() {
  const p = activeProduct;
  if (!p) return;
  const colors = p.colors.filter(c => c !== 'Único');
  const sizes  = p.sizes.filter(s => s !== 'Única');

  // --- colores ---
  const colorRow = $('colorRow');
  colorRow.innerHTML = '';
  colors.forEach(c => {
    const hay = p.variants.some(v => v.color === c && v.stock > 0);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'opt' + (sel.color === c ? ' active' : '');
    b.textContent = c;
    b.disabled = !hay;
    b.addEventListener('click', () => { sel.color = c; sel.size = null; sel.qty = 1; renderOptions(); });
    colorRow.appendChild(b);
  });

  // --- tallas disponibles para el color elegido ---
  const sizeRow = $('sizeRow');
  sizeRow.innerHTML = '';
  sizes.forEach(s => {
    const v = p.variants.find(x => x.size === s && x.color === (sel.color || 'Único'));
    const hay = Boolean(v && v.stock > 0);
    if (hay && !sel.size) sel.size = s;       // preselecciona la primera con stock
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'opt' + (sel.size === s ? ' active' : '');
    b.textContent = s;
    b.disabled = !hay;
    b.title = hay ? `${v.stock} disponibles` : 'Agotado en este color';
    b.addEventListener('click', () => { sel.size = s; sel.qty = 1; renderOptions(); });
    sizeRow.appendChild(b);
  });
  if (!sizes.length) sel.size = 'Única';

  // --- cantidad y aviso de stock ---
  const v = db.findVariant(p, sel.size || 'Única', sel.color || 'Único');
  const max = v ? v.stock : 0;
  const umbral = Number(SETTINGS?.low_stock_threshold ?? 3);

  sel.qty = Math.min(Math.max(1, sel.qty), Math.max(1, max));
  const input = $('qtyInput');
  input.value = sel.qty;
  input.max = Math.max(1, max);
  $('qtyMinus').disabled = sel.qty <= 1;
  $('qtyPlus').disabled  = sel.qty >= max;
  $('btnAddCart').disabled = max === 0;

  const hint = $('stockHint');
  hint.className = 'stock-hint';
  if (!usingDB) {
    hint.textContent = '';
  } else if (max === 0) {
    hint.textContent = '🔴 Agotado en esta combinación';
    hint.classList.add('out');
  } else if (max <= umbral) {
    hint.textContent = `⚠️ Poco stock: quedan ${max}`;
    hint.classList.add('low');
  } else {
    hint.textContent = `${max} disponibles`;
  }

  // los botones de la barra inferior siempre activos
  const activeSizes = sizes.filter(s =>
    p.variants.some(x => x.size === s && x.color === (sel.color || 'Único') && x.stock > 0));
  $('groupSize').hidden = p.soldOut || sizes.length === 0;
  if (sizes.length && !activeSizes.length) {
    hint.textContent = '🔴 Ese color está agotado en todas las tallas';
    hint.classList.add('out');
  }
}

// ------------------------------------------------------------
//  CARRITO
// ------------------------------------------------------------
function addToCart() {
  const p = activeProduct;
  if (!p) return false;
  const size = sel.size || 'Única';
  const color = sel.color || 'Único';
  const v = db.findVariant(p, size, color);

  if (!v || v.stock === 0) {
    toast('Esa combinación está agotada.', 'err');
    return false;
  }
  const r = cart.add({
    productId: p.id, variantId: v.id, name: p.name,
    size, color, qty: sel.qty, unitPrice: p.finalPrice,
    image: p.images[0] || '', sku: p.sku, maxStock: v.stock,
  });
  if (!r.ok) { toast(r.reason, 'err'); return false; }

  const detalle = [color !== 'Único' ? color : null, size !== 'Única' ? size : null]
    .filter(Boolean).join(' · ');
  toast(`Agregado: ${p.name}${detalle ? ` (${detalle})` : ''}`, 'ok');
  return true;
}

function updateCartCount() {
  const n = cart.count();
  ['cartCount', 'cartCountMobile'].forEach(id => {
    const el = $(id);
    if (el) { el.textContent = n; el.dataset.n = n; }
  });
}

function renderCart() {
  const body = $('cartBody');
  const foot = $('cartFoot');
  const items = cart.all();
  body.innerHTML = '';

  if (!items.length) {
    body.innerHTML = `<p class="cart-empty">Tu carrito está vacío</p>`;
    foot.hidden = true;
    updateCartCount();
    return;
  }
  foot.hidden = false;

  items.forEach(it => {
    const key = cart.lineKey(it);
    const meta = [it.color !== 'Único' ? it.color : null, it.size !== 'Única' ? it.size : null]
      .filter(Boolean).join(' · ');
    const row = document.createElement('div');
    row.className = 'cline';
    row.innerHTML = `
      <img src="${esc(it.image)}" alt="${esc(it.name)}">
      <div>
        <div class="cname">${esc(it.name)}</div>
        ${meta ? `<div class="cmeta">${esc(meta)}</div>` : ''}
        <div class="cprice">${money(it.unitPrice)} c/u</div>
        <div class="qty">
          <button type="button" data-q="-">−</button>
          <input type="number" value="${it.qty}" min="1" max="${it.maxStock}" inputmode="numeric">
          <button type="button" data-q="+">+</button>
        </div>
      </div>
      <div style="text-align:right">
        <button class="cline-del" title="Quitar">&times;</button>
        <div class="cprice" style="margin-top:12px">${money(it.unitPrice * it.qty)}</div>
      </div>`;

    const input = row.querySelector('input');
    row.querySelector('[data-q="-"]').addEventListener('click', () => {
      cart.setQty(key, it.qty - 1); renderCart();
    });
    row.querySelector('[data-q="+"]').addEventListener('click', () => {
      if (it.qty >= it.maxStock) { toast(`Solo quedan ${it.maxStock}.`, 'err'); return; }
      cart.setQty(key, it.qty + 1); renderCart();
    });
    input.addEventListener('change', () => { cart.setQty(key, input.value); renderCart(); });
    row.querySelector('.cline-del').addEventListener('click', () => {
      cart.remove(key); renderCart();
    });
    body.appendChild(row);
  });

  const sub = cart.subtotal();
  const env = shippingFor(sub);
  $('cartSubtotal').textContent = money(sub);
  $('cartShipping').textContent = shippingLabel(sub, env);
  $('cartTotal').textContent = money(sub + env);
  updateCartCount();
}

function openDrawer() { renderCart(); $('drawer').classList.add('active'); document.body.style.overflow = 'hidden'; }
function closeDrawer() { $('drawer').classList.remove('active'); document.body.style.overflow = ''; }

// ------------------------------------------------------------
//  REALIZAR PEDIDO
// ------------------------------------------------------------
const REQUERIDOS = {
  fName: 'Escribí tu nombre completo.',
  fPhone: 'Necesitamos un teléfono para contactarte.',
  fWhats: 'Necesitamos tu WhatsApp para confirmar el pedido.',
  fDep: 'Elegí tu departamento.',
  fMun: 'Escribí tu municipio.',
  fAddr: 'Escribí la dirección completa de entrega.',
};

function fieldError(id, msg) {
  const input = $(id);
  const fld = input.closest('.fld');
  fld.classList.toggle('error', Boolean(msg));
  const span = fld.querySelector('.msg');
  if (span) span.textContent = msg || '';
}

function readForm() {
  return {
    name: $('fName').value.trim(),
    phone: $('fPhone').value.trim(),
    whatsapp: $('fWhats').value.trim(),
    department: $('fDep').value,
    municipality: $('fMun').value.trim(),
    address: $('fAddr').value.trim(),
    reference: $('fRef').value.trim(),
    receiver: $('fRecv').value.trim(),
    payment_method: $('fPay').value,
    notes: $('fNotes').value.trim(),
  };
}

function validateForm() {
  // Si no escribió el WhatsApp, usamos el mismo teléfono. Lo hacemos
  // aquí y no al salir del campo, porque si el cliente tabula y empieza
  // a escribir, el texto se concatenaría con el número ya puesto.
  if (!$('fWhats').value.trim() && $('fPhone').value.trim()) {
    $('fWhats').value = $('fPhone').value.trim();
  }
  const d = readForm();
  let ok = true;
  const mapa = { fName: d.name, fPhone: d.phone, fWhats: d.whatsapp,
                 fDep: d.department, fMun: d.municipality, fAddr: d.address };

  for (const [id, msg] of Object.entries(REQUERIDOS)) {
    const vacio = !mapa[id];
    fieldError(id, vacio ? msg : '');
    if (vacio) ok = false;
  }
  // teléfono con al menos 8 dígitos (Guatemala)
  ['fPhone', 'fWhats'].forEach(id => {
    const v = $(id).value.replace(/\D/g, '');
    if (v && v.length < 8) { fieldError(id, 'El número parece incompleto.'); ok = false; }
  });
  // zonas sin cobertura
  if (d.department && ZONAS_SIN_ENVIO.includes(d.department)) {
    fieldError('fDep', `Por ahora no hacemos envíos a ${d.department}. Escribinos y lo vemos.`);
    ok = false;
  }
  if (!ok) {
    const primero = document.querySelector('.fld.error input, .fld.error select');
    primero?.focus();
    primero?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  return ok ? d : null;
}

function openCheckout() {
  if (cart.isEmpty()) { toast('Tu carrito está vacío.', 'err'); return; }
  closeDrawer();
  // formas de pago desde la configuración de la tienda
  const métodos = SETTINGS?.payment_methods?.length
    ? SETTINGS.payment_methods
    : ['Pago contra entrega', 'Transferencia', 'Depósito bancario'];
  $('fPay').innerHTML = métodos.map(m => `<option>${esc(m)}</option>`).join('');
  showStep('form');
  $('checkout').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  $('checkout').classList.remove('active');
  document.body.style.overflow = '';
}

function showStep(step) {
  $('stepForm').hidden = step !== 'form';
  $('stepSummary').hidden = step !== 'summary';
  $('checkoutTitle').textContent = step === 'form' ? 'Realizar pedido' : 'Revisá tu pedido';
  $('checkout').scrollTop = 0;
}

function renderSummary(d) {
  const items = cart.all();
  $('sumItems').innerHTML = items.map(it => {
    const meta = [];
    if (it.color !== 'Único') meta.push(`<div class="r"><span>Color</span><span>${esc(it.color)}</span></div>`);
    if (it.size  !== 'Única') meta.push(`<div class="r"><span>Talla</span><span>${esc(it.size)}</span></div>`);
    return `<div class="sum-item">
      <div class="t">${esc(it.name)}</div>
      ${meta.join('')}
      <div class="r"><span>Cantidad</span><span>${it.qty}</span></div>
      <div class="r"><span>Precio unitario</span><span>${money(it.unitPrice)}</span></div>
      <div class="r"><span>Subtotal</span><span>${money(it.unitPrice * it.qty)}</span></div>
    </div>`;
  }).join('');

  const sub = cart.subtotal();
  const env = shippingFor(sub);
  $('sumSubtotal').textContent = money(sub);
  $('sumShipping').textContent = shippingLabel(sub, env);
  $('sumTotal').textContent = money(sub + env);

  const fila = (k, v) => v ? `<div><b>${k}:</b> ${esc(v)}</div>` : '';
  $('sumCustomer').innerHTML =
    fila('Nombre', d.name) + fila('Teléfono', d.phone) + fila('WhatsApp', d.whatsapp) +
    fila('Departamento', d.department) + fila('Municipio', d.municipality) +
    fila('Dirección', d.address) + fila('Referencia', d.reference) +
    fila('Recibe', d.receiver) + fila('Forma de pago', d.payment_method) +
    fila('Observaciones', d.notes);
}

/** Número de pedido local, solo para cuando no hay base de datos. */
function localOrderNumber() {
  let n = 0;
  try {
    n = Number(localStorage.getItem('gymstreet_order_seq') || '0') + 1;
    localStorage.setItem('gymstreet_order_seq', String(n));
  } catch { n = Date.now() % 100000; }
  return n;
}

/**
 * Confirma el pedido.
 * IMPORTANTE: primero se guarda en la base y después se abre WhatsApp,
 * para que quede registrado aunque el cliente no llegue a enviar el mensaje.
 */
async function confirmOrder() {
  const d = readForm();
  const items = cart.all();
  if (!items.length) { toast('Tu carrito está vacío.', 'err'); return; }

  const btn = $('btnConfirm');
  btn.disabled = true;
  const textoOriginal = btn.textContent;
  btn.textContent = 'Guardando pedido…';

  // La ventana se abre YA, antes del await, o el navegador la bloquea
  // por considerarla una ventana emergente no pedida por el usuario.
  const win = window.open('', '_blank');

  try {
    let order;
    if (usingDB) {
      order = await db.createOrder({
        customer: d,
        items: items.map(i => ({ variantId: i.variantId, qty: i.qty })),
      });
    } else {
      const sub = cart.subtotal();
      const env = shippingFor(sub);
      order = { order_number: localOrderNumber(), subtotal: sub, shipping: env, total: sub + env };
    }

    const texto = buildOrderMessage({
      order,
      items: items.map(i => ({ name: i.name, color: i.color, size: i.size, qty: i.qty, unitPrice: i.unitPrice })),
      customer: d,
      settings: SETTINGS,
      shippingLabel: shippingLabel(Number(order.subtotal), Number(order.shipping)),
    });
    const link = waLink(whatsappNumber(), texto);

    lastOrder = order;
    cart.clear();
    renderCart();
    closeCheckout();
    $('orderForm').reset();

    if (win && !win.closed) win.location.href = link;
    else window.location.href = link;

    toast(`Pedido ${orderCode(order.order_number)} registrado. Enviá el mensaje para confirmarlo.`, 'ok');
    if (!usingDB) {
      toast('Aviso: la tienda todavía no está conectada a la base de datos, así que este pedido no quedó guardado.', 'err');
    }
    // refrescar inventario
    if (usingDB) loadCatalog();
  } catch (err) {
    if (win && !win.closed) win.close();
    toast(err.message || 'No se pudo registrar el pedido.', 'err');
    showStep('form');
  } finally {
    btn.disabled = false;
    btn.textContent = textoOriginal;
  }
}

// ------------------------------------------------------------
//  CARGA DEL CATÁLOGO
// ------------------------------------------------------------
function renderChips(cats) {
  const row = document.querySelector('.chip-row');
  const select = $('sortSelect');
  row.querySelectorAll('.chip').forEach(c => c.remove());

  const lista = [{ slug: 'all', name: 'Todo' },
                 ...cats.filter(c => PRODUCTS.some(p => p.category === c.slug))];

  lista.reverse().forEach(c => {
    const b = document.createElement('button');
    b.className = 'chip' + (activeCategory === c.slug ? ' active' : '');
    b.dataset.cat = c.slug;
    b.textContent = c.name;
    b.addEventListener('click', () => {
      row.querySelectorAll('.chip').forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      activeCategory = c.slug;
      renderProducts();
    });
    row.insertBefore(b, row.firstChild);
  });
  row.appendChild(select);
}

async function loadCatalog() {
  let cats = [];
  if (db.isConfigured()) {
    const [prods, settings, categorias] = await Promise.all([
      db.getProducts(), db.getSettings(), db.getCategories(),
    ]);
    if (prods && prods.length) {
      PRODUCTS = prods;
      SETTINGS = settings;
      cats = categorias;
      usingDB = true;
    }
  }

  if (!usingDB) {
    PRODUCTS = PRODUCTS_FALLBACK.map(adaptFallback);
    cats = [...new Set(PRODUCTS.map(p => p.category))]
      .map(s => ({ slug: s, name: s.charAt(0).toUpperCase() + s.slice(1) }));
    mostrarAvisoDemo();
  }

  renderChips(cats);
  renderProducts();

  // el carrito puede traer cosas que ya se agotaron
  cart.load();
  const avisos = cart.reconcile(PRODUCTS);
  avisos.forEach(a => toast(a, 'err'));
  renderCart();

  // enlaces de redes y WhatsApp desde la configuración
  if (SETTINGS) {
    const n = whatsappNumber();
    document.querySelectorAll('a[href*="wa.me/"]').forEach(a => {
      a.href = `https://wa.me/${String(n).replace(/\D/g, '')}`;
    });
    if (SETTINGS.instagram_url) {
      const ig = document.querySelector('.social a[href*="instagram"]');
      if (ig) ig.href = SETTINGS.instagram_url;
    }
    if (SETTINGS.facebook_url) {
      const fb = document.querySelector('.social a[href*="facebook"]');
      if (fb) fb.href = SETTINGS.facebook_url;
    }
  }
}

function mostrarAvisoDemo() {
  if (document.querySelector('.demo-bar')) return;
  const bar = document.createElement('div');
  bar.className = 'demo-bar';
  bar.innerHTML = '⚠️ <b>Modo sin base de datos.</b> La tienda muestra el catálogo fijo y ' +
                  'los pedidos no se guardan. Pegá tus claves de Supabase en ' +
                  '<code>assets/js/config.js</code> para activar inventario y pedidos.';
  document.querySelector('.toolbar')?.insertAdjacentElement('beforebegin', bar);
}

// ------------------------------------------------------------
//  NAVEGACIÓN
// ------------------------------------------------------------
function setActivePage(page) {
  $('pageCatalog').classList.toggle('active', page === 'catalog');
  $('pageCommunity').classList.toggle('active', page === 'community');
  $('navCatalog').classList.toggle('active', page === 'catalog');
  $('navCommunity').classList.toggle('active', page === 'community');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ------------------------------------------------------------
//  EVENTOS
// ------------------------------------------------------------
function wire() {
  $('navCatalog').addEventListener('click', () => setActivePage('catalog'));
  $('navCommunity').addEventListener('click', () => setActivePage('community'));
  $('navContact').addEventListener('click', () => $('contacto').scrollIntoView({ behavior: 'smooth' }));
  $('mHome').addEventListener('click', () => setActivePage('catalog'));
  $('navCart').addEventListener('click', openDrawer);
  $('mCart').addEventListener('click', openDrawer);

  $('searchInput').addEventListener('input', e => { activeSearch = e.target.value; renderProducts(); });
  $('sortSelect').addEventListener('change', e => { activeSort = e.target.value; renderProducts(); });

  // --- detalle del producto ---
  $('modalClose').addEventListener('click', closeModal);
  $('modal').addEventListener('click', e => { if (e.target === $('modal')) closeModal(); });

  $('qtyMinus').addEventListener('click', () => { sel.qty = Math.max(1, sel.qty - 1); renderOptions(); });
  $('qtyPlus').addEventListener('click', () => { sel.qty += 1; renderOptions(); });
  $('qtyInput').addEventListener('change', e => { sel.qty = Number(e.target.value) || 1; renderOptions(); });

  $('btnAddCart').addEventListener('click', () => { if (addToCart()) { closeModal(); openDrawer(); } });

  $('btnWhatsApp').addEventListener('click', () => {
    const p = activeProduct;
    if (!p) {   // galería de comunidad
      window.open(waLink(whatsappNumber(), 'Hola GymStreet 👋 Quiero consultar sobre sus prendas.'), '_blank');
      return;
    }
    if (p.soldOut) {
      window.open(waLink(whatsappNumber(), restockMessage(p.name)), '_blank');
      return;
    }
    if (addToCart()) { closeModal(); openCheckout(); }
  });

  $('btnViewCommunity').addEventListener('click', () => { closeModal(); setActivePage('community'); });

  // --- carrito ---
  $('drawerClose').addEventListener('click', closeDrawer);
  $('drawer').addEventListener('click', e => { if (e.target === $('drawer')) closeDrawer(); });
  $('btnKeepShopping').addEventListener('click', closeDrawer);
  $('btnCheckout').addEventListener('click', openCheckout);

  // --- pedido ---
  $('checkoutClose').addEventListener('click', closeCheckout);
  $('btnBackToCart').addEventListener('click', () => { closeCheckout(); openDrawer(); });
  $('btnBackToForm').addEventListener('click', () => showStep('form'));
  $('orderForm').addEventListener('submit', e => {
    e.preventDefault();
    const d = validateForm();
    if (!d) { toast('Revisá los campos marcados en rojo.', 'err'); return; }
    renderSummary(d);
    showStep('summary');
  });
  $('btnConfirm').addEventListener('click', confirmOrder);


  // --- flotantes ---
  $('floatOrder').addEventListener('click', () => {
    if (cart.isEmpty()) $('contacto').scrollIntoView({ behavior: 'smooth' });
    else openDrawer();
  });
  window.addEventListener('scroll', () => {
    $('toTop').classList.toggle('show', window.scrollY > 400);
  });
  $('toTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // Escape cierra lo que esté abierto, de adentro hacia afuera
  window.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if ($('checkout').classList.contains('active')) return closeCheckout();
    if ($('drawer').classList.contains('active')) return closeDrawer();
    if ($('modal').classList.contains('active')) return closeModal();
  });

  window.addEventListener('cart:change', updateCartCount);
}

// ------------------------------------------------------------
//  ARRANQUE
// ------------------------------------------------------------
wire();
renderCommunity();
cart.load();
updateCartCount();
loadCatalog().catch(err => {
  console.error('[GymStreet]', err);
  toast('No se pudo cargar el catálogo. Mostrando el fijo.', 'err');
  PRODUCTS = PRODUCTS_FALLBACK.map(adaptFallback);
  renderProducts();
});
