# GymStreet · Guía de la tienda

Todo lo que necesitás saber para usar tu tienda, explicado sin tecnicismos.

---

## 1. Lo primero: conectar Supabase

Supabase es la base de datos donde van a vivir tus productos, tu inventario y
tus pedidos. Es gratis para lo que necesitás. **Sin esto la tienda funciona,
pero muestra el catálogo viejo y los pedidos no se guardan.**

Son unos 10 minutos, una sola vez.

### Paso 1 · Crear la cuenta y el proyecto

1. Entrá a <https://supabase.com> y tocá **Start your project**. Podés entrar
   con tu cuenta de GitHub.
2. Tocá **New project**.
3. Ponele de nombre `gymstreet`.
4. **Database Password**: inventá una y guardala en algún lado. No la vas a
   usar seguido, pero si la perdés hay que regenerarla.
5. **Region**: elegí `East US (North Virginia)`. Es la más cercana a Guatemala
   de las gratuitas.
6. Tocá **Create new project** y esperá unos 2 minutos.

### Paso 2 · Crear las tablas

1. En el menú de la izquierda tocá **SQL Editor**.
2. Tocá **New query**.
3. Abrí el archivo `supabase/schema.sql` de este proyecto, copiá **todo** el
   contenido y pegalo ahí.
4. Tocá **Run** (o Ctrl+Enter).
5. Tiene que decir *Success*. Si aparecen avisos en amarillo que dicen
   *"policy does not exist, skipping"*, está bien: es normal la primera vez.

Eso crea las 8 tablas, las reglas de seguridad y el lugar donde se guardan
las fotos.

### Paso 3 · Crear tu usuario de administrador

1. Menú izquierdo → **Authentication** → **Users**.
2. Tocá **Add user** → **Create new user**.
3. Poné tu correo y una contraseña. **Marcá la casilla "Auto Confirm User"**,
   si no, no vas a poder entrar.
4. Tocá **Create user**.

Ahora hay que darle permiso de administrador. Volvé a **SQL Editor** → **New
query**, pegá esto cambiando el correo por el tuyo, y tocá Run:

```sql
insert into admin_users (user_id)
select id from auth.users where email = 'tu-correo@ejemplo.com';
```

### Paso 4 · Cerrar la puerta a desconocidos

Por defecto, Supabase deja que cualquiera se registre. No lo querés.

1. **Authentication** → **Sign In / Providers** → **Email**.
2. Apagá **Allow new users to sign up**.
3. Guardá.

> Aunque alguien lograra registrarse, no podría tocar nada: el panel exige
> estar en la tabla `admin_users`, y vos controlás quién entra ahí. Esto es
> solo una traba más.

### Paso 5 · Pegar las claves en la página

> **Ya está hecho** en tu proyecto. Esto queda por si alguna vez tenés que
> cambiarlas.

1. En Supabase: **Project Settings** (el engranaje) → **API Keys**.
2. Copiá la **Publishable key** (empieza con `sb_publishable_`). Es la que
   antes se llamaba *anon*; Supabase la renombró en 2025.
3. La **Project URL** está en **Project Settings → Data API**. Es la base,
   sin nada después del `.co`:
   - ✅ `https://kqvgklovkaqcndjvznyh.supabase.co`
   - ❌ `https://kqvgklovkaqcndjvznyh.supabase.co/rest/v1/`
4. Abrí `assets/js/config.js` y pegalas:

```js
export const SUPABASE_URL = "https://kqvgklovkaqcndjvznyh.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_...";
```

5. Guardá, hacé commit y push. Vercel publica solo.

---

## 2. ¿Qué variables necesito configurar en Vercel?

**Ninguna.** Y esto conviene que lo entiendas bien.

Tu página es un sitio estático: no se "construye" en Vercel, los archivos se
sirven tal cual. Las variables de entorno de Vercel solo sirven cuando hay un
paso de construcción que las inyecta. Acá no lo hay, así que las claves van
directo en `config.js`.

**¿Y no es peligroso dejar la clave a la vista?** No. La clave *publishable*
está **diseñada** para ser pública: viaja al navegador de cada cliente que entra
a tu tienda. Esconderla sería imposible. La propia pantalla de Supabase lo dice:
*"This key is safe to use in a browser if you have enabled Row Level Security"*.
Lo que protege tus datos son las reglas de seguridad (RLS) que creó el
`schema.sql`:

