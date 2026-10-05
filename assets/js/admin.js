// ============================================================
//  GymStreet · Panel de administración
// ============================================================
import * as db from './db.js';
import { money, orderCode, waLink } from './whatsapp.js';

const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g,
  c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- estado ----------
let PRODUCTS = [];
let ORDERS = [];
let CATEGORIES = [];
let SETTINGS = null;
let editing = null;             // producto en edición
let draft = { images: [], sizes: [], colors: [], stock: {}, variantIds: {} };
let openOrder = null;

const TALLAS_RAPIDAS  = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'];
const COLORES_RAPIDOS = ['Negro', 'Blanco', 'Gris', 'Azul', 'Rojo', 'Verde', 'Beige', 'Único'];

const ESTADOS = {
  nuevo:      { t: 'Nuevo',                  c: 'info' },
  pendiente:  { t: 'Pendiente de confirmar', c: 'warn' },
  confirmado: { t: 'Confirmado',             c: 'ok'   },
  preparando: { t: 'Preparando',             c: 'warn' },
  enviado:    { t: 'Enviado',                c: 'info' },
  entregado:  { t: 'Entregado',              c: 'ok'   },
  cancelado:  { t: 'Cancelado',              c: 'bad'  },
};

// ---------- avisos ----------
function toast(msg, kind = '') {
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = msg;
  $('toasts').appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .3s'; el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, kind === 'err' ? 6000 : 3200);
}

const fecha = iso => new Date(iso).toLocaleString('es-GT',
  { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

// ============================================================
//  INGRESO
// ============================================================
async function boot() {
  if (!db.isConfigured()) {
    $('loginMsg').innerHTML =
      '<div class="msg-box">Falta conectar Supabase.<br><br>' +
      'Abrí <b>assets/js/config.js</b> y pegá ahí la URL y la clave <i>anon</i> ' +
      'de tu proyecto. Están en Supabase → Project Settings → API.</div>';
    $('loginForm').querySelectorAll('input,button').forEach(e => (e.disabled = true));
    return;
  }
  const user = await db.currentUser();
  if (user && await db.isAdmin()) return enter(user);
  if (user) {
    // tiene sesión pero no está autorizado
    await db.signOut();
    $('loginMsg').innerHTML =
      '<div class="msg-box">Esa cuenta existe pero no tiene permiso de administrador.<br><br>' +
      'Corré esto en Supabase → SQL Editor:<br>' +
      '<code style="font-size:.74rem">insert into admin_users (user_id) select id from auth.users ' +
      "where email = '" + esc(user.email) + "';</code></div>";
  }
}

$('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = $('loginBtn');
  btn.disabled = true; btn.textContent = 'Entrando…';
  $('loginMsg').innerHTML = '';
  try {
    const user = await db.signIn($('email').value.trim(), $('pass').value);
    if (!await db.isAdmin()) {
      await db.signOut();
      throw new Error('Esa cuenta no tiene permiso de administrador. Revisá la tabla admin_users.');
    }
    enter(user);
  } catch (err) {
    $('loginMsg').innerHTML = `<div class="msg-box">${esc(err.message)}</div>`;
  } finally {
    btn.disabled = false; btn.textContent = 'Entrar';
  }
});

async function enter(user) {
  $('loginWrap').style.display = 'none';
  $('shell').classList.add('on');
  $('whoami').textContent = user.email;
  await refreshAll();
}

$('btnOut').addEventListener('click', async () => {
  await db.signOut();
  location.reload();
});
$('btnShop').addEventListener('click', () => window.open('index.html', '_blank'));

// ---------- navegación ----------
document.querySelectorAll('.navbtn[data-page]').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.navbtn[data-page]').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    const map = { dash: 'pgDash', prods: 'pgProds', orders: 'pgOrders', config: 'pgConfig' };
    document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
    $(map[b.dataset.page]).classList.add('on');
    window.scrollTo({ top: 0 });
  });
});

document.querySelectorAll('[data-close]').forEach(b => {
  b.addEventListener('click', () => $(b.dataset.close).classList.remove('on'));
});
document.querySelectorAll('.ov').forEach(ov => {
  ov.addEventListener('click', e => { if (e.target === ov) ov.classList.remove('on'); });
});

