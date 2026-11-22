import { agregarReferencia, extraerTexto, listarReferencias } from "@/lib/referencias";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(await listarReferencias());
}

export async function POST(req: Request) {
  const form = await req.formData();
  const archivo = form.get("archivo");
  if (!(archivo instanceof File)) return Response.json({ error: "Falta el archivo" }, { status: 400 });
  if (archivo.size > 30 * 1024 * 1024) return Response.json({ error: "El archivo supera 30 MB" }, { status: 400 });
  const tipo = form.get("tipo") === "EETT" ? "EETT" : "TDR";
  try {
    const texto = await extraerTexto(archivo.name, Buffer.from(await archivo.arrayBuffer()));
    const ref = await agregarReferencia(
      {
        nombreArchivo: archivo.name,
        titulo: String(form.get("titulo") || "").trim() || archivo.name.replace(/\.[^.]+$/, ""),
        tipo,
        entidad: String(form.get("entidad") || "").trim(),
        notas: String(form.get("notas") || "").trim(),
      },
      texto,
    );
    return Response.json(ref);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "No se pudo procesar el archivo" }, { status: 400 });
  }
}
