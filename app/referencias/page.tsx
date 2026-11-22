"use client";

import { useEffect, useState } from "react";
import type { Referencia } from "@/lib/referencias";

export default function Referencias() {
  const [refs, setRefs] = useState<Referencia[]>([]);
  const [archivos, setArchivos] = useState<FileList | null>(null);
  const [tipo, setTipo] = useState<"TDR" | "EETT">("TDR");
  const [entidad, setEntidad] = useState("Gobierno Regional del Cusco");
  const [notas, setNotas] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [mensajes, setMensajes] = useState<{ ok: boolean; texto: string }[]>([]);
  const [inputKey, setInputKey] = useState(0);

  const cargar = () => fetch("/api/referencias").then((r) => r.json()).then(setRefs);
  useEffect(() => { cargar(); }, []);

  async function subir() {
    if (!archivos?.length) return;
    setSubiendo(true);
    setMensajes([]);
    for (const archivo of Array.from(archivos)) {
      const fd = new FormData();
      fd.append("archivo", archivo);
      fd.append("tipo", tipo);
      fd.append("entidad", entidad);
      fd.append("notas", notas);
      const resp = await fetch("/api/referencias", { method: "POST", body: fd });
      const j = await resp.json().catch(() => ({}));
      setMensajes((m) => [...m, resp.ok
        ? { ok: true, texto: `✔ ${archivo.name} (${j.caracteres?.toLocaleString("es-PE")} caracteres)` }
        : { ok: false, texto: `✖ ${archivo.name}: ${j.error || "error"}` }]);
    }
    setSubiendo(false);
    setArchivos(null);
    setInputKey((k) => k + 1);
    cargar();
  }

  async function eliminar(r: Referencia) {
    if (!confirm(`¿Eliminar "${r.titulo}" de la biblioteca?`)) return;
    await fetch(`/api/referencias/${r.id}`, { method: "DELETE" });
    cargar();
  }

  return (
    <>
      <h1>Biblioteca de referencias</h1>
      <p className="lead">Sube TDR y EETT ya aprobados (PDF con texto, DOCX o TXT). Claude los usa como modelo de formato y nivel de detalle, sin copiar los datos propios de la entidad.</p>

      <div className="grid">
        <section className="panel">
          <h2>Subir archivos</h2>
          <label>Archivos</label>
          <input key={inputKey} type="file" multiple accept=".pdf,.docx,.txt,.md" onChange={(e) => setArchivos(e.target.files)} />
          <label>Tipo</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as "TDR" | "EETT")}>
            <option value="TDR">TDR — Términos de referencia</option>
            <option value="EETT">EETT — Especificaciones técnicas</option>
          </select>
          <label>Entidad de origen <span className="opc">(opcional)</span></label>
          <input value={entidad} onChange={(e) => setEntidad(e.target.value)} />
          <label>Palabras clave <span className="opc">(ayudan a la selección automática)</span></label>
          <input value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej.: saneamiento, agua potable, expediente técnico" />
          <button className="btn bloque" onClick={subir} disabled={!archivos?.length || subiendo}>
            {subiendo ? "Procesando…" : `Subir ${archivos?.length ? archivos.length + " archivo(s)" : ""}`}
          </button>
          <div style={{ marginTop: 10 }}>
            {mensajes.map((m, i) => <div key={i} className={`alerta ${m.ok ? "info" : "error"}`}>{m.texto}</div>)}
          </div>
          <p className="ayuda">El nombre del archivo se usa como título, así que conviene que sea descriptivo (p. ej. «TDR expediente técnico IE secundaria.pdf»). Los PDF escaneados necesitan OCR previo.</p>
        </section>

        <section className="panel">
          <h2>{refs.length} documento(s)</h2>
          {refs.length === 0 ? <div className="vacio">Aún no hay referencias.</div> : (
            <div className="scroll-x">
              <table className="tabla-refs">
                <thead><tr><th>Tipo</th><th>Título</th><th>Entidad</th><th>Tamaño</th><th></th></tr></thead>
                <tbody>
                  {refs.map((r) => (
                    <tr key={r.id}>
                      <td><span className={`chip ${r.tipo === "EETT" ? "eett" : ""}`}>{r.tipo}</span></td>
                      <td>
                        <a href={`/api/referencias/${r.id}`} target="_blank" rel="noreferrer">{r.titulo}</a>
                        {r.notas && <div className="ayuda">{r.notas}</div>}
                      </td>
                      <td>{r.entidad}</td>
                      <td>{Math.round(r.caracteres / 1000)} mil car.</td>
                      <td><button className="btn sec peq" onClick={() => eliminar(r)}>Eliminar</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
