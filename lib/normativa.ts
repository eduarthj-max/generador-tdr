/**
 * BASE NORMATIVA Y ESTRUCTURAS DE DOCUMENTOS
 *
 * Este archivo es el "conocimiento" fijo de la app. Cuando cambie la normativa
 * (nuevas modificaciones al Reglamento, directivas del OECE, etc.) actualiza aquí:
 *   - NORMATIVA_GENERAL: marco legal que aplica a todo requerimiento.
 *   - TIPOS_DOCUMENTO: estructura mínima y normas específicas por tipo.
 *
 * Todo lo de aquí entra en el prompt del sistema de Claude.
 */

export const NORMATIVA_GENERAL = `
MARCO LEGAL DE CONTRATACIONES PÚBLICAS VIGENTE EN EL PERÚ (aplicar en todo documento):
- Ley N° 32069, Ley General de Contrataciones Públicas (vigente desde el 22 de abril de 2025). Sustituyó a la Ley N° 30225.
- Reglamento de la Ley N° 32069, aprobado por Decreto Supremo N° 009-2025-EF, y sus modificatorias (entre ellas D.S. N° 001-2026-EF y D.S. N° 222-2026-EF).
- Directivas, bases estándar y pronunciamientos del Organismo Especializado para las Contrataciones Públicas Eficientes (OECE), que reemplazó al OSCE.
- Plataforma: Pladicop / SEACE según corresponda.
- Principios: legalidad, presunción de veracidad, eficacia y eficiencia, valor por dinero, competencia, transparencia, integridad, sostenibilidad ambiental y social, equidad, publicidad.
- El requerimiento (especificaciones técnicas, términos de referencia o expediente técnico) lo formula el área usuaria; debe describir objetivamente lo que se requiere, sin hacer referencia a marcas, patentes o tipos de origen específicos (si es indispensable, agregar "o equivalente"), y sin requisitos que restrinjan injustificadamente la competencia.
- Ley N° 29783, Ley de Seguridad y Salud en el Trabajo, y su reglamento (D.S. N° 005-2012-TR). Norma G.050 Seguridad durante la Construcción (RNE) para obras.
- Ley N° 27446 (SEIA) y normativa ambiental sectorial cuando el servicio u obra genere impactos.
- Ley N° 28411 / D.L. N° 1440 (Presupuesto) y D.L. N° 1252 / Invierte.pe para inversiones.
- Ley N° 29973 (personas con discapacidad) y Ley N° 30364 cuando corresponda; normas de integridad y antisoborno (ISO 37001 si la entidad la tiene implementada).
`.trim();

export type TipoDocumentoId =
  | "tdr_servicio"
  | "tdr_consultoria_obra"
  | "eett_obra"
  | "eett_bienes";

export interface TipoDocumento {
  id: TipoDocumentoId;
  nombre: string;
  descripcionCorta: string;
  /** Tipo de referencia que sirve de contexto para este documento */
  tipoReferencia: "TDR" | "EETT";
  estructura: string;
  normasEspecificas: string;
}

