# Imagen Auditiva — Mantenimiento

Panel para administrar el contenido de [imagenauditiva.com](https://www.imagenauditiva.com) sin tocar código.
Es un proyecto aparte del sitio público: lee y escribe en la misma base de Supabase, y **no tiene
bloqueo por país**, así que se puede usar desde cualquier lugar.

## Qué se puede hacer

| Pestaña | |
|---|---|
| **Eventos** | Crear, editar, duplicar (otra fecha de la misma gira), ocultar y eliminar eventos. |
| **Carrusel** | Elegir qué eventos salen en el carrusel del inicio y ver cómo queda. Si no se elige ninguno, el sitio muestra los 3 próximos. |
| **Noticias** | Crear, editar, ocultar y eliminar noticias; elegir cuáles salen en el inicio. |
| **Mensajes** | Leer los mensajes del formulario de contacto. |
| **Configuración** | Textos, datos de contacto, redes sociales, logos y textos legales. |

## Imágenes

- Pósters y fotos se **achican a 1600 px y se convierten a WebP en el navegador** antes de subirse
  (`src/lib/images.ts`). Un póster PNG de 4-5 MB queda en ~150-650 KB. Los logos se suben tal cual.
- Al eliminar un evento o una noticia, al cambiar su imagen o al cancelar un formulario después de subir
  una, la imagen que ya nadie usa se borra de Storage. Si otro evento usa el mismo póster (por ejemplo al
  duplicar una gira), no se borra.

## Acceso

Solo pueden entrar los usuarios que estén en la tabla `admin_users` de Supabase. Para agregar uno:

1. Supabase → Authentication → Users → **Add user** (correo y contraseña).
2. SQL Editor:
   ```sql
   insert into public.admin_users (user_id) select id from auth.users where email = 'correo@ejemplo.com';
   ```

## Desarrollo

```bash
cp .env.example .env    # completar VITE_SUPABASE_ANON_KEY
pnpm install
pnpm dev                # http://localhost:3001
pnpm check              # tipos
pnpm build              # genera dist/
```

## Despliegue (Vercel)

1. Importar este repositorio en Vercel (el `vercel.json` ya trae build y rutas).
2. Variables de entorno: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_SITE_URL`.
   Nunca la service role key.
3. En Supabase → Authentication → URL Configuration, agregar a **Redirect URLs**
   `https://<dominio-del-panel>/restablecer` (para "¿Olvidaste tu contraseña?").

El panel envía `noindex` para que los buscadores no lo muestren.