async function refreshAll() {
  try {
    [PRODUCTS, ORDERS, CATEGORIES, SETTINGS] = await Promise.all([
      db.adminGetProducts(), db.adminGetOrders(), db.adminGetCategories(), db.adminGetSettings(),
    ]);
    renderDash(); renderProds(); renderOrders(); fillConfig();
  } catch (err) {
    toast(err.message, 'err');
  }
}
$('btnRefresh').addEventListener('click', () => { refreshAll(); toast('Datos actualizados', 'ok'); });

// ============================================================
//  TABLERO
// ============================================================
function renderDash() {
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const mes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

  // Solo cuentan como venta los pedidos que no se cancelaron.
  const vendidos = ORDERS.filter(o => o.status !== 'cancelado');
  const suma = arr => arr.reduce((a, o) => a + Number(o.total || 0), 0);

  const deHoy = vendidos.filter(o => new Date(o.created_at) >= hoy);
  const delMes = vendidos.filter(o => new Date(o.created_at) >= mes);
  const nuevos = ORDERS.filter(o => o.status === 'nuevo');
  const pendientes = ORDERS.filter(o => ['nuevo', 'pendiente', 'confirmado', 'preparando'].includes(o.status));
  const piezas = vendidos.reduce((a, o) => a + (o.order_items || []).reduce((b, i) => b + i.qty, 0), 0);

  const umbral = Number(SETTINGS?.low_stock_threshold ?? 3);
  const pocos = [];
  const agotados = [];
  PRODUCTS.forEach(p => p.variants.forEach(v => {
    if (v.stock === 0) agotados.push({ p, v });
    else if (v.stock <= umbral) pocos.push({ p, v });
  }));

  // valor del inventario al costo: lo que tenés metido en mercadería
  const valor = PRODUCTS.reduce((a, p) => a + p.stock * (p.cost || 0), 0);
  const valorVenta = PRODUCTS.reduce((a, p) => a + p.stock * p.finalPrice, 0);

  const card = (k, v, n, c = '') =>
    `<div class="stat ${c}"><div class="k">${k}</div><div class="v">${v}</div>${n ? `<div class="n">${n}</div>` : ''}</div>`;

  $('statCards').innerHTML = [
    card('Ventas de hoy', money(suma(deHoy)), `${deHoy.length} pedido${deHoy.length === 1 ? '' : 's'}`, 'green'),
    card('Ventas del mes', money(suma(delMes)), `${delMes.length} pedido${delMes.length === 1 ? '' : 's'}`, 'green'),
    card('Pedidos nuevos', nuevos.length, 'Sin revisar', nuevos.length ? 'red' : ''),
    card('Pedidos pendientes', pendientes.length, 'Sin entregar', 'cyan'),
    card('Productos vendidos', piezas, 'Piezas en total'),
    card('Poco stock', pocos.length, `${umbral} o menos`, pocos.length ? 'amber' : ''),
    card('Agotados', agotados.length, 'Combinaciones en cero', agotados.length ? 'red' : ''),
    card('Valor del inventario', money(valor), `${money(valorVenta)} a precio de venta`, 'cyan'),
  ].join('');

  // más vendidos
  const top = [...PRODUCTS].filter(p => p.soldCount > 0).sort((a, b) => b.soldCount - a.soldCount).slice(0, 8);
  $('topBody').innerHTML = top.length ? top.map(p => `<tr>
      <td>${esc(p.name)}</td>
      <td><b>${p.soldCount}</b></td>
      <td>${p.stock}</td>
      <td>${money(p.finalPrice)}</td></tr>`).join('')
    : `<tr><td colspan="4" class="empty">Todavía no hay ventas registradas</td></tr>`;

  // necesitan atención
  const alertas = [...agotados.map(x => ({ ...x, tipo: 'out' })), ...pocos.map(x => ({ ...x, tipo: 'low' }))];
  $('alertBody').innerHTML = alertas.length ? alertas.slice(0, 25).map(({ p, v, tipo }) => `<tr>
      <td>${esc(p.name)}</td>
      <td>${esc(v.size)} / ${esc(v.color)}</td>
      <td>${v.stock}</td>
      <td>${tipo === 'out'
        ? '<span class="pill-s bad">🔴 Agotado</span>'
        : '<span class="pill-s warn">⚠️ Poco stock</span>'}</td></tr>`).join('')
    : `<tr><td colspan="4" class="empty">Todo con stock suficiente</td></tr>`;
}