export const TIPOS_DOCUMENTO: Record<TipoDocumentoId, TipoDocumento> = {
  tdr_servicio: {
    id: "tdr_servicio",
    nombre: "TDR — Servicio en general",
    descripcionCorta: "Términos de referencia para servicios (mantenimiento, alquiler, capacitación, etc.)",
    tipoReferencia: "TDR",
    estructura: `
1. DENOMINACIÓN DE LA CONTRATACIÓN
2. FINALIDAD PÚBLICA (vinculada al objetivo institucional / POI / meta presupuestal)
3. ANTECEDENTES
4. OBJETIVOS DE LA CONTRATACIÓN (general y específicos)
5. ALCANCE Y DESCRIPCIÓN DEL SERVICIO
   5.1 Actividades a desarrollar (detalladas, medibles)
   5.2 Procedimiento / metodología
   5.3 Plan de trabajo (si corresponde)
   5.4 Recursos y facilidades a ser provistos por la entidad
   5.5 Reglamentos técnicos, normas metrológicas y/o sanitarias aplicables
   5.6 Seguros (SCTR u otros, si corresponde)
   5.7 Prestaciones accesorias (si corresponde)
6. REQUISITOS DEL PROVEEDOR Y DE SU PERSONAL
   6.1 Del proveedor (RNP vigente en el capítulo correspondiente, habilitaciones)
   6.2 Del personal (perfil, formación, experiencia)
7. LUGAR Y PLAZO DE PRESTACIÓN DEL SERVICIO
8. RESULTADOS ESPERADOS / ENTREGABLES (contenido, plazo y forma de presentación de cada uno)
9. OTRAS OBLIGACIONES DEL CONTRATISTA (SST, confidencialidad, propiedad intelectual)
10. CONFORMIDAD DE LA PRESTACIÓN (órgano que otorga, plazo, observaciones)
11. FORMA DE PAGO (único o por entregables, documentación para el pago)
12. PENALIDADES (por mora según el Reglamento y otras penalidades objetivas, razonables y congruentes)
13. RESPONSABILIDAD POR VICIOS OCULTOS
14. CLÁUSULA ANTICORRUPCIÓN Y ANTISOBORNO
15. REQUISITOS DE CALIFICACIÓN (capacidad legal, capacidad técnica y profesional, experiencia del postor) — solo si es procedimiento de selección
16. ANEXOS`.trim(),
    normasEspecificas: `
- Normas técnicas, sectoriales o municipales que regulen el servicio específico (identificarlas según el objeto).
- Si el servicio implica trabajo de campo o riesgo: SCTR (Ley N° 26790), EPP, plan de SST.`.trim(),
  },

  tdr_consultoria_obra: {
    id: "tdr_consultoria_obra",
    nombre: "TDR — Consultoría de obra",
    descripcionCorta: "Elaboración de expediente técnico, supervisión de obra, estudios de preinversión, etc.",
    tipoReferencia: "TDR",
    estructura: `
1. DENOMINACIÓN DE LA CONTRATACIÓN
2. FINALIDAD PÚBLICA
3. ANTECEDENTES (incluir datos del proyecto: CUI, nombre del PI, estado en Invierte.pe — usar marcadores si no se conocen)
4. OBJETIVOS (general y específicos)
5. UBICACIÓN Y ÁREA DE INFLUENCIA (departamento, provincia, distrito, altitud, clima, accesos)
6. ALCANCES Y DESCRIPCIÓN DEL SERVICIO
   6.1 Actividades y estudios básicos (topografía, estudio de mecánica de suelos, hidrología/hidráulica, canteras y fuentes de agua, estudio de impacto ambiental o instrumento de gestión ambiental, CIRA / evaluación arqueológica, gestión del riesgo de desastres, saneamiento físico-legal, según el tipo de obra)
   6.2 Contenido del expediente técnico o del servicio de supervisión (memoria descriptiva, especificaciones técnicas, planos, metrados, análisis de costos unitarios, presupuesto, fórmula polinómica, cronogramas, etc.)
   6.3 Metodología BIM (si la entidad la aplica, conforme al Plan BIM Perú)
   6.4 Coordinaciones con la entidad y con terceros (EPS, concesionarias, Ministerio de Cultura, ANA, SENACE, etc.)
7. NORMATIVA TÉCNICA APLICABLE
8. PLANTEL PROFESIONAL CLAVE (cargo, formación académica, experiencia en la especialidad, participación)
9. EQUIPAMIENTO ESTRATÉGICO (si corresponde)
10. PLAZO DE EJECUCIÓN (por etapas / entregables)
11. ENTREGABLES (contenido, plazo, número de ejemplares, formato digital editable y firmado)
12. REVISIÓN, OBSERVACIONES Y LEVANTAMIENTO (plazos de la entidad y del consultor)
13. CONFORMIDAD
14. FORMA DE PAGO (porcentajes por entregable aprobado)
15. PENALIDADES (mora y otras penalidades: ausencia de personal clave, incumplimiento de entregables, etc.)
16. RESPONSABILIDAD DEL CONSULTOR (por la calidad del expediente o de la supervisión; plazo de responsabilidad conforme a la Ley N° 32069)
17. CONFIDENCIALIDAD Y PROPIEDAD INTELECTUAL
18. CLÁUSULA ANTICORRUPCIÓN Y ANTISOBORNO
19. REQUISITOS DE CALIFICACIÓN (capacidad legal, capacidad técnica y profesional, experiencia del postor en la especialidad, definiendo "obras similares")
20. ANEXOS`.trim(),
    normasEspecificas: `
- Reglamento Nacional de Edificaciones (RNE) y sus normas técnicas aplicables (E.020, E.030 Diseño Sismorresistente, E.050 Suelos y Cimentaciones, E.060 Concreto Armado, OS.010–OS.100 Saneamiento, EM.010 Instalaciones eléctricas, A.010, A.040 Educación, A.050 Salud, A.120 Accesibilidad, G.050 Seguridad, etc.).
- Manual de Carreteras del MTC (Diseño Geométrico DG-2018, Especificaciones Técnicas Generales EG-2013, Suelos, Geología, Geotecnia y Pavimentos, Hidrología, Hidráulica y Drenaje) para infraestructura vial.
- Norma Técnica de Metrados para Obras de Edificación y Habilitaciones Urbanas (R.D. N° 073-2010-VIVIENDA/VMCS-DNC).
- D.L. N° 1252 – Invierte.pe y sus directivas; contenidos mínimos sectoriales (MINEDU, MINSA, MVCS, MIDAGRI, MTC).
- Normas sectoriales: PRONIED/MINEDU (infraestructura educativa), MINSA (establecimientos de salud), ANA (recursos hídricos), MVCS (saneamiento rural y urbano).
- Ley N° 28296 (Patrimonio Cultural) y su reglamento — CIRA o PMA cuando corresponda.
- Instrumentos de gestión ambiental según el sector (SEIA).`.trim(),
  },

  eett_obra: {
    id: "eett_obra",
    nombre: "EETT — Obra (partidas del expediente técnico)",
    descripcionCorta: "Especificaciones técnicas por partidas para una obra o componente de obra",
    tipoReferencia: "EETT",
    estructura: `
ESPECIFICACIONES TÉCNICAS
A. GENERALIDADES
   A.1 Alcance de las especificaciones
   A.2 Normas y documentos de referencia (orden de prelación: planos, especificaciones, metrados/presupuesto)
   A.3 Materiales (calidad, aprobación por la supervisión, almacenamiento)
   A.4 Equipos y herramientas
   A.5 Seguridad, salud en el trabajo y medio ambiente
   A.6 Cuaderno de obra, control de calidad y ensayos
B. ESPECIFICACIONES POR PARTIDAS
   Organizar con la itemización estándar aplicable al tipo de obra (p. ej. 01 OBRAS PROVISIONALES, 02 SEGURIDAD Y SALUD, 03 MOVIMIENTO DE TIERRAS, 04 OBRAS DE CONCRETO SIMPLE, 05 OBRAS DE CONCRETO ARMADO, 06 MUROS Y TABIQUES, 07 REVOQUES Y REVESTIMIENTOS, ... para edificaciones; o la itemización del EG-2013 para carreteras; o la de saneamiento).
   Para CADA partida desarrollar obligatoriamente:
   - Código y nombre de la partida
   - Descripción
   - Materiales (con normas técnicas NTP / ASTM / ACI aplicables)
   - Equipos y herramientas
   - Procedimiento constructivo / método de ejecución
   - Controles de calidad y tolerancias (ensayos, frecuencia, criterios de aceptación)
   - Unidad de medida (m, m², m³, kg, und, glb, etc.)
   - Método de medición
   - Condiciones / forma de pago`.trim(),
    normasEspecificas: `
- Reglamento Nacional de Edificaciones (RNE): E.060 Concreto Armado, E.070 Albañilería, E.050 Suelos, E.030 Sismorresistente, E.090 Estructuras metálicas, IS.010 Instalaciones sanitarias, EM.010 Instalaciones eléctricas, OS.050/OS.070 Redes de agua y alcantarillado, G.050 Seguridad durante la construcción.
- Norma Técnica de Metrados para Obras de Edificación y Habilitaciones Urbanas (R.D. N° 073-2010-VIVIENDA/VMCS-DNC) para unidades y criterios de medición.
- Manual de Carreteras: Especificaciones Técnicas Generales para Construcción EG-2013 (MTC) para obras viales.
- Normas Técnicas Peruanas (NTP) de INACAL para materiales: cemento (NTP 334.009), agregados (NTP 400.037), acero de refuerzo (NTP 341.031), ladrillos (NTP 331.017), agua para concreto (NTP 339.088), tuberías PVC (NTP ISO 1452 / NTP 399.002), etc. Complementar con ASTM / ACI cuando no exista NTP.
- Considerar condiciones climáticas de la zona (costa, sierra, selva; heladas, friaje, lluvias, altitud) en procedimientos como vaciado y curado de concreto (ACI 306 tiempo frío / ACI 305 tiempo caluroso).`.trim(),
  },

  eett_bienes: {
    id: "eett_bienes",
    nombre: "EETT — Bienes",
    descripcionCorta: "Especificaciones técnicas para adquisición de bienes, materiales o equipos",
    tipoReferencia: "EETT",
    estructura: `
1. DENOMINACIÓN DE LA CONTRATACIÓN
2. FINALIDAD PÚBLICA
3. ANTECEDENTES (si corresponde)
4. OBJETIVOS DE LA CONTRATACIÓN
5. CARACTERÍSTICAS Y CONDICIONES DE LOS BIENES
   5.1 Descripción y cantidad (cuadro: ítem, descripción, unidad de medida, cantidad)
   5.2 Características técnicas (cuadro detallado por bien; sin marcas, o con "o equivalente")
   5.3 Normas técnicas, reglamentos técnicos, normas metrológicas y/o sanitarias
   5.4 Acondicionamiento, embalaje y rotulado
   5.5 Garantía comercial (alcance, periodo, inicio del cómputo)
   5.6 Prestaciones accesorias (instalación, capacitación, mantenimiento, si corresponde)
   5.7 Disponibilidad de servicios y repuestos (si corresponde)
   5.8 Muestras / protocolos de prueba (si corresponde)
6. LUGAR Y PLAZO DE ENTREGA
7. REQUISITOS DEL PROVEEDOR (RNP, autorizaciones, registros sanitarios, etc.)
8. CONFORMIDAD DE LA RECEPCIÓN
9. FORMA DE PAGO
10. PENALIDADES
11. RESPONSABILIDAD POR VICIOS OCULTOS
12. CLÁUSULA ANTICORRUPCIÓN Y ANTISOBORNO
13. REQUISITOS DE CALIFICACIÓN (solo si es procedimiento de selección)
14. ANEXOS`.trim(),
    normasEspecificas: `
- Normas Técnicas Peruanas (NTP) de INACAL aplicables al bien; normas internacionales (ISO, ASTM, IEC) cuando correspondan.
- Fichas técnicas de Perú Compras y catálogos electrónicos de Acuerdos Marco: verificar si el bien está incluido (si lo está, indicarlo).
- Reglamentos técnicos sectoriales (DIGESA, DIGEMID, MTC, etc.) según el bien.`.trim(),
  },
};

export const DEPARTAMENTOS_PERU = [
  "Amazonas", "Áncash", "Apurímac", "Arequipa", "Ayacucho", "Cajamarca", "Callao",
  "Cusco", "Huancavelica", "Huánuco", "Ica", "Junín", "La Libertad", "Lambayeque",
  "Lima", "Loreto", "Madre de Dios", "Moquegua", "Pasco", "Piura", "Puno",
  "San Martín", "Tacna", "Tumbes", "Ucayali",
];
