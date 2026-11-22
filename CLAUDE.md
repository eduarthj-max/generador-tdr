# Generador de TDR y EETT — guía para Claude Code

App web (Next.js 16, App Router, TypeScript) que redacta Términos de Referencia (TDR) y
Especificaciones Técnicas (EETT) para contrataciones públicas del Perú, usando la API de Claude
y una biblioteca de documentos de referencia que sube el usuario.

Idioma: toda la interfaz, mensajes y comentarios del código van en **español**.

## Arquitectura

| Archivo | Qué hace |
|---|---|
| `lib/normativa.ts` | **Conocimiento normativo**: marco legal general (Ley N° 32069, Reglamento D.S. 009-2025-EF y modificatorias, OECE) y, por tipo de documento, la estructura mínima y normas técnicas. Es lo primero que se edita cuando cambia la normativa o se agrega un tipo de documento. |
| `lib/prompt.ts` | Arma el prompt: instrucciones del sistema (fijas, para prompt caching), bloque de referencias, mensaje del usuario y mensaje de ajuste. |
| `lib/claude.ts` | Cliente de Anthropic; modelo (`CLAUDE_MODEL`, por defecto `claude-opus-5-5`) y esfuerzo (`CLAUDE_EFFORT`). |
| `app/api/generar/route.ts` | Llama a Claude en streaming y devuelve NDJSON (`refs`, `texto`, `aviso`, `error`, `fin`). Usa adaptive thinking, fallback del servidor ante rechazos y cache_control sobre las referencias. |
| `lib/referencias.ts` | Biblioteca de referencias en disco (`DATA_DIR/referencias`): extracción de texto de PDF (unpdf) y DOCX (mammoth), índice JSON y selección automática por palabras clave. |
| `lib/docx.ts` | Convierte el Markdown generado a Word (A4, Arial 11, tablas, numeración de páginas). |
| `app/page.tsx` | Pantalla principal: formulario, vista previa en streaming, edición, ajustes y descarga. |
| `app/referencias/page.tsx` | Subida y gestión de referencias. |
| `proxy.ts` | Contraseña opcional (HTTP Basic) si `APP_PASSWORD` está definida. |

## Comandos

- `npm run dev` — desarrollo en http://localhost:3000
- `npm run typecheck` — verificación de tipos
- `npm run build` — compilación de producción (ejecutar antes de cada commit)

## Reglas al modificar

- Mantener las instrucciones del sistema en `lib/prompt.ts` libres de contenido variable
  (fechas, datos del usuario) para no romper el prompt caching.
- Los documentos generados nunca deben inventar datos propios de la entidad (montos, CUI,
  metas, nombres): usar marcadores `[EN MAYÚSCULAS]`.
- Al actualizar normativa, verificar en fuentes oficiales (gob.pe/oece, El Peruano) y registrar
  la norma en `lib/normativa.ts`.
- La salida HTML del Markdown se escapa (`marked.use` en `app/page.tsx`); no quitar esa protección.
- `data/` no se versiona (contiene documentos de las entidades).

## Ideas pendientes

- Almacenamiento en la nube (S3/R2 o base de datos) para desplegar en hosting sin disco persistente.
- OCR para PDF escaneados.
- Historial de documentos generados y plantillas por entidad (logo y encabezado en el Word).
- Búsqueda semántica de referencias por contenido (no solo por título y palabras clave).
