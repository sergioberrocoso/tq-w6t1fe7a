import type { Filtros, Troquel } from "./types";
import data from "../data/troqueles.json";

// Capa de acceso a datos. Para SharePoint: sustituir load() por lectura de listas (Graph/PnPjs).
export interface DataService {
  load(): Promise<Troquel[]>;
  save(lista: Troquel[]): Promise<void>;
  reset(): Promise<Troquel[]>;
}
// BETA: los cambios se guardan en el navegador (localStorage), no son compartidos entre usuarios.
const KEY = "troqueles-datos";
export const jsonService: DataService = {
  load: async () => { const s = localStorage.getItem(KEY); return s ? (JSON.parse(s) as Troquel[]) : (data as Troquel[]); },
  save: async (l) => localStorage.setItem(KEY, JSON.stringify(l)),
  reset: async () => { localStorage.removeItem(KEY); return data as Troquel[]; },
};

export function descomponerNumero(numero: string) {
  const m = numero.trim().match(/^(\d+)(.*)$/);
  return { base: m ? m[1] : numero.trim(), sufijo: (m ? m[2] : "").replace(/^-/, "").toUpperCase() || null };
}

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function indexar(t: Troquel) {
  return norm([t.numero, t.variante, t.fabricante, t.codigo, t.referencia, t.cliente, t.observaciones, t.ubicacion, t.estado].filter(Boolean).join(" "));
}

export function filtrar(lista: Troquel[], idx: Map<string, string>, f: Filtros): Troquel[] {
  const palabras = norm(f.texto).split(/\s+/).filter(Boolean);
  return lista.filter((t) =>
    (!f.tipos.length || f.tipos.includes(t.tipo)) &&
    (!f.cliente || t.cliente === f.cliente) &&
    (!f.fabricante || t.fabricante === f.fabricante) &&
    (!f.estado || t.estado === f.estado) &&
    f.herramientas.every((h) => t.herramientas.includes(h)) &&
    palabras.every((p) => idx.get(t.id)!.includes(p)));
}

export const relacionados = (lista: Troquel[], t: Troquel) =>
  t.tipo === "blummer" ? [] : lista.filter((x) => x.id !== t.id && x.tipo !== "blummer" && x.base === t.base);

export const unicos = (l: Troquel[], k: "cliente" | "fabricante" | "estado") =>
  [...new Set(l.map((t) => t[k]).filter((v): v is string => !!v))].sort();

export const fmtFecha = (f: string | null) => (f ? f.split("-").reverse().join("/") : "—");


// Umbral de golpes a partir del cual se avisa para afilar/reponer
export const UMBRAL_GOLPES = { corte: 2_500_000, blummer: 10_000_000 } as const;
export const superaUmbral = (t: Troquel) => (t.tipo === "corte" || t.tipo === "blummer") && (t.golpes ?? 0) > UMBRAL_GOLPES[t.tipo];
