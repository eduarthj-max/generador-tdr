# Generador de TDR y EETT (Perú)

Escribe el nombre de un requerimiento u obra y obtén el **Término de Referencia** o las
**Especificaciones Técnicas** redactadas por Claude conforme a la Ley N° 32069 y su Reglamento,
usando como modelo los documentos que subas a la biblioteca (por ejemplo, TDR y EETT del
Gobierno Regional del Cusco), pero adaptadas a cualquier entidad y región del Perú.

Tipos de documento: TDR de servicios · TDR de consultoría de obra · EETT de obra (por partidas) · EETT de bienes.

## Puesta en marcha

1. Instala Node.js 20 o superior.
2. Crea tu API key en https://platform.claude.com (sección API Keys).
3. En esta carpeta:

```bash
npm install
```

```bash
cp .env.example .env.local
```

4. Edita `.env.local` y pega tu clave en `ANTHROPIC_API_KEY=`.
5. Inicia la app:

```bash
npm run dev
```

6. Abre http://localhost:3000, ve a **Biblioteca de referencias** y sube tus TDR/EETT.

## Publicar en internet (Railway — recomendado)

1. Crea una cuenta en https://railway.com e inicia sesión con tu GitHub.
2. **New Project → Deploy from GitHub repo →** elige `generador-tdr`. Railway detecta el `Dockerfile` solo.
3. En el servicio, pestaña **Variables**, agrega:
   - `ANTHROPIC_API_KEY` = tu clave de platform.claude.com
   - `APP_PASSWORD` = una contraseña para entrar a la app (obligatoria si es pública)
4. Clic derecho sobre el servicio → **Attach volume** → *Mount path*: `/app/data`
   (ahí se guarda la biblioteca de referencias; sin volumen se borra en cada despliegue).
5. Pestaña **Settings → Networking → Generate Domain**: te da la dirección pública
   (algo como `generador-tdr-production.up.railway.app`).
6. Al entrar, el navegador pide usuario y contraseña: el usuario puede ser cualquiera y la
   contraseña es `APP_PASSWORD`.

Cada vez que se sube un cambio a la rama `main` de GitHub, Railway vuelve a publicar la app solo.

### Alternativa: Render

**New → Blueprint →** elige el repositorio; usa `render.yaml` (plan *Starter* con disco de 1 GB).
Te pedirá `ANTHROPIC_API_KEY` y `APP_PASSWORD`.

### Otro hosting

Cualquier servicio que ejecute Docker sirve: monta un disco persistente en `/app/data`
y define las variables de `.env.example`. La ruta `/api/salud` sirve como *health check*.

## Costos aproximados

Con Claude Opus 5.5 ($4 por millón de tokens de entrada y $20 por millón de salida), un TDR
típico con 3 referencias cuesta alrededor de US$ 0.30 a 0.80. Puedes bajar el costo con
`CLAUDE_EFFORT=medium` o `CLAUDE_MODEL=claude-sonnet-5-5`.

## Aviso

Los documentos generados son borradores: el área usuaria debe revisarlos y validarlos antes de su aprobación.
