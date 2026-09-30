export type Tipo = "corte" | "embossing" | "blummer";
export interface Movimiento { fecha: string; perfil: string; tipo: "suma" | "reinicio"; cantidad: number; motivo?: string }
export interface Troquel {
  historial?: Movimiento[];
  id: string; tipo: Tipo; numero: string; variante: string | null; base: string; sufijo: string | null;
  fecha: string | null; fabricante: string | null; codigo: string | null; referencia: string;
  poses: number | null; cliente: string | null; herramientas: string[]; observaciones: string | null;
  golpes: number | null; estado: string | null; ubicacion: string | null;
}
export interface Filtros {
  texto: string; tipos: Tipo[]; cliente: string; fabricante: string; estado: string; herramientas: string[];
}