| Quién | Qué puede hacer |
|---|---|
| Cualquier visitante | Ver el catálogo y el inventario. Crear un pedido. |
| Cualquier visitante | **No** puede ver pedidos, ni clientes, ni el costo de tus productos. |
| Cualquier visitante | **No** puede cambiar precios ni stock. |
| Vos (en `admin_users`) | Todo. |

Lo único que **nunca** se pone en `config.js` es la **Secret key**
(`sb_secret_…`, antes llamada `service_role`). Esa sí salta todas las reglas.
Dejala quieta en Supabase.

Hay otra protección importante: cuando un cliente hace un pedido, **los precios
se calculan en el servidor**, leyendo tu tabla de productos. Aunque alguien
manipule la página para decir que una camisa cuesta Q1, el pedido se guarda con
el precio real. Lo probé.

---

## 3. Cómo entrar al administrador

Andá a **tu-sitio.com/admin.html** y entrá con el correo y la contraseña del
Paso 3.

> El panel no está enlazado desde la tienda a propósito, para que los clientes
> no lo encuentren de casualidad. Guardate la dirección en favoritos.

---

## 4. Cómo agregar un producto

1. Entrá al panel → **Productos** → **＋ Nueva prenda**.
2. Llená nombre y precio (son los únicos obligatorios).
3. **Precio de oferta**: si lo ponés, la tienda muestra el precio tachado y
   calcula sola el porcentaje de descuento. Dejalo vacío si no hay oferta.
4. **Costo**: lo que a vos te cuesta. Sirve para saber cuánto tenés invertido
   en mercadería. **El cliente nunca lo ve.**
5. **Fotos**: tocá la caja gris y elegí las fotos. Desde el teléfono te abre la
   cámara o la galería. Podés subir varias de una. La primera es la portada.
6. **Inventario**: ver abajo.
7. **Guardar prenda**.

### El inventario por talla y color

Esta es la parte importante. Primero elegís las tallas (hay botones rápidos:
XS, S, M, L, XL, XXL) y los colores. La página arma sola una cuadrícula:

|              | M | L | XL |
|--------------|---|---|----|
| **Negro**    | 5 | 2 | 0  |
| **Blanco**   | 4 | 0 | 0  |

Escribís cuántas tenés de cada combinación. Las que están en cero se marcan en
rojo, y en la tienda el cliente **no las puede elegir**: le aparecen tachadas.

Si una prenda no tiene tallas ni colores, no agregues ninguno: queda como
"Única / Único" y funciona igual.

---

## 5. Cómo modificar el stock

**Productos** → **Editar** en la prenda → cambiá los números de la cuadrícula →
**Guardar prenda**.

Además, el stock baja solo: cuando pasás un pedido a **Confirmado**, se
descuentan las unidades. Si después lo cancelás, vuelven al inventario.

El sistema nunca deja que el stock quede en negativo.

---

## 5B. Cómo subir fotos de clientes (Comunidad)

Es la pestaña **Comunidad** de la tienda: las fotos reales de la gente que ya
compró. Ahora se cargan desde el panel, ya no hay que tocar código.

**Antes de usarla por primera vez**, una sola vez: abrí Supabase →
**SQL Editor** → **New query**, pegá todo el archivo `supabase/comunidad.sql`
y tocá **Run**. Eso crea la tabla y sube de una vez las fotos que ya tenía la
página.

Después, para agregar una foto:

1. Entrá al panel → **📸 Comunidad** → **＋ Nueva foto**.
2. Tocá el recuadro de la cámara y elegí la foto desde el teléfono o la
   computadora. Podés elegir varias: la primera es la portada, las demás se
   ven al tocar la foto en la tienda.
3. Escribí el texto que va debajo (ej: *Gracias por tu compra @usuario*).
   Podés dejarlo vacío.
4. **Orden**: el número más bajo aparece primero. Si querés que la foto nueva
   salga de primera, poné 0.
5. Dejá marcado **Publicada en la tienda** y tocá **Guardar foto**.

Ya queda arriba. Refrescá la tienda y la vas a ver en **Comunidad**.

**Para esconder una foto sin borrarla** (por ejemplo, si el cliente te pide que
la bajes): **Editar** → desmarcá *Publicada en la tienda* → **Guardar foto**.
Queda guardada pero nadie la ve.

**Para borrarla de verdad**: **Eliminar**. Eso no se puede deshacer.

Las fotos se guardan en el mismo lugar que las de los productos (Supabase
Storage), así que no ocupan espacio en la página.

---

## 6. Cómo ver y manejar los pedidos

**Pedidos** te muestra la tabla con número, fecha, cliente, teléfono, productos,
total y estado. Tocá **Ver** para abrir uno y leer toda la dirección de entrega.

