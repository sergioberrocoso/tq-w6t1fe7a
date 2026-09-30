import * as XLSX from "xlsx";
import fs from "node:fs";
import path from "node:path";

const src = process.argv[2] ?? "C:/Users/daemo/Desktop/2026 - LISTADO TROQUELES BOBST_bueno.xlsx";
const alias: Record<string, string> = JSON.parse(fs.readFileSync("src/data/clientes-alias.json", "utf8").replace(/^\uFEFF/, ""));
const wb = XLSX.read(fs.readFileSync(src), { cellDates: true });

const str = (v: unknown) => (v == null ? "" : String(v).replace(/\u00a0/g, " ").trim());
const isX = (v: unknown) => str(v).toUpperCase() === "X";
const fecha = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : null);
const cliente = (v: unknown) => { const s = str(v); if (!s) return null; const up = s.toUpperCase(); return alias[s] ?? alias[up] ?? up; };
const fabricante = (v: unknown) => { const s = str(v).toUpperCase(); return s || null; };
const estado = (v: unknown) => str(v).toUpperCase() || null;
const num = (v: unknown) => (typeof v === "number" ? v : null);

function parseId(a: unknown, b: unknown) {
  const numero = str(a);
  const variante = str(b) || null;
  const m = numero.match(/^(\d+)(.*)$/);
  const base = m ? m[1] : numero;
  const sufijo = (m ? m[2] : "").replace(/^-/, "").toUpperCase() || null;
  return { numero, variante, base, sufijo };
}

const incidencias: string[] = [];
const dies: any[] = [];
const rows = (i: number) => XLSX.utils.sheet_to_json<any[]>(wb.Sheets[wb.SheetNames[i]], { header: 1, raw: true, defval: null });

// Hoja 0: corte; Hoja 1: embossing
for (const [idx, tipo] of [[0, "corte"], [1, "embossing"]] as const) {
  let ubicacion: string | null = null;
  rows(idx).slice(1).forEach((r, n) => {
    if (r[0] == null && r[5] && !r[3]) { ubicacion = str(r[5]).replace(/\s+/g, " ").toUpperCase(); return; }
    if (r[0] == null) return;
    const id = parseId(r[0], r[1]);
    const herramientas = idx === 0
      ? Object.entries({ Pertinax: 8, "P. fresada": 9, "Expulsión": 10, "Sep. poses": 11, "Die embossing": 12, Relieves: 13, Moldes: 14 })
          .filter(([, c]) => isX(r[c])).map(([k]) => k)
      : [];
    const d = {
      id: `${tipo}-${dies.length}`, tipo, ...id,
      fecha: fecha(r[2]), fabricante: fabricante(r[3]), codigo: str(r[4]) || null,
      referencia: str(r[5]), poses: num(r[6]), cliente: cliente(r[7]), herramientas,
      observaciones: str(r[15]) || null, golpes: idx === 0 ? num(r[16]) : null,
      estado: estado(r[idx === 0 ? 17 : 16]), ubicacion: idx === 0 ? ubicacion : null,
    };
    if (!d.estado) incidencias.push(`${tipo} ${d.numero}: sin estado`);
    if (!d.cliente) incidencias.push(`${tipo} ${d.numero}: sin cliente`);
    dies.push(d);
  });
}

// Hoja 2: blummer
rows(2).slice(1).forEach((r) => {
  if (r[0] == null) return;
  dies.push({
    id: `blummer-${dies.length}`, tipo: "blummer", numero: str(r[0]), variante: null, base: str(r[0]), sufijo: null,
    fecha: fecha(r[1]), fabricante: null, codigo: str(r[2]) || null, referencia: str(r[3]), poses: null,
    cliente: cliente(r[4]), herramientas: [], observaciones: str(r[6]) || null, golpes: null,
    estado: estado(r[5]), ubicacion: null,
  });
});

// Relación embossing -> corte por número base
const corteBases = new Set(dies.filter((d) => d.tipo === "corte").map((d) => d.base));
for (const d of dies.filter((x) => x.tipo === "embossing"))
  if (!corteBases.has(d.base)) incidencias.push(`embossing ${d.numero}: no existe troquel de corte con base ${d.base}`);

fs.mkdirSync("src/data", { recursive: true });
fs.writeFileSync("src/data/troqueles.json", JSON.stringify(dies));
fs.writeFileSync("scripts/incidencias.txt", incidencias.join("\n"));
console.log(`${dies.length} troqueles, ${incidencias.length} incidencias`);

