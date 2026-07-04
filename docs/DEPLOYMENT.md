# Guía de Despliegue

## 1. Crear el proyecto en Supabase

1. Entrar a https://supabase.com/dashboard y crear un proyecto nuevo.
2. Anotar: Project URL, anon key y service_role key (Project Settings > API).
3. Instalar el CLI de Supabase localmente: `npm install -g supabase`.
4. Desde la carpeta del proyecto:
   ```bash
   supabase login
   supabase link --project-ref <tu-project-ref>
   supabase db push
   ```
   Esto aplica, en orden, todas las migraciones de `supabase/migrations/`:
   esquema, funciones, RLS y el bucket de Storage.
5. (Opcional, solo en desarrollo) cargar datos de ejemplo:
   ```bash
   psql "$(supabase status -o env | grep DB_URL | cut -d= -f2)" -f supabase/seed.sql
   ```
   O simplemente correr `supabase db reset` en un proyecto local, que aplica
   migraciones + `seed.sql` automáticamente.

## 2. Variables de entorno

Copiar `.env.example` a `.env.local` y completar con los datos del paso 1:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

La `SUPABASE_SERVICE_ROLE_KEY` **nunca** debe tener el prefijo `NEXT_PUBLIC_` — si lo
tuviera quedaría expuesta en el bundle del cliente. Solo se usa en Server Actions
(alta de empleados).

## 3. Correr localmente

```bash
npm install
npm run dev
```

Abrir http://localhost:3000. Con los datos de `seed.sql`, se puede entrar como:
- Dueño: `dueno@eltornillofeliz.test` / `password123`
- Empleado: `empleado1@eltornillofeliz.test` / `password123`

## 4. Desplegar en Vercel

1. Crear un proyecto nuevo en https://vercel.com importando el repo de GitHub.
2. Cargar las mismas variables de entorno del paso 2 en Vercel (Project Settings >
   Environment Variables), tanto para Production como Preview.
3. Framework preset: Next.js (se detecta automático).

## 5. CI/CD con GitHub Actions

Ya incluidos en `.github/workflows/`:

- **ci.yml**: corre en cada PR y push a `main` — lint, type-check y build. No hace
  deploy; es solo un gate de calidad.
- **deploy.yml**: en cada push a `main`, aplica migraciones de Supabase
  (`supabase db push`) y despliega a Vercel en producción.

Secrets a configurar en GitHub (Settings > Secrets and variables > Actions):

| Secret | De dónde sale |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Project Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Project Settings > API |
| `SUPABASE_ACCESS_TOKEN` | Supabase > Account > Access Tokens |
| `SUPABASE_PROJECT_REF` | Supabase > Project Settings > General |
| `VERCEL_TOKEN` | Vercel > Account Settings > Tokens |
| `VERCEL_ORG_ID` / `VERCEL_PROJECT_ID` | Archivo `.vercel/project.json` tras correr `vercel link` una vez localmente |

## 6. Alta del primer comercio (organización)

El MVP no tiene un flujo de self-signup todavía (no era prioridad para validar el
negocio con pocos clientes reales manejados a mano). Para dar de alta un comercio
nuevo:

```sql
insert into organizations (name, slug) values ('Nombre del Comercio', 'slug-unico');
```

Y crear al dueño con el Admin API de Supabase (o desde el dashboard: Authentication >
Users > Add user), y luego:

```sql
insert into profiles (id, organization_id, full_name, role)
values ('<user-id-de-auth>', '<organization-id>', 'Nombre del Dueño', 'owner');
```

A partir de ahí, el dueño ya puede entrar y usar "Configuración > Agregar empleado"
para el resto del equipo.
