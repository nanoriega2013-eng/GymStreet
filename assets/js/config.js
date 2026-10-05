// ============================================================
//  GymStreet · Configuración
//  Pegá aquí las dos claves de tu proyecto de Supabase.
//  Están en: Supabase > Project Settings > API
// ============================================================
//
//  ¿Es seguro poner estas claves acá, a la vista?
//  SÍ. La clave "publishable" (antes llamada "anon") está DISEÑADA
//  para ser pública: va en el
//  navegador de todos tus clientes. Lo que protege tus datos no es
//  esconder la clave, son las políticas RLS del archivo
//  supabase/schema.sql, que definen qué puede hacer cada quien.
//  Lo que NUNCA se pone acá es la clave "secret" (antes "service_role").
//
// ============================================================

export const SUPABASE_URL = "https://kqvgklovkaqcndjvznyh.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_fk92-f6-SYOliBy0uQK25w_vdES5II8";

// Número de WhatsApp de respaldo. El real se lee de la base de datos
// (tabla settings) y se cambia desde el panel de administración.
export const WHATSAPP_FALLBACK = "50247176818";

// Mientras no pegues las claves, la tienda sigue funcionando con el
// catálogo fijo que ya tenía la página. Así nunca se cae.
export const isConfigured = () =>
  Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
