import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  LevelFormat,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { marked, type Token, type Tokens } from "marked";

/**
 * Convierte el Markdown generado por Claude en un documento Word con formato
 * de documento institucional: Arial 11, A4, márgenes de 2.5 cm, títulos en
 * negrita, tablas con bordes y numeración de páginas.
 */

const FUENTE = "Arial";

type Estilo = { bold?: boolean; italics?: boolean };

function inlines(tokens: Token[] | undefined, estilo: Estilo = {}): TextRun[] {
  if (!tokens) return [];
  const out: TextRun[] = [];
  for (const t of tokens) {
    switch (t.type) {
      case "strong":
        out.push(...inlines((t as Tokens.Strong).tokens, { ...estilo, bold: true }));
        break;
      case "em":
        out.push(...inlines((t as Tokens.Em).tokens, { ...estilo, italics: true }));
        break;
      case "codespan":
        out.push(new TextRun({ text: decodificar((t as Tokens.Codespan).text), font: FUENTE, ...estilo }));
        break;
      case "br":
        out.push(new TextRun({ break: 1 }));
        break;
      case "link":
        out.push(...inlines((t as Tokens.Link).tokens, estilo));
        break;
      case "text": {
        const tt = t as Tokens.Text;
        if (tt.tokens?.length) out.push(...inlines(tt.tokens, estilo));
        else out.push(new TextRun({ text: decodificar(tt.text), font: FUENTE, ...estilo }));
        break;
      }
      default:
        if ("text" in t && typeof t.text === "string")
          out.push(new TextRun({ text: decodificar(t.text), font: FUENTE, ...estilo }));
    }
  }
  return out;
}

function decodificar(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

const BORDE = { style: BorderStyle.SINGLE, size: 4, color: "808080" };

function tabla(t: Tokens.Table): Table {
  const fila = (celdas: Tokens.TableCell[], encabezado: boolean) =>
    new TableRow({
      tableHeader: encabezado,
      children: celdas.map(
        (c) =>
          new TableCell({
            shading: encabezado ? { type: ShadingType.CLEAR, fill: "D9E2F3", color: "auto" } : undefined,
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: inlines(c.tokens, encabezado ? { bold: true } : {}),
                alignment: encabezado ? AlignmentType.CENTER : AlignmentType.LEFT,
              }),
            ],
          }),
      ),
    });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: BORDE, bottom: BORDE, left: BORDE, right: BORDE, insideHorizontal: BORDE, insideVertical: BORDE },
    rows: [fila(t.header, true), ...t.rows.map((r) => fila(r, false))],
  });
}

function bloques(tokens: Token[], nivelLista = 0): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  for (const t of tokens) {
    switch (t.type) {
      case "heading": {
        const h = t as Tokens.Heading;
        const nivel = [HeadingLevel.TITLE, HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3][Math.min(h.depth, 4) - 1];
        out.push(
          new Paragraph({
            heading: nivel,
            alignment: h.depth === 1 ? AlignmentType.CENTER : AlignmentType.LEFT,
            spacing: { before: h.depth === 1 ? 0 : 240, after: 120 },
            children: inlines(h.tokens, { bold: true }),
          }),
        );
        break;
      }
      case "paragraph":
        out.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 120 },
            children: inlines((t as Tokens.Paragraph).tokens),
          }),
        );
        break;
      case "list": {
        const l = t as Tokens.List;
        for (const item of l.items) {
          const [primero, ...resto] = item.tokens;
          const runs =
            primero && (primero.type === "text" || primero.type === "paragraph")
              ? inlines((primero as Tokens.Text).tokens ?? [primero])
              : [];
          out.push(
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 60 },
              numbering: { reference: l.ordered ? "numerada" : "vinetas", level: Math.min(nivelLista, 2) },
              children: runs,
            }),
          );
          const sub = runs.length ? resto : item.tokens;
          out.push(...bloques(sub, nivelLista + 1));
        }
        break;
      }
      case "table":
        out.push(tabla(t as Tokens.Table));
        out.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
        break;
      case "blockquote":
        out.push(...bloques((t as Tokens.Blockquote).tokens, nivelLista));
        break;
      case "code":
        for (const linea of (t as Tokens.Code).text.split("\n"))
          out.push(new Paragraph({ children: [new TextRun({ text: linea, font: "Consolas", size: 20 })] }));
        break;
      case "hr":
        out.push(new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "999999", space: 1 } }, children: [] }));
        break;
      case "space":
        break;
      default:
        if ("text" in t && typeof t.text === "string" && t.text.trim())
          out.push(new Paragraph({ children: [new TextRun({ text: decodificar(t.text), font: FUENTE })] }));
    }
  }
  return out;
}

const nivelesLista = (ordenada: boolean) =>
  [0, 1, 2].map((level) => ({
    level,
    format: ordenada ? [LevelFormat.DECIMAL, LevelFormat.LOWER_LETTER, LevelFormat.LOWER_ROMAN][level] : LevelFormat.BULLET,
    text: ordenada ? `%${level + 1}${level === 1 ? ")" : "."}` : ["•", "–", "▪"][level],
    alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 567 * (level + 1), hanging: 360 } } },
  }));

export async function markdownADocx(markdown: string): Promise<Buffer> {
  const tokens = marked.lexer(markdown, { gfm: true });
  const doc = new Document({
    creator: "Generador TDR/EETT",
    styles: {
      default: { document: { run: { font: FUENTE, size: 22 } } },
      paragraphStyles: [
        { id: "Title", name: "Title", run: { font: FUENTE, size: 28, bold: true, color: "000000" } },
        { id: "Heading1", name: "Heading 1", run: { font: FUENTE, size: 24, bold: true, color: "000000" } },
        { id: "Heading2", name: "Heading 2", run: { font: FUENTE, size: 22, bold: true, color: "000000" } },
        { id: "Heading3", name: "Heading 3", run: { font: FUENTE, size: 22, bold: true, italics: true, color: "000000" } },
      ],
    },
    numbering: {
      config: [
        { reference: "vinetas", levels: nivelesLista(false) },
        { reference: "numerada", levels: nivelesLista(true) },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 1418, bottom: 1418, left: 1418, right: 1418 }, // 2.5 cm
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: "Página ", font: FUENTE, size: 18 }),
                  new TextRun({ children: [PageNumber.CURRENT], font: FUENTE, size: 18 }),
                  new TextRun({ text: " de ", font: FUENTE, size: 18 }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FUENTE, size: 18 }),
                ],
              }),
            ],
          }),
        },
        children: bloques(tokens),
      },
    ],
  });
  return Packer.toBuffer(doc);
}