// ============================================================
//  PRODUCTOS
// ============================================================
function estadoProducto(p) {
  if (p.rawStatus === 'hidden')  return '<span class="pill-s mute">👁 Oculto</span>';
  if (p.rawStatus === 'sold_out' || p.stock === 0) return '<span class="pill-s bad">🔴 Agotado</span>';
  const umbral = p.lowStockThreshold || 3;
  if (p.stock <= umbral) return '<span class="pill-s warn">⚠️ Poco stock</span>';
  return '<span class="pill-s ok">✅ Disponible</span>';
}

function renderProds() {
  const q = $('prodSearch').value.trim().toLowerCase();
  const list = PRODUCTS.filter(p => !q ||
    p.name.toLowerCase().includes(q) ||
    (p.sku || '').toLowerCase().includes(q) ||
    (p.categoryName || '').toLowerCase().includes(q));

  $('prodBody').innerHTML = list.length ? list.map(p => `<tr>
      <td>${p.images[0] ? `<img class="th" src="${esc(p.images[0])}" alt="">` : '—'}</td>
      <td><b>${esc(p.name)}</b>${p.featured ? ' ⭐' : ''}</td>
      <td>${esc(p.sku || '—')}</td>
      <td>${esc(p.categoryName || '—')}</td>
      <td>${p.salePrice != null
            ? `${money(p.salePrice)} <span style="color:var(--muted);text-decoration:line-through;font-size:.78rem">${money(p.price)}</span>`
            : money(p.price)}</td>
      <td>${p.stock}</td>
      <td>${p.soldCount}</td>
      <td>${estadoProducto(p)}</td>
      <td><div class="row-btns">
        <button class="b sm" data-edit="${p.id}">Editar</button>
        <button class="b sm danger" data-del="${p.id}">Eliminar</button>
      </div></td></tr>`).join('')
    : `<tr><td colspan="9" class="empty">${q ? 'Sin resultados' : 'Todavía no hay productos. Tocá “Nueva prenda”.'}</td></tr>`;

  $('prodBody').querySelectorAll('[data-edit]').forEach(b =>
    b.addEventListener('click', () => openProd(PRODUCTS.find(p => p.id === b.dataset.edit))));
  $('prodBody').querySelectorAll('[data-del]').forEach(b =>
    b.addEventListener('click', () => borrarProducto(b.dataset.del)));
}
$('prodSearch').addEventListener('input', renderProds);

async function borrarProducto(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!confirm(`¿Eliminar "${p.name}"?\n\nSe borra junto con su inventario. Los pedidos ya hechos conservan el nombre y el precio.\n\nEsto no se puede deshacer.`)) return;
  try {
    await db.adminDeleteProduct(id);
    toast('Producto eliminado', 'ok');
    await refreshAll();
  } catch (err) { toast(err.message, 'err'); }
}

// ============================================================
//  EDITOR DE PRODUCTO
// ============================================================
const vKey = (s, c) => `${s}|${c}`;

function openProd(p) {
  editing = p || null;
  $('prodTitle').textContent = p ? 'Editar prenda' : 'Nueva prenda';

  $('pCat').innerHTML = '<option value="">Sin categoría</option>' +
    CATEGORIES.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');

  $('pName').value   = p?.name || '';
  $('pSku').value    = p?.sku || '';
  $('pCat').value    = p?.categoryId || '';
  $('pDesc').value   = p?.description || '';
  $('pPrice').value  = p?.price ?? '';
  $('pSale').value   = p?.salePrice ?? '';
  $('pCost').value   = p?.cost ?? '';
  $('pStatus').value = p?.rawStatus || 'available';
  $('pPos').value    = p?.position ?? 0;
  $('pLow').value    = p?.lowStockThreshold ?? 3;
  $('pFeat').checked = Boolean(p?.featured);

  draft = { images: [...(p?.images || [])], sizes: [], colors: [], stock: {}, variantIds: {} };
  (p?.variants || []).forEach(v => {
    if (!draft.sizes.includes(v.size))   draft.sizes.push(v.size);
    if (!draft.colors.includes(v.color)) draft.colors.push(v.color);
    draft.stock[vKey(v.size, v.color)] = v.stock;
    draft.variantIds[vKey(v.size, v.color)] = v.id;
  });

  renderImgs(); renderChips(); renderMatrix();
  $('ovProd').classList.add('on');
  $('ovProd').scrollTop = 0;
}
$('btnNewProd').addEventListener('click', () => openProd(null));

