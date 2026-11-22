"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { marked } from "marked";
import { DEPARTAMENTOS_PERU, TIPOS_DOCUMENTO, type TipoDocumentoId } from "@/lib/normativa";
import type { Referencia } from "@/lib/referencias";

// No interpretar HTML crudo dentro del Markdown generado: se muestra como texto.
marked.use({
  renderer: {
    html({ text }) {
      return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    },
  },
});

type Evento =
  | { t: "refs"; v: string[] }
  | { t: "texto"; v: string }
  | { t: "aviso"; v: string }
  | { t: "error"; v: string }
  | { t: "fin"; uso: { modelo: string; entrada: number; salida: number; cacheLeida: number; cacheEscrita: number } };

export default function Generar() {
  const [tipo, setTipo] = useState<TipoDocumentoId>("tdr_servicio");
  const [nombre, setNombre] = useState("");
  const [entidad, setEntidad] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [provincia, setProvincia] = useState("");
  const [distrito, setDistrito] = useState("");
  const [plazo, setPlazo] = useState("");
  const [procedimiento, setProcedimiento] = useState("");
  const [detalles, setDetalles] = useState("");

  const [refs, setRefs] = useState<Referencia[]>([]);
  const [refsElegidas, setRefsElegidas] = useState<string[]>([]);

  const [documento, setDocumento] = useState("");
  const [generando, setGenerando] = useState(false);
  const [avisos, setAvisos] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [refsUsadas, setRefsUsadas] = useState<string[] | null>(null);
  const [uso, setUso] = useState<Extract<Evento, { t: "fin" }>["uso"] | null>(null);
  const [vista, setVista] = useState<"previa" | "editar">("previa");
  const [ajuste, setAjuste] = useState("");
  const abortar = useRef<AbortController | null>(null);

  const tipoRef = TIPOS_DOCUMENTO[tipo].tipoReferencia;
  const refsDelTipo = refs.filter((r) => r.tipo === tipoRef);

  useEffect(() => {
    fetch("/api/referencias").then((r) => r.json()).then(setRefs).catch(() => {});
  }, []);

  const html = useMemo(() => marked.parse(documento, { gfm: true, async: false }) as string, [documento]);

  async function generar(conAjuste: boolean) {
    if (!nombre.trim()) return setError("Escribe el nombre del requerimiento o servicio.");
    const previo = documento;
    setGenerando(true);
    setError("");
    setAvisos([]);
    setUso(null);
    setVista("previa");
    setDocumento("");
    abortar.current = new AbortController();
    try {
      const resp = await fetch("/api/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortar.current.signal,
        body: JSON.stringify({
          tipoDocumento: tipo, nombre, entidad, departamento, provincia, distrito, plazo, procedimiento, detalles,
          referenciaIds: refsElegidas.filter((id) => refsDelTipo.some((r) => r.id === id)),
          ...(conAjuste ? { documentoPrevio: previo, ajuste } : {}),
        }),
      });
      if (!resp.ok || !resp.body) {
        const j = await resp.json().catch(() => ({}));
        throw new Error(j.error || `Error ${resp.status}`);
      }
      const lector = resp.body.getReader();
      const dec = new TextDecoder();
      let buffer = "";
      let texto = "";
      for (;;) {
        const { done, value } = await lector.read();
        if (done) break;
        buffer += dec.decode(value, { stream: true });
        const lineas = buffer.split("\n");
        buffer = lineas.pop() ?? "";
        for (const l of lineas) {
          if (!l.trim()) continue;
          const ev = JSON.parse(l) as Evento;
          if (ev.t === "texto") { texto += ev.v; setDocumento(texto); }
          else if (ev.t === "refs") setRefsUsadas(ev.v);
          else if (ev.t === "aviso") setAvisos((a) => [...a, ev.v]);
          else if (ev.t === "error") setError(ev.v);
          else if (ev.t === "fin") setUso(ev.uso);
        }
      }
      if (conAjuste && !texto) setDocumento(previo);
      if (conAjuste && texto) setAjuste("");
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
      if (conAjuste) setDocumento((d) => d || previo);
    } finally {
      setGenerando(false);
    }
  }

  async function descargarWord() {
    const resp = await fetch("/api/exportar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markdown: documento, nombreArchivo: `${tipoRef} - ${nombre}` }),
    });
    if (!resp.ok) return setError("No se pudo generar el archivo Word.");
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: `${tipoRef} - ${nombre}.docx` });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <h1>Generar documento</h1>
      <p className="lead">Escribe el nombre del requerimiento; Claude redacta el TDR o las EETT conforme a la Ley N° 32069 y su Reglamento, tomando como modelo tu biblioteca de referencias.</p>

      <div className="grid">
        <section className="panel">
          <h2>1. Tipo de documento</h2>
          <div className="tipos">
            {Object.values(TIPOS_DOCUMENTO).map((t) => (
              <label key={t.id} className={`tipo ${tipo === t.id ? "activo" : ""}`}>
                <input type="radio" name="tipo" checked={tipo === t.id} onChange={() => setTipo(t.id)} />
                <span><b>{t.nombre}</b><small>{t.descripcionCorta}</small></span>
              </label>
            ))}
          </div>

          <h2 style={{ marginTop: 20 }}>2. Requerimiento</h2>
          <label>Nombre del requerimiento o servicio *</label>
          <textarea rows={3} value={nombre} onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej.: Servicio de elaboración del expediente técnico para el mejoramiento del sistema de agua potable…" />

          <label>Entidad <span className="opc">(opcional)</span></label>
          <input value={entidad} onChange={(e) => setEntidad(e.target.value)} placeholder="Ej.: Municipalidad Distrital de …" />

          <label>Ubicación <span className="opc">(opcional, adapta clima y contexto)</span></label>
          <div className="fila3">
            <select value={departamento} onChange={(e) => setDepartamento(e.target.value)}>
              <option value="">Departamento</option>
              {DEPARTAMENTOS_PERU.map((d) => <option key={d}>{d}</option>)}
            </select>
            <input value={provincia} onChange={(e) => setProvincia(e.target.value)} placeholder="Provincia" />
            <input value={distrito} onChange={(e) => setDistrito(e.target.value)} placeholder="Distrito" />
          </div>

          <div className="fila">
            <div>
              <label>Plazo <span className="opc">(opcional)</span></label>
              <input value={plazo} onChange={(e) => setPlazo(e.target.value)} placeholder="Ej.: 90 días calendario" />
            </div>
            <div>
              <label>Procedimiento <span className="opc">(opcional)</span></label>
              <select value={procedimiento} onChange={(e) => setProcedimiento(e.target.value)}>
                <option value="">No indicado</option>
                <option>Contratación menor (hasta 8 UIT)</option>
                <option>Licitación pública</option>
                <option>Concurso público</option>
                <option>Adjudicación simplificada / procedimiento abreviado</option>
                <option>Comparación de precios</option>
                <option>Contratación directa</option>
                <option>Acuerdo marco / catálogo electrónico</option>
              </select>
            </div>
          </div>

          <label>Detalles adicionales <span className="opc">(opcional)</span></label>
          <textarea rows={4} value={detalles} onChange={(e) => setDetalles(e.target.value)}
            placeholder="Metas, cantidades, componentes, perfil del personal, condiciones especiales…" />

          <h2 style={{ marginTop: 20 }}>3. Referencias ({tipoRef})</h2>
          {refsDelTipo.length === 0 ? (
            <p className="ayuda">No hay {tipoRef} en la biblioteca. <a href="/referencias">Sube archivos de referencia</a> para que Claude imite su formato.</p>
          ) : (
            <>
              <div className="refs-lista">
                {refsDelTipo.map((r) => (
                  <label key={r.id}>
                    <input type="checkbox" checked={refsElegidas.includes(r.id)}
                      onChange={(e) => setRefsElegidas((s) => e.target.checked ? [...s, r.id] : s.filter((x) => x !== r.id))} />
                    <span>{r.titulo}{r.entidad && <small style={{ color: "var(--suave)" }}> · {r.entidad}</small>}</span>
                  </label>
                ))}
              </div>
              <p className="ayuda">Si no marcas ninguna, se eligen automáticamente hasta 3 de las más parecidas.</p>
            </>
          )}

          {generando ? (
            <button className="btn sec bloque" onClick={() => abortar.current?.abort()}>Detener</button>
          ) : (
            <button className="btn bloque" onClick={() => generar(false)} disabled={!nombre.trim()}>Generar {tipoRef}</button>
          )}
        </section>

        <section className="panel documento">
          <div className="barra-doc">
            <div className="tabs">
              <button className={vista === "previa" ? "activo" : ""} onClick={() => setVista("previa")}>Vista previa</button>
              <button className={vista === "editar" ? "activo" : ""} onClick={() => setVista("editar")} disabled={generando}>Editar texto</button>
            </div>
            <div className="acciones">
              <button className="btn sec peq" disabled={!documento || generando} onClick={() => navigator.clipboard.writeText(documento)}>Copiar</button>
              <button className="btn peq" disabled={!documento || generando} onClick={descargarWord}>Descargar Word</button>
            </div>
          </div>

          {error && <div className="alerta error">{error}</div>}
          {avisos.map((a, i) => <div key={i} className="alerta aviso">{a}</div>)}
          {refsUsadas && (generando || documento) && (
            <div className="alerta info">
              {refsUsadas.length ? <>Referencias usadas: {refsUsadas.join(" · ")}</> : <>Sin referencias: redactado solo con la estructura normativa.</>}
            </div>
          )}

          {!documento && !generando ? (
            <div className="vacio">El documento aparecerá aquí.<br />Puedes editarlo, pedir ajustes y descargarlo en Word.</div>
          ) : vista === "previa" ? (
            <div className={`md ${generando ? "cursor" : ""}`} dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <textarea className="editor" value={documento} onChange={(e) => setDocumento(e.target.value)} />
          )}

          {documento && !generando && (
            <div className="ajuste">
              <label>Pedir ajustes a Claude</label>
              <textarea rows={3} value={ajuste} onChange={(e) => setAjuste(e.target.value)}
                placeholder="Ej.: agrega un ingeniero ambiental al plantel, cambia el plazo a 120 días y detalla más los entregables…" />
              <button className="btn sec" style={{ marginTop: 8 }} disabled={!ajuste.trim()} onClick={() => generar(true)}>Aplicar ajustes</button>
            </div>
          )}

          {uso && (
            <p className="meta">
              Modelo: {uso.modelo} · tokens entrada {uso.entrada.toLocaleString("es-PE")} (caché {uso.cacheLeida.toLocaleString("es-PE")}) · salida {uso.salida.toLocaleString("es-PE")}
            </p>
          )}
          <p className="meta">Documento generado con IA: debe ser revisado y validado por el área usuaria antes de su aprobación.</p>
        </section>
      </div>
    </>
  );
}