Los estados son: Nuevo → Pendiente de confirmar → Confirmado → Preparando →
Enviado → Entregado. Y aparte, Cancelado.

**Lo que tenés que recordar:** el stock se descuenta cuando pasás el pedido a
**Confirmado**. Antes de eso no se toca. Dentro del pedido siempre hay un aviso
que te dice si ya se descontó o no.

Hay un botón **Escribir al cliente** que te abre WhatsApp con su número.

### Lo importante: el pedido se guarda ANTES de abrir WhatsApp

Cuando un cliente toca "Confirmar y enviar por WhatsApp", el pedido se guarda
primero en la base de datos y después se abre WhatsApp. O sea: **aunque el
cliente se arrepienta y no mande el mensaje, vos vas a ver que intentó
comprar**, con todos sus datos y qué quería. Eso es un cliente que podés
recuperar.

---

## 7. Cómo cambiar el número de WhatsApp

**Configuración** → **Número de WhatsApp** → **Guardar configuración**.

Escribilo con código de país y sin guiones ni espacios: `50247176818`. Si lo
ponés con guiones igual funciona, el sistema los limpia solo.

Ese número se usa en toda la tienda: los botones del encabezado, el pie, la
barra del teléfono y los pedidos.

---

## 8. Cómo cambiar el precio de envío

**Configuración**:

- **Precio de envío**: lo que cobrás. Si lo dejás en 0 y no ponés envío gratis,
  la tienda dice "A convenir" en vez de prometer envío gratis.
- **Envío gratis a partir de**: si ponés 500, los pedidos de Q500 o más no
  pagan envío. Dejalo vacío si nunca regalás el envío.

### Si no hacés envíos a algún departamento

Abrí `assets/js/shop.js` y buscá arriba del todo:

```js
const ZONAS_SIN_ENVIO = [];
```

Poné los departamentos adentro:

```js
const ZONAS_SIN_ENVIO = ['Petén', 'Izabal'];
```

El cliente que elija uno de esos va a ver un aviso y no va a poder terminar
el pedido.

---

## 9. Cómo funciona la base de datos

Son 8 tablas:

| Tabla | Qué guarda |
|---|---|
| `products` | Las prendas: nombre, precios, costo, fotos, estado |
| `product_variants` | El inventario real: una fila por cada talla + color |
| `categories` | Camisas, Pants, Oversize, Shorts, Hoodies, Accesorios |
| `customers` | Los datos de quien compró |
| `orders` | Los pedidos con su número, totales y estado |
| `order_items` | Las líneas de cada pedido |
| `settings` | Tu configuración (una sola fila) |
| `admin_users` | Quién puede entrar al panel |

Dos detalles pensados a propósito:

- **Los pedidos guardan una copia** del nombre y el precio del producto. Si
  después cambiás el precio o borrás la prenda, los pedidos viejos siguen
  mostrando lo que el cliente pagó de verdad.
- **El número de pedido** lo lleva la base de datos, no el navegador. Nunca se
  repite, aunque dos personas compren al mismo tiempo.

---

## 10. Cómo probar un pedido completo

Hacelo una vez antes de publicar, para ver todo el camino:

1. Entrá al panel y creá una prenda de prueba con stock 2 en talla M.
2. Abrí la tienda en otra pestaña. Tiene que aparecer.
3. Elegí talla M, cantidad 1, **Agregar al carrito**.
4. Probá poner cantidad 5: no te deja pasar de 2.
5. **Realizar pedido**, llená tus datos y tocá **Ver resumen**.
6. Revisá que el resumen esté bien y tocá **Confirmar y enviar por WhatsApp**.
7. Se abre WhatsApp con el mensaje armado. **No hace falta que lo envíes.**
8. Volvé al panel → **Pedidos**. Ahí está, con estado **Nuevo**.
9. Abrilo y pasalo a **Confirmado**.
10. Andá a **Productos**: el stock de esa talla bajó de 2 a 1.
11. Volvé al pedido y pasalo a **Cancelado**: el stock vuelve a 2.
12. Borrá la prenda de prueba.

Si todos esos pasos funcionan, la tienda está lista.

---

## 11. Archivos

### Nuevos