// ---------- fotos ----------
function renderImgs() {
  $('pImgs').innerHTML = draft.images.map((url, i) => `
    <div class="ph ${i === 0 ? 'first' : ''}">
      <img src="${esc(url)}" alt="">
      <button type="button" data-rm="${i}" title="Quitar">&times;</button>
    </div>`).join('');
  $('pImgs').querySelectorAll('[data-rm]').forEach(b =>
    b.addEventListener('click', () => {
      draft.images.splice(Number(b.dataset.rm), 1);
      renderImgs();
    }));
}

$('pDrop').addEventListener('click', () => $('pFile').click());
$('pFile').addEventListener('change', async e => {
  const files = [...e.target.files];
  if (!files.length) return;
  const drop = $('pDrop');
  const original = drop.textContent;
  let n = 0;
  for (const f of files) {
    n++;
    drop.textContent = `Subiendo ${n} de ${files.length}…`;
    try {
      const url = await db.adminUploadImage(f);
      draft.images.push(url);
      renderImgs();
    } catch (err) {
      toast(`No se pudo subir ${f.name}: ${err.message}`, 'err');
    }
  }
  drop.textContent = original;
  e.target.value = '';
  toast('Fotos subidas', 'ok');
});

$('btnAddImgUrl').addEventListener('click', () => {
  const u = $('pImgUrl').value.trim();
  if (!u) return;
  draft.images.push(u);
  $('pImgUrl').value = '';
  renderImgs();
});

// ---------- tallas y colores ----------
function renderChips() {
  const pinta = (arr, cont, tipo) => {
    $(cont).innerHTML = arr.map(v => `
      <span class="chip-x">${esc(v)}<button type="button" data-${tipo}="${esc(v)}">&times;</button></span>`).join('');
    $(cont).querySelectorAll(`[data-${tipo}]`).forEach(b =>
      b.addEventListener('click', () => {
        const val = b.dataset[tipo];
        if (tipo === 'size') draft.sizes = draft.sizes.filter(x => x !== val);
        else                 draft.colors = draft.colors.filter(x => x !== val);
        renderChips(); renderMatrix();
      }));
  };
  pinta(draft.sizes, 'sizeChips', 'size');
  pinta(draft.colors, 'colorChips', 'color');

  const rapidos = (lista, cont, arrName) => {
    $(cont).innerHTML = lista
      .filter(v => !draft[arrName].includes(v))
      .map(v => `<button type="button" data-q="${esc(v)}">+ ${esc(v)}</button>`).join('');
    $(cont).querySelectorAll('[data-q]').forEach(b =>
      b.addEventListener('click', () => { draft[arrName].push(b.dataset.q); renderChips(); renderMatrix(); }));
  };
  rapidos(TALLAS_RAPIDAS, 'sizeQuick', 'sizes');
  rapidos(COLORES_RAPIDOS, 'colorQuick', 'colors');
}

function addValor(inputId, arrName) {
  const v = $(inputId).value.trim();
  if (!v) return;
  if (!draft[arrName].includes(v)) draft[arrName].push(v);
  $(inputId).value = '';
  renderChips(); renderMatrix();
}
$('btnAddSize').addEventListener('click', () => addValor('sizeNew', 'sizes'));
$('btnAddColor').addEventListener('click', () => addValor('colorNew', 'colors'));
$('sizeNew').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addValor('sizeNew', 'sizes'); } });
$('colorNew').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addValor('colorNew', 'colors'); } });

