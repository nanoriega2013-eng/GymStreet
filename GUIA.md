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

1. En Supabase: **Project Settings** (el engranaje) → **API**.
2. Copiá **Project URL** y **anon public**.
3. Abrí el archivo `assets/js/config.js` y pegalas:

```js
export const SUPABASE_URL = "https://abcdefgh.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOi...";
```

4. Guardá, hacé commit y push. Vercel publica solo.

---

## 2. ¿Qué variables necesito configurar en Vercel?

**Ninguna.** Y esto conviene que lo entiendas bien.

Tu página es un sitio estático: no se "construye" en Vercel, los archivos se
sirven tal cual. Las variables de entorno de Vercel solo sirven cuando hay un
paso de construcción que las inyecta. Acá no lo hay, así que las claves van
directo en `config.js`.

**¿Y no es peligroso dejar la clave a la vista?** No. La clave `anon` está
*diseñada* para ser pública: viaja al navegador de cada cliente que entra a tu
tienda. Esconderla sería imposible. Lo que protege tus datos son las reglas de
seguridad (RLS) que creó el `schema.sql`:

| Quién | Qué puede hacer |
|---|---|
| Cualquier visitante | Ver el catálogo y el inventario. Crear un pedido. |
| Cualquier visitante | **No** puede ver pedidos, ni clientes, ni el costo de tus productos. |
| Cualquier visitante | **No** puede cambiar precios ni stock. |
| Vos (en `admin_users`) | Todo. |

Lo único que **nunca** se pone en `config.js` es la clave `service_role`. Esa
sí salta todas las reglas. Dejala quieta en Supabase.

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

## 12. Mientras no conectes Supabase

La tienda **no se rompe**. Muestra un aviso amarillo, usa el catálogo de 12
prendas que ya tenía y el carrito funciona. Lo único que no pasa es que los
pedidos se guarden: el cliente puede mandar su WhatsApp, pero vos no vas a
tener registro.

Apenas pegues las claves en `config.js`, el aviso desaparece y todo empieza a
guardarse.
