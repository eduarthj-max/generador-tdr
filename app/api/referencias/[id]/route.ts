import { eliminarReferencia, leerTextoReferencia } from "@/lib/referencias";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    return new Response(await leerTextoReferencia(id), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch {
    return Response.json({ error: "No encontrada" }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const ok = await eliminarReferencia(id);
  return ok ? Response.json({ ok: true }) : Response.json({ error: "No encontrada" }, { status: 404 });
}
