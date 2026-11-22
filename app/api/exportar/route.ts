import { markdownADocx } from "@/lib/docx";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { markdown, nombreArchivo } = (await req.json()) as { markdown?: string; nombreArchivo?: string };
  if (!markdown?.trim()) return Response.json({ error: "Documento vacío" }, { status: 400 });
  const buffer = await markdownADocx(markdown);
  const nombre = (nombreArchivo || "documento").replace(/[^\p{L}\p{N} _.-]/gu, "").slice(0, 120) || "documento";
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="documento.docx"; filename*=UTF-8''${encodeURIComponent(nombre)}.docx`,
    },
  });
}
