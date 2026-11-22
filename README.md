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

## Despliegue

La biblioteca se guarda en disco (`DATA_DIR`), así que usa un hosting con disco persistente
(Railway, Render con disco, un VPS, etc.) o adapta `lib/referencias.ts` a S3/base de datos.
Define `ANTHROPIC_API_KEY` y, si la app es pública, `APP_PASSWORD`.

## Costos aproximados

Con Claude Opus 5.5 ($4 por millón de tokens de entrada y $20 por millón de salida), un TDR
típico con 3 referencias cuesta alrededor de US$ 0.30 a 0.80. Puedes bajar el costo con
`CLAUDE_EFFORT=medium` o `CLAUDE_MODEL=claude-sonnet-5-5`.

## Aviso

Los documentos generados son borradores: el área usuaria debe revisarlos y validarlos antes de su aprobación.
