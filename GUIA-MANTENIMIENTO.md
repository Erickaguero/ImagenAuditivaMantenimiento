# Guía de mantenimiento del sitio — Imagen Auditiva

Esta guía explica cómo cambiar el contenido del sitio sin tocar código. Todo se hace desde el
**panel de mantenimiento**, en el navegador.

---

## 1. Entrar al panel

1. Abrí la dirección del panel de mantenimiento. Es privada: no está enlazada desde el sitio ni
   aparece en Google, así que guardala en favoritos y no la compartas.
2. Escribí tu correo y tu contraseña y tocá **Ingresar**.
3. Si olvidaste la contraseña: escribí tu correo y tocá **¿Olvidaste tu contraseña?**. Te llega un
   correo con un enlace para crear una nueva.

Arriba vas a ver cinco pestañas: **Eventos**, **Carrusel**, **Noticias**, **Mensajes** y
**Configuración**. El botón **Ver sitio** abre la página pública en otra pestaña, para revisar cómo quedó.

> El panel funciona desde cualquier país. El sitio público, en cambio, tiene bloqueo por país: para
> ver cómo quedó un cambio desde afuera de la región permitida hace falta una VPN.

---

## 2. Eventos

### Crear un evento
1. Pestaña **Eventos** → botón rojo **Nuevo evento**.
2. Completá:
   - **Artista o nombre del evento** (obligatorio).
   - **Fecha** (obligatoria) y **Hora**. Si la hora no está confirmada, dejala vacía: en el sitio
     aparece "Por confirmar".
   - **Recinto** y **Ciudad**: al escribir aparecen los que ya usaste (Estadio Nacional, Parque Viva…).
   - **Póster**: hacé clic en el recuadro o arrastrá la imagen. Idealmente vertical, como un afiche.
   - **Acerca del evento**: nombre de la gira o una descripción corta.
   - **Biografía del artista**.
3. Tocá **Crear evento**. Aparece un aviso verde "Evento creado ✓".

### Varias fechas de una misma gira (ej.: Karol G 27 y 28 de noviembre)
Creá la primera fecha. Después, en la lista, tocá el ícono de **copiar** (dos hojas) al lado de ese
evento: se abre un formulario con todo copiado. Solo elegí la nueva fecha y hora, cambiá el póster si
es distinto, y tocá **Crear evento**.

### Editar o cambiar el póster
Tocá **Editar** en el evento. Para el póster usá **Cambiar imagen**. Al final, **Guardar cambios**.

### Destacar en el carrusel del inicio
Tocá la **estrella ★** del evento, o usá la pestaña **Carrusel** (ver sección 3).

### Esconder o eliminar
- **Esconder** (recomendado): **Editar** → apagá **Publicado** → **Guardar cambios**. El evento no se
  ve en el sitio pero queda guardado, y lo podés volver a publicar.
- **Eliminar**: ícono del **tacho de basura** → confirmar. No se puede deshacer.

Los eventos cuya fecha ya pasó se mueven solos a la pestaña "Eventos pasados" del sitio; no hace falta
borrarlos. En el panel podés filtrar por **Próximos**, **Pasados** o **Todos**.

---

## 3. Carrusel del inicio

Pestaña **Carrusel**. Arriba ves **cómo se ve ahora** el carrusel grande de la página de inicio;
abajo, la lista de los próximos eventos con un interruptor **En el carrusel**.

- Encendé el interruptor de los eventos que querés mostrar. Se guarda al instante.
- Salen en orden de fecha y, cuando la fecha pasa, salen solos del carrusel.
- Si no elegís ninguno, el sitio muestra automáticamente los 3 próximos eventos.
- Un evento **oculto** o **sin póster** no aparece en el carrusel aunque esté elegido.

---

## 4. Noticias

1. Pestaña **Noticias** → **Nueva noticia**.
2. Completá **Título**, **Fecha de publicación**, **Imagen** (horizontal), **Contenido** (dejá una
   línea en blanco entre párrafos) y, si querés, un **Resumen** corto para la tarjeta.
3. **Mostrar en inicio**: la página de inicio muestra las 3 noticias más recientes que tengan esto
   activado (también se cambia con el ícono de la **casita** en la lista).
4. Tocá **Crear noticia**.

Editar, esconder (apagar **Publicada**) y eliminar funcionan igual que en los eventos.

---

## 5. Mensajes

Acá llegan los mensajes que la gente envía desde la página **Contacto**. El número rojo en la pestaña
indica cuántos no leíste.

- Hacé clic en un mensaje para leerlo completo (queda marcado como leído).
- **Responder por correo** abre tu programa de correo con la dirección ya cargada.
- **Marcar como no leído** o **Eliminar** si ya no lo necesitás.

---

## 6. Configuración del sitio

Pestaña **Configuración**. Al terminar, tocá **Guardar cambios** (arriba o abajo). Los cambios se ven
en el sitio al instante.

- **Logos**: el logo a color (barra de arriba) y el blanco (pie de página). PNG con fondo transparente.
- **Datos de contacto**: correo, teléfono y dirección que aparecen en la página Contacto.
- **Redes sociales**: pegá el enlace completo de cada perfil (por ejemplo
  `https://www.instagram.com/imagenauditiva`). Si una queda vacía, su ícono no se muestra.
  Para WhatsApp usá `https://wa.me/50670329701` (código de país + número, sin espacios ni +).
- **Textos de la página de inicio** y **de las otras páginas**: títulos y bajadas.
- **Google y redes (SEO)**: el título y la descripción que muestra Google.
- **Textos legales**: Política de privacidad y Términos de servicio.

---

## 7. Agregar otra persona como administradora

Esto lo hace una sola vez alguien con acceso a Supabase (https://supabase.com, proyecto
**ImagenAuditiva**):

1. Menú **Authentication → Users → Add user → Create new user**. Escribí el correo y una contraseña
   provisoria, y marcá **Auto Confirm User**.
2. Menú **SQL Editor** → pegá esto (cambiando el correo) y tocá **Run**:
   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users where email = 'correo@ejemplo.com';
   ```
3. Pasale el correo y la contraseña a la persona; puede cambiarla con "¿Olvidaste tu contraseña?".

Para quitarle el acceso: **Authentication → Users** → los tres puntos del usuario → **Delete user**.

---

## Problemas frecuentes

| Qué pasa | Qué hacer |
|---|---|
| "Tu usuario no tiene permisos" | El usuario existe pero no es administrador: seguí el paso 2 de la sección 7. |
| "Contenido no disponible en tu región" (en el sitio) | El sitio tiene bloqueo por país. Usá una VPN de un país permitido para verlo. |
| La imagen no sube | Tiene que ser JPG, PNG o WEBP. El panel la achica sola antes de subirla. |
| Guardé pero no veo el cambio | Recargá la página del sitio (tecla F5). |
