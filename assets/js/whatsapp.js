// ============================================================
//  GymStreet · Mensaje de WhatsApp
// ============================================================

export const money = q => `Q${(Number(q) || 0).toFixed(2)}`;

/** #000125 */
export const orderCode = n => `#${String(n ?? 0).padStart(6, '0')}`;

/**
 * Arma el texto del pedido.
 * Usa saltos de línea normales: encodeURIComponent los convierte en
 * %0A, que es lo que WhatsApp entiende como línea nueva.
 */
export function buildOrderMessage({ order, items, customer, settings, shippingLabel }) {
  const L = [];
  const intro = settings?.whatsapp_intro || '🛍️ NUEVO PEDIDO';

  L.push(intro, '');

  L.push('👤 CLIENTE');
  L.push(`Nombre: ${customer.name}`);
  L.push(`Teléfono: ${customer.phone}`);
  if (customer.whatsapp && customer.whatsapp !== customer.phone) {
    L.push(`WhatsApp: ${customer.whatsapp}`);
  }
  L.push('');

  L.push('📍 ENTREGA');
  if (customer.department)   L.push(`Departamento: ${customer.department}`);
  if (customer.municipality) L.push(`Municipio: ${customer.municipality}`);
  if (customer.address)      L.push(`Dirección: ${customer.address}`);
  if (customer.reference)    L.push(`Referencia: ${customer.reference}`);
  if (customer.receiver)     L.push(`Recibe: ${customer.receiver}`);
  L.push('');

  L.push('🛒 PRODUCTOS');
  items.forEach((it, idx) => {
    L.push(`${idx + 1}. ${it.name}`);
    if (it.color && it.color !== 'Único') L.push(`   Color: ${it.color}`);
    if (it.size  && it.size  !== 'Única') L.push(`   Talla: ${it.size}`);
    L.push(`   Cantidad: ${it.qty}`);
    L.push(`   Precio unitario: ${money(it.unitPrice)}`);
    L.push(`   Subtotal: ${money(it.unitPrice * it.qty)}`);
  });
  L.push('');

  L.push('💰 RESUMEN');
  L.push(`Productos: ${money(order.subtotal)}`);
  L.push(`Envío: ${shippingLabel ?? (Number(order.shipping) === 0 ? 'Gratis' : money(order.shipping))}`);
  L.push(`TOTAL: ${money(order.total)}`);
  L.push('');

  if (customer.payment_method) {
    L.push('💳 Forma de pago:', customer.payment_method, '');
  }
  if (customer.notes) {
    L.push('📝 Observaciones:', customer.notes, '');
  }

  L.push(`Número de pedido: ${orderCode(order.order_number)}`);

  return L.join('\n');
}

/** Enlace listo para abrir la conversación con el texto ya escrito. */
export function waLink(number, text) {
  const limpio = String(number || '').replace(/\D/g, '');
  return `https://wa.me/${limpio}?text=${encodeURIComponent(text)}`;
}

/** Mensaje corto para preguntar por un producto agotado. */
export function restockMessage(productName) {
  return `Hola GymStreet 👋\nVi que *${productName}* está agotado.\n\n¿Me avisas cuando vuelva a entrar?`;
}