// ---------- matriz talla x color ----------
function renderMatrix() {
  const sizes  = draft.sizes.length  ? draft.sizes  : ['Única'];
  const colors = draft.colors.length ? draft.colors : ['Único'];

  $('matrix').innerHTML = `<table>
    <thead><tr><th>Color \\ Talla</th>${sizes.map(s => `<th>${esc(s)}</th>`).join('')}</tr></thead>
    <tbody>${colors.map(c => `<tr>
      <td><b>${esc(c)}</b></td>
      ${sizes.map(s => {
        const k = vKey(s, c);
        const val = draft.stock[k] ?? 0;
        return `<td><input type="number" min="0" value="${val}" data-k="${esc(k)}"
                   class="${Number(val) === 0 ? 'zero' : ''}" /></td>`;
      }).join('')}</tr>`).join('')}</tbody></table>`;

  $('matrix').querySelectorAll('input[data-k]').forEach(inp =>
    inp.addEventListener('input', () => {
      const n = Math.max(0, Number(inp.value) || 0);
      draft.stock[inp.dataset.k] = n;
      inp.classList.toggle('zero', n === 0);
      totalMatriz();
    }));
  totalMatriz();
}

function totalMatriz() {
  const sizes  = draft.sizes.length  ? draft.sizes  : ['Única'];
  const colors = draft.colors.length ? draft.colors : ['Único'];
  let total = 0, cero = 0;
  sizes.forEach(s => colors.forEach(c => {
    const n = draft.stock[vKey(s, c)] ?? 0;
    total += n;
    if (n === 0) cero++;
  }));
  $('matrixTotal').textContent =
    `Stock total: ${total} unidades · ${sizes.length * colors.length} combinaciones` +
    (cero ? ` · ${cero} en cero (se mostrarán agotadas)` : '');
}

// ---------- guardar ----------
$('btnSaveProd').addEventListener('click', async () => {
  const name = $('pName').value.trim();
  const price = Number($('pPrice').value);
  if (!name)  return toast('Escribí el nombre del producto.', 'err');
  if (!price || price <= 0) return toast('Escribí un precio normal mayor a cero.', 'err');

  const sale = $('pSale').value === '' ? null : Number($('pSale').value);
  if (sale != null && sale >= price) {
    return toast('El precio de oferta tiene que ser menor que el precio normal.', 'err');
  }

  const sizes  = draft.sizes.length  ? draft.sizes  : ['Única'];
  const colors = draft.colors.length ? draft.colors : ['Único'];
  const variants = [];
  sizes.forEach(s => colors.forEach(c => {
    const k = vKey(s, c);
    variants.push({ id: draft.variantIds[k], size: s, color: c, stock: draft.stock[k] ?? 0 });
  }));

  const btn = $('btnSaveProd');
  btn.disabled = true; btn.textContent = 'Guardando…';
  try {
    await db.adminSaveProduct({
      id: editing?.id,
      name, sku: $('pSku').value.trim(),
      description: $('pDesc').value.trim(),
      categoryId: $('pCat').value || null,
      price, salePrice: sale,
      cost: Number($('pCost').value) || 0,
      status: $('pStatus').value,
      featured: $('pFeat').checked,
      position: Number($('pPos').value) || 0,
      lowStockThreshold: Number($('pLow').value) || 3,
      images: draft.images,
    }, variants);
    $('ovProd').classList.remove('on');
    toast(editing ? 'Prenda actualizada' : 'Prenda creada', 'ok');
    await refreshAll();
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    btn.disabled = false; btn.textContent = 'Guardar prenda';
  }
});