| Archivo | Para qué |
|---|---|
| `admin.html` | El panel de administración |
| `supabase/schema.sql` | Las tablas y la seguridad. Se pega en Supabase |
| `supabase/comunidad.sql` | La tabla de las fotos de la comunidad. Se pega en Supabase una sola vez |
| `assets/js/config.js` | **Acá pegás tus claves de Supabase** |
| `assets/js/db.js` | Todo lo que habla con la base de datos |
| `assets/js/shop.js` | La lógica de la tienda |
| `assets/js/cart.js` | El carrito |
| `assets/js/whatsapp.js` | Arma el mensaje del pedido |
| `assets/js/admin.js` | La lógica del panel |
| `assets/css/shop.css` | Estilos del carrito y el checkout |
| `assets/css/admin.css` | Estilos del panel |
| `GUIA.md` | Esto que estás leyendo |

### Modificados

| Archivo | Qué cambió |
|---|---|
| `index.html` | Se agregó el botón del carrito, el selector de talla y color, el cajón del carrito y el formulario de pedido. **El diseño, los colores, el logo y la estructura quedaron igual.** El código que estaba suelto adentro del archivo se movió a `assets/js/shop.js` |

---

## 12. Si la base de datos no responde

La tienda **no se rompe nunca**. Si Supabase no contesta —se cayó, se agotó el
plan gratuito, o un cliente tiene un bloqueador de anuncios que tapa el CDN de
la librería— la página muestra un aviso amarillo, cae al catálogo de respaldo de
12 prendas y el carrito sigue funcionando.

Lo único que no pasa es que los pedidos se guarden: el cliente puede mandar su
WhatsApp, pero vos no vas a tener el registro en el panel.

Es preferible una tienda que vende a medias que una página en blanco.

---

## 13. El diseño nuevo (y cómo tocarlo sin romper nada)

La tienda se rediseñó con la línea visual del retail deportivo moderno
(Gymshark / YoungLA): blanco, negro, tipografía fuerte en mayúsculas,
esquinas rectas y mucho aire. Nada de la lógica cambió: los productos, el
carrito, el checkout y el panel funcionan exactamente igual que antes.

### Dónde está cada cosa

| Qué querés cambiar | Dónde |
|---|---|
| Colores, tipografías, tamaños | `index.html`, bloque `:root` (arriba del todo) |
| Texto de la portada | `index.html`, sección `<!-- PORTADA -->` |
| Barra negra de arriba (envíos, pagos) | `index.html`, sección `<!-- AVISO SUPERIOR -->` |
| Los cuatro datos bajo la portada | `index.html`, sección `<!-- GARANTÍAS -->` |
| Enlaces del pie | `index.html`, sección `<!-- PIE -->` |
| Carrito, checkout y avisos | `assets/css/shop.css` |

### Cambiar el color de toda la tienda

Todo sale de las variables de `:root`. Por ejemplo, para que los botones
dejen de ser negros y pasen a azul marino, cambiás una sola línea:

```css
--ink:#0b0b0b;   /* por ejemplo: #10203f */
```

Y con eso cambian botones, títulos, badges y la portada.

### Poner una foto en la portada

En `index.html`, dentro de `<section class="hero">`, hay una línea comentada:

```html
<!-- <div class="hero-media"><img src="img/portada.jpg" alt="" /></div> -->
```

Quitale los `<!--` y `-->`, subí tu foto a la carpeta `img/` con ese nombre y
listo. Usá una foto horizontal de al menos 1600px de ancho. Encima lleva un
degradado oscuro, así que el texto se sigue leyendo.

### Modo oscuro

El tema oscuro ya está escrito. Para activarlo, en `index.html` cambiá la
primera línea de:

```html
<html lang="es">
```

a:

```html
<html lang="es" data-theme="dark">
```

### El panel de administración

Quedó con su diseño anterior. Es una pantalla que solo ves vos, así que no
corría prisa cambiarla; si querés que también quede clara y formal, se hace
después y por separado.

---

## 14. Subir un drop nuevo

Cuando llega un pedido y querés subir todo de una vez, el camino corto es el
SQL Editor de Supabase en vez de cargar pieza por pieza en el panel.

El drop de noviembre de 2026 ya está preparado así:

- `supabase/drop-noviembre.sql` — las 48 piezas con nombre, precio,
  descripción, tallas, colores y existencias. Se pega en Supabase →
  **SQL Editor** → **Run**. Se puede correr dos veces sin duplicar nada.
- `DROP-NOVIEMBRE.md` — la lista completa: qué pieza es cuál, qué precio
  lleva, cuántas hay y el enlace a Temu para bajar la foto de cada una.

Las piezas entran **sin foto** y la tienda muestra un recuadro que dice
*Foto en camino* (`img/sin-foto.svg`). Las fotos se suben una por una desde
el panel: **Productos** → la pieza → **Fotos**.
