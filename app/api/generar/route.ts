import Anthropic from "@anthropic-ai/sdk";
import { anthropic, ESFUERZO, MODELO } from "@/lib/claude";
import { TIPOS_DOCUMENTO, type TipoDocumentoId } from "@/lib/normativa";
import {
  bloqueReferencias,
  instruccionesSistema,
  MAX_CARACTERES_REFERENCIA,
  mensajeAjuste,
  mensajeUsuario,
  type DatosRequerimiento,
  type ReferenciaContexto,
} from "@/lib/prompt";
import { leerTextoReferencia, listarReferencias, seleccionarAutomaticamente } from "@/lib/referencias";

export const runtime = "nodejs";
export const maxDuration = 800; // segundos (para hosting tipo Vercel)

interface Cuerpo extends DatosRequerimiento {
  /** ids elegidos; si viene vacío o ausente se eligen automáticamente */
  referenciaIds?: string[];
  documentoPrevio?: string;
  ajuste?: string;
}

/**
 * Devuelve un stream NDJSON con eventos:
 *  {t:"refs", v:[titulos]} | {t:"texto", v:"..."} | {t:"aviso", v:"..."} | {t:"error", v:"..."} | {t:"fin", uso:{...}}
 */
export async function POST(req: Request) {
  const cuerpo = (await req.json()) as Cuerpo;
  if (!cuerpo.nombre?.trim()) return Response.json({ error: "Falta el nombre del requerimiento" }, { status: 400 });
  if (!(cuerpo.tipoDocumento in TIPOS_DOCUMENTO))
    return Response.json({ error: "Tipo de documento inválido" }, { status: 400 });
  const tipo = TIPOS_DOCUMENTO[cuerpo.tipoDocumento as TipoDocumentoId];

  // Referencias: las elegidas por el usuario o las más parecidas del mismo tipo.
  const todas = await listarReferencias();
  const elegidas = cuerpo.referenciaIds?.length
    ? todas.filter((r) => cuerpo.referenciaIds!.includes(r.id))
    : seleccionarAutomaticamente(todas, tipo.tipoReferencia, cuerpo.nombre);
  const contexto: ReferenciaContexto[] = [];
  for (const r of elegidas) {
    const texto = await leerTextoReferencia(r.id).catch(() => "");
    if (!texto) continue;
    contexto.push({
      titulo: r.titulo,
      entidad: r.entidad,
      texto: texto.slice(0, MAX_CARACTERES_REFERENCIA),
      recortada: texto.length > MAX_CARACTERES_REFERENCIA,
    });
  }

  const textoUsuario =
    cuerpo.documentoPrevio && cuerpo.ajuste
      ? `${mensajeUsuario(cuerpo)}\n\n${mensajeAjuste(cuerpo.documentoPrevio, cuerpo.ajuste)}`
      : mensajeUsuario(cuerpo);

  const encoder = new TextEncoder();
  const salida = new ReadableStream({
    async start(controller) {
      const enviar = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      enviar({ t: "refs", v: contexto.map((c) => c.titulo) });
      for (const c of contexto)
        if (c.recortada)
          enviar({ t: "aviso", v: `La referencia «${c.titulo}» es muy extensa; se usaron sus primeros ${MAX_CARACTERES_REFERENCIA.toLocaleString("es-PE")} caracteres.` });

      try {
        const stream = anthropic.beta.messages.stream(
          {
            model: MODELO,
            max_tokens: 64000,
            thinking: { type: "adaptive" },
            output_config: { effort: ESFUERZO },
            // Si el modelo declina por políticas, el servidor reintenta con el modelo de respaldo por defecto.
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            system: [
              { type: "text", text: instruccionesSistema(tipo.id) },
              { type: "text", text: bloqueReferencias(contexto), cache_control: { type: "ephemeral" } },
            ],
            messages: [{ role: "user", content: textoUsuario }],
          },
          { signal: req.signal },
        );

        for await (const ev of stream) {
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
            enviar({ t: "texto", v: ev.delta.text });
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          enviar({ t: "error", v: "Claude no pudo completar este documento (respuesta rechazada por políticas). Reformula el requerimiento." });
        } else if (final.stop_reason === "max_tokens") {
          enviar({ t: "aviso", v: "El documento alcanzó el límite de longitud y puede estar incompleto. Pide en 'Ajustar' que continúe o que resuma." });
        }
        enviar({
          t: "fin",
          uso: {
            modelo: final.model,
            entrada: final.usage.input_tokens,
            salida: final.usage.output_tokens,
            cacheLeida: final.usage.cache_read_input_tokens ?? 0,
            cacheEscrita: final.usage.cache_creation_input_tokens ?? 0,
          },
        });
      } catch (err) {
        let msg = "Error inesperado al generar el documento.";
        if (err instanceof Anthropic.AuthenticationError) msg = "La API key de Anthropic no es válida o no está configurada (ANTHROPIC_API_KEY).";
        else if (err instanceof Anthropic.RateLimitError) msg = "Se superó el límite de uso de la API. Espera un momento y vuelve a intentar.";
        else if (err instanceof Anthropic.APIUserAbortError) msg = "Generación cancelada.";
        else if (err instanceof Anthropic.APIError) msg = `Error de la API de Claude (${err.status ?? "red"}): ${err.message}`;
        else if (err instanceof Error && /authentication method/i.test(err.message))
          msg = "Falta configurar ANTHROPIC_API_KEY en el archivo .env.local (o en las variables del hosting).";
        console.error(err);
        enviar({ t: "error", v: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(salida, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
