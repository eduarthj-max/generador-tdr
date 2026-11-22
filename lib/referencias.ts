import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

/**
 * Biblioteca de documentos de referencia (TDR / EETT ya aprobados).
 * Se guarda en disco: DATA_DIR/referencias/index.json + un .txt por documento
 * con el texto extraído. Para otro almacenamiento (S3, base de datos), solo
 * hay que reemplazar las funciones de este archivo.
 */

export interface Referencia {
  id: string;
  nombreArchivo: string;
  titulo: string;
  tipo: "TDR" | "EETT";
  entidad: string;
  notas: string;
  caracteres: number;
  creado: string;
}

const DIR = path.join(process.env.DATA_DIR || path.join(process.cwd(), "data"), "referencias");
const INDEX = path.join(DIR, "index.json");

async function asegurarDir() {
  await fs.mkdir(DIR, { recursive: true });
}

export async function listarReferencias(): Promise<Referencia[]> {
  await asegurarDir();
  try {
    const raw = await fs.readFile(INDEX, "utf8");
    return JSON.parse(raw) as Referencia[];
  } catch {
    return [];
  }
}

async function guardarIndice(refs: Referencia[]) {
  await asegurarDir();
  await fs.writeFile(INDEX, JSON.stringify(refs, null, 2), "utf8");
}

export async function leerTextoReferencia(id: string): Promise<string> {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error("id inválido");
  return fs.readFile(path.join(DIR, `${id}.txt`), "utf8");
}

export async function agregarReferencia(
  datos: Omit<Referencia, "id" | "caracteres" | "creado">,
  texto: string,
): Promise<Referencia> {
  const ref: Referencia = {
    ...datos,
    id: randomUUID(),
    caracteres: texto.length,
    creado: new Date().toISOString(),
  };
  await asegurarDir();
  await fs.writeFile(path.join(DIR, `${ref.id}.txt`), texto, "utf8");
  const refs = await listarReferencias();
  refs.unshift(ref);
  await guardarIndice(refs);
  return ref;
}

export async function eliminarReferencia(id: string): Promise<boolean> {
  const refs = await listarReferencias();
  const restantes = refs.filter((r) => r.id !== id);
  if (restantes.length === refs.length) return false;
  await guardarIndice(restantes);
  await fs.rm(path.join(DIR, `${id}.txt`), { force: true });
  return true;
}

/** Extrae texto plano de PDF, DOCX o TXT. */
export async function extraerTexto(nombre: string, buffer: Buffer): Promise<string> {
  const ext = path.extname(nombre).toLowerCase();
  let texto: string;
  if (ext === ".pdf") {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    texto = text;
  } else if (ext === ".docx") {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer });
    texto = value;
  } else if (ext === ".txt" || ext === ".md") {
    texto = buffer.toString("utf8");
  } else {
    throw new Error("Formato no soportado. Sube archivos PDF, DOCX o TXT (los .doc antiguos conviértelos a .docx).");
  }
  texto = texto.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (texto.length < 200) {
    throw new Error(
      "Se extrajo muy poco texto. Si el PDF es escaneado (imagen), pásalo antes por OCR o súbelo en Word.",
    );
  }
  return texto;
}

/** Elige automáticamente las referencias más parecidas al requerimiento. */
export function seleccionarAutomaticamente(
  refs: Referencia[],
  tipo: "TDR" | "EETT",
  consulta: string,
  max = 3,
): Referencia[] {
  const palabras = normalizar(consulta).split(/\s+/).filter((p) => p.length > 3);
  return refs
    .filter((r) => r.tipo === tipo)
    .map((r) => {
      const t = normalizar(`${r.titulo} ${r.notas} ${r.nombreArchivo}`);
      const puntaje = palabras.reduce((s, p) => s + (t.includes(p) ? 1 : 0), 0);
      return { r, puntaje };
    })
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, max)
    .map((x) => x.r);
}

function normalizar(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}