// ============================================================
//  PEDIDOS
// ============================================================
function renderOrders() {
  const q = $('orderSearch').value.trim().toLowerCase();
  const filtro = $('orderFilter').value;
  const list = ORDERS.filter(o => {
    if (filtro && o.status !== filtro) return false;
    if (!q) return true;
    return orderCode(o.order_number).includes(q) ||
           String(o.order_number).includes(q) ||
           (o.customer_name || '').toLowerCase().includes(q) ||
           (o.customer_phone || '').includes(q);
  });

  $('orderBody').innerHTML = list.length ? list.map(o => {
    const items = o.order_items || [];
    const piezas = items.reduce((a, i) => a + i.qty, 0);
    const e = ESTADOS[o.status] || { t: o.status, c: 'mute' };
    return `<tr>
      <td><b>${orderCode(o.order_number)}</b></td>
      <td>${fecha(o.created_at)}</td>
      <td>${esc(o.customer_name)}</td>
      <td>${esc(o.customer_phone)}</td>
      <td>${items.length} ${items.length === 1 ? 'línea' : 'líneas'} · ${piezas} pz</td>
      <td><b>${money(o.total)}</b></td>
      <td><span class="pill-s ${e.c}">${e.t}</span>
          ${o.stock_applied ? '<br><span class="pill-s mute" style="margin-top:4px">stock descontado</span>' : ''}</td>
      <td><button class="b sm" data-ver="${o.id}">Ver</button></td></tr>`;
  }).join('')
    : `<tr><td colspan="8" class="empty">${q || filtro ? 'Sin resultados' : 'Todavía no hay pedidos'}</td></tr>`;

  $('orderBody').querySelectorAll('[data-ver]').forEach(b =>
    b.addEventListener('click', () => verPedido(b.dataset.ver)));
}
$('orderSearch').addEventListener('input', renderOrders);
$('orderFilter').addEventListener('change', renderOrders);

function verPedido(id) {
  const o = ORDERS.find(x => x.id === id);
  if (!o) return;
  openOrder = o;
  $('orderTitle').textContent = `Pedido ${orderCode(o.order_number)}`;

  const items = o.order_items || [];
  const fila = (k, v) => v ? `<div class="r"><span>${k}</span><span>${esc(v)}</span></div>` : '';

  $('orderDetail').innerHTML = `
    <div class="stat" style="margin-bottom:18px">
      <div class="k">Recibido</div>
      <div class="v" style="font-size:1rem">${fecha(o.created_at)}</div>
    </div>

    <h3 style="font-size:.74rem;letter-spacing:.16em;text-transform:uppercase;color:var(--red);margin-bottom:10px">Productos</h3>
    ${items.map(i => `
      <div class="stat" style="margin-bottom:9px;padding:13px 15px">
        <div style="font-weight:700;margin-bottom:6px">${esc(i.product_name)}</div>
        <div style="color:var(--muted);font-size:.82rem;line-height:1.7">
          ${i.color && i.color !== 'Único' ? `Color: ${esc(i.color)}<br>` : ''}
          ${i.size && i.size !== 'Única' ? `Talla: ${esc(i.size)}<br>` : ''}
          Cantidad: ${i.qty} × ${money(i.unit_price)}
          <span style="float:right;color:var(--cyan)"><b>${money(i.subtotal)}</b></span>
        </div>
      </div>`).join('')}

    <div class="stat" style="margin:14px 0 18px">
      <div style="display:flex;justify-content:space-between;padding:3px 0;color:var(--muted)">
        <span>Productos</span><span>${money(o.subtotal)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:3px 0;color:var(--muted)">
        <span>Envío</span><span>${Number(o.shipping) === 0 ? 'Gratis' : money(o.shipping)}</span></div>
      <div style="display:flex;justify-content:space-between;padding:9px 0 0;margin-top:7px;
                  border-top:1px solid var(--border);font-size:1.15rem;font-weight:700">
        <span>TOTAL</span><span style="color:var(--cyan)">${money(o.total)}</span></div>
    </div>

    <h3 style="font-size:.74rem;letter-spacing:.16em;text-transform:uppercase;color:var(--red);margin-bottom:10px">Cliente</h3>
    <div class="stat">
      ${fila('Nombre', o.customer_name)}
      ${fila('Teléfono', o.customer_phone)}
      ${fila('WhatsApp', o.customer_whatsapp)}
      ${fila('Departamento', o.department)}
      ${fila('Municipio', o.municipality)}
      ${fila('Dirección', o.address)}
      ${fila('Referencia', o.reference)}
      ${fila('Recibe', o.receiver)}
      ${fila('Forma de pago', o.payment_method)}
      ${fila('Observaciones', o.notes)}
    </div>
    ${o.stock_applied
      ? '<div class="msg-box warn" style="margin-top:16px">El stock de este pedido ya fue descontado del inventario. Si lo cancelás, las unidades vuelven solas.</div>'
      : '<div class="msg-box warn" style="margin-top:16px">El stock todavía NO se descontó. Se descuenta al pasar el pedido a Confirmado.</div>'}`;

  $('orderStatus').innerHTML = Object.entries(ESTADOS)
    .map(([k, v]) => `<option value="${k}" ${o.status === k ? 'selected' : ''}>${v.t}</option>`).join('');
  $('ovOrder').classList.add('on');
  $('ovOrder').scrollTop = 0;
}

