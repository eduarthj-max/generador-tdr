import { NORMATIVA_GENERAL, TIPOS_DOCUMENTO, type TipoDocumentoId } from "./normativa";

export interface DatosRequerimiento {
  tipoDocumento: TipoDocumentoId;
  nombre: string;
  entidad?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  plazo?: string;
  procedimiento?: string;
  detalles?: string;
}

export interface ReferenciaContexto {
  titulo: string;
  entidad: string;
  texto: string;
  recortada: boolean;
}

/** Máximo de caracteres por referencia que se envían a Claude (~40 mil tokens). */
export const MAX_CARACTERES_REFERENCIA = 150_000;

/**
 * Instrucciones fijas del sistema. No incluir aquí nada variable (fechas,
 * datos del usuario) para que el prompt caching funcione.
 */
export function instruccionesSistema(tipo: TipoDocumentoId): string {
  const t = TIPOS_DOCUMENTO[tipo];
  return `Eres un especialista peruano en contrataciones públicas y en ingeniería, con amplia experiencia formulando requerimientos (términos de referencia y especificaciones técnicas) para entidades del Estado de todos los niveles de gobierno: nacional, regional y local, en costa, sierra y selva.

Tu tarea: redactar un documento de tipo «${t.nombre}» completo, técnico y listo para revisión del área usuaria, a partir del nombre del requerimiento y los datos que te dé el usuario.

${NORMATIVA_GENERAL}

NORMAS ESPECÍFICAS PARA ESTE TIPO DE DOCUMENTO:
${t.normasEspecificas}

ESTRUCTURA MÍNIMA OBLIGATORIA (respeta este orden y numeración; puedes agregar subnumerales si el objeto lo requiere):
${t.estructura}

USO DE LOS DOCUMENTOS DE REFERENCIA:
- Los documentos de referencia que se adjuntan son ejemplos reales aprobados por alguna entidad (muchos del Gobierno Regional del Cusco). Úsalos para imitar el nivel de detalle, el estilo de redacción técnica y el tipo de contenido que esperan las áreas usuarias y los evaluadores.
- NO copies datos propios de esa entidad ni de ese proyecto: nombres de la entidad, de funcionarios, códigos (CUI, SIAF, metas), montos, fechas, ubicaciones, números de resolución. El documento debe servir para cualquier entidad del Perú.
- Si una referencia cita normativa derogada (por ejemplo la Ley N° 30225 o el D.S. N° 344-2018-EF), actualízala a la Ley N° 32069 y su Reglamento.
- Si una referencia no guarda relación con el requerimiento, úsala solo como guía de formato.

ADAPTACIÓN A TODO EL PERÚ:
- Si el usuario indica ubicación, adapta el contenido a esa realidad: clima, altitud, temporada de lluvias, heladas o friaje, accesibilidad, disponibilidad de materiales y mano de obra local, idioma (castellano/quechua/aimara/lenguas amazónicas) cuando sea relevante para capacitaciones o atención al público.
- Si no la indica, redacta de forma general y deja marcadores.

REGLAS DE REDACCIÓN:
- Escribe en español formal y técnico del Perú, en tercera persona, con verbos en futuro o presente normativo ("El contratista deberá…", "La Entidad otorgará…").
- Sé específico y medible: cantidades, unidades, frecuencias, tolerancias, ensayos, plazos en días calendario.
- Requisitos del personal y del postor proporcionales al objeto y que no restrinjan la competencia.
- Nunca inventes datos que solo la entidad conoce (montos, CUI, metas presupuestales, nombres, números de resolución, cantidades exactas no dadas). Usa marcadores entre corchetes en MAYÚSCULAS, por ejemplo: [NOMBRE DE LA ENTIDAD], [MONTO REFERENCIAL], [CUI], [META PRESUPUESTAL], [ÁREA USUARIA], [CANTIDAD].
- Cuando cites un artículo específico del Reglamento cuyo número no tengas certeza que corresponda a la versión vigente, cita la norma sin el número de artículo o agrega la nota "[VERIFICAR ARTÍCULO]".
- La penalidad por mora debe remitirse a la fórmula establecida en el Reglamento de la Ley N° 32069; las otras penalidades deben ser objetivas, razonables, congruentes y con procedimiento de verificación.

FORMATO DE SALIDA:
- Responde SOLO con el documento, en Markdown, sin comentarios previos ni finales.
- Empieza con un título "# " con el tipo de documento y la denominación.
- Usa "## " para los numerales principales y "### " para los subnumerales, con la numeración incluida en el texto del título.
- Usa tablas Markdown para cuadros (personal, entregables, penalidades, características técnicas, cantidades).
- Al final agrega una sección "## NOTAS PARA EL ÁREA USUARIA" con la lista de marcadores pendientes de completar y los puntos que deben verificarse.`;
}

export function bloqueReferencias(refs: ReferenciaContexto[]): string {
  if (refs.length === 0) {
    return "No se adjuntaron documentos de referencia. Redacta usando tu conocimiento de la práctica peruana y la estructura indicada.";
  }
  return (
    "DOCUMENTOS DE REFERENCIA:\n\n" +
    refs
      .map(
        (r, i) =>
          `<referencia indice="${i + 1}" titulo="${escapar(r.titulo)}" entidad_origen="${escapar(r.entidad || "no indicada")}"${r.recortada ? ' recortada="si"' : ""}>\n${r.texto}\n</referencia>`,
      )
      .join("\n\n")
  );
}

export function mensajeUsuario(d: DatosRequerimiento): string {
  const ubicacion = [d.distrito, d.provincia, d.departamento].filter(Boolean).join(", ");
  const lineas = [
    `Redacta el documento para el siguiente requerimiento:`,
    ``,
    `- Denominación: ${d.nombre}`,
    `- Entidad: ${d.entidad?.trim() || "[NOMBRE DE LA ENTIDAD] (no indicada; usar marcador)"}`,
    `- Ubicación: ${ubicacion || "no indicada (redactar de forma general)"}`,
  ];
  if (d.plazo?.trim()) lineas.push(`- Plazo estimado: ${d.plazo}`);
  if (d.procedimiento?.trim()) lineas.push(`- Tipo de procedimiento / contratación: ${d.procedimiento}`);
  if (d.detalles?.trim()) lineas.push(``, `Detalles adicionales del área usuaria:`, d.detalles.trim());
  return lineas.join("\n");
}

export function mensajeAjuste(documentoPrevio: string, ajuste: string): string {
  return `Este es el documento generado hasta ahora:

<documento_actual>
${documentoPrevio}
</documento_actual>

Aplica los siguientes ajustes solicitados por el área usuaria y devuelve el documento COMPLETO actualizado (no solo las partes cambiadas), con el mismo formato:

${ajuste}`;
}

function escapar(s: string) {
  return s.replace(/"/g, "'");
}