$('btnSaveStatus').addEventListener('click', async () => {
  if (!openOrder) return;
  const nuevo = $('orderStatus').value;
  const btn = $('btnSaveStatus');
  btn.disabled = true; btn.textContent = 'Guardando…';
  try {
    const r = await db.adminSetOrderStatus(openOrder.id, nuevo);
    toast(nuevo === 'cancelado' && openOrder.stock_applied
      ? 'Pedido cancelado y unidades devueltas al inventario'
      : (r?.stock_applied && !openOrder.stock_applied
          ? 'Estado guardado y stock descontado'
          : 'Estado guardado'), 'ok');
    $('ovOrder').classList.remove('on');
    await refreshAll();
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    btn.disabled = false; btn.textContent = 'Guardar estado';
  }
});

$('btnWaCustomer').addEventListener('click', () => {
  if (!openOrder) return;
  const n = openOrder.customer_whatsapp || openOrder.customer_phone;
  const texto = `Hola ${openOrder.customer_name} 👋\n\n` +
    `Te escribimos de ${SETTINGS?.store_name || 'GymStreet'} por tu pedido ${orderCode(openOrder.order_number)}.`;
  window.open(waLink(n, texto), '_blank');
});

// ============================================================
//  CONFIGURACIÓN
// ============================================================
function fillConfig() {
  if (!SETTINGS) return;
  $('cName').value  = SETTINGS.store_name || '';
  $('cWa').value    = SETTINGS.whatsapp_number || '';
  $('cShip').value  = SETTINGS.shipping_price ?? '';
  $('cFree').value  = SETTINGS.free_shipping_from ?? '';
  $('cLow').value   = SETTINGS.low_stock_threshold ?? 3;
  $('cLogo').value  = SETTINGS.logo_url || '';
  $('cIg').value    = SETTINGS.instagram_url || '';
  $('cFb').value    = SETTINGS.facebook_url || '';
  $('cAddr').value  = SETTINGS.store_address || '';
  $('cIntro').value = SETTINGS.whatsapp_intro || '';
  $('cPays').value  = (SETTINGS.payment_methods || []).join('\n');
}

$('btnSaveConfig').addEventListener('click', async () => {
  const btn = $('btnSaveConfig');
  const wa = $('cWa').value.replace(/\D/g, '');
  if (wa.length < 8) return toast('El número de WhatsApp parece incompleto. Incluí el código de país.', 'err');

  btn.disabled = true; btn.textContent = 'Guardando…';
  try {
    await db.adminSaveSettings({
      store_name: $('cName').value.trim(),
      whatsapp_number: wa,
      shipping_price: $('cShip').value,
      free_shipping_from: $('cFree').value,
      low_stock_threshold: $('cLow').value,
      logo_url: $('cLogo').value.trim(),
      instagram_url: $('cIg').value.trim(),
      facebook_url: $('cFb').value.trim(),
      store_address: $('cAddr').value.trim(),
      whatsapp_intro: $('cIntro').value.trim(),
      payment_methods: $('cPays').value.split('\n').map(s => s.trim()).filter(Boolean),
    });
    toast('Configuración guardada', 'ok');
    await refreshAll();
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    btn.disabled = false; btn.textContent = 'Guardar configuración';
  }
});

// cerrar ventanas con Escape
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.ov.on').forEach(o => o.classList.remove('on'));
});

boot();
