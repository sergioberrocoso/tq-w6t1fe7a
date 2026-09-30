import { useState } from "react";
import type { Tipo, Troquel } from "../lib/types";
import { descomponerNumero } from "../lib/data";

const HERR = ["Pertinax", "P. fresada", "Expulsión", "Sep. poses", "Die embossing", "Relieves", "Moldes"];
const ESTADOS = ["ACTIVO", "AFILANDO", "PENDIENTE", "REPARAR", "PDT ANULAR", "DESECHAR?"];
const TIPOS: [Tipo, string][] = [["corte", "Troquel"], ["embossing", "Relieve"], ["blummer", "Blummer"]];

export function nuevo(tipo: Tipo): Troquel {
  return { id: "", tipo, numero: "", variante: null, base: "", sufijo: null, fecha: null, fabricante: null, codigo: null, referencia: "",
    poses: null, cliente: null, herramientas: [], observaciones: null, golpes: null, estado: "ACTIVO", ubicacion: null };
}

export default function Formulario({ inicial, clientes, fabricantes, onGuardar, onCancelar }: {
  inicial: Troquel; clientes: string[]; fabricantes: string[]; onGuardar: (t: Troquel) => void; onCancelar: () => void;
}) {
  const [t, setT] = useState<Troquel>(inicial);
  const [err, setErr] = useState("");
  const set = (p: Partial<Troquel>) => setT((o) => ({ ...o, ...p }));
  const txt = (v: string) => v.trim() || null;
  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!t.numero.trim()) return setErr("El número de troquel es obligatorio.");
    const c = { ...t, numero: t.numero.trim(), cliente: t.cliente?.toUpperCase() ?? null, fabricante: t.fabricante?.toUpperCase() ?? null, ...descomponerNumero(t.numero) };
    if (c.tipo !== "corte") c.herramientas = [];
    if (c.tipo === "embossing") c.golpes = null;
    onGuardar(c);
  };
  return (
    <div className="overlay" style={{ zIndex: 20 }} onClick={onCancelar}>
      <form className="drawer form" onClick={(e) => e.stopPropagation()} onSubmit={enviar}>
        <button type="button" className="close" onClick={onCancelar} aria-label="Cerrar">×</button>
        <h2>{inicial.id ? "Modificar troquel" : "Nuevo troquel"}</h2>
        <label>Tipo<select value={t.tipo} disabled={!!inicial.id} onChange={(e) => set({ tipo: e.target.value as Tipo })}>
          {TIPOS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <div className="g2">
          <label>Número *<input value={t.numero} onChange={(e) => set({ numero: e.target.value })} /></label>
          <label>Variante<input value={t.variante ?? ""} onChange={(e) => set({ variante: txt(e.target.value) })} placeholder="A, B, V1…" /></label>
        </div>
        <label>Referencia (descripción)<input value={t.referencia} onChange={(e) => set({ referencia: e.target.value })} /></label>
        <div className="g2">
          <label>Fabricante<input list="fabs" value={t.fabricante ?? ""} onChange={(e) => set({ fabricante: txt(e.target.value) })} /></label>
          <label>Ref. fabricante<input value={t.codigo ?? ""} onChange={(e) => set({ codigo: txt(e.target.value) })} /></label>
        </div>
        <datalist id="fabs">{fabricantes.map((f) => <option key={f} value={f} />)}</datalist>
        <label>Cliente<input list="clis" value={t.cliente ?? ""} onChange={(e) => set({ cliente: txt(e.target.value) })} /></label>
        <datalist id="clis">{clientes.map((f) => <option key={f} value={f} />)}</datalist>
        <div className="g2">
          <label>Fecha<input type="date" value={t.fecha ?? ""} onChange={(e) => set({ fecha: e.target.value || null })} /></label>
          <label>Poses<input type="number" min={0} value={t.poses ?? ""} onChange={(e) => set({ poses: e.target.value === "" ? null : +e.target.value })} /></label>
        </div>
        <div className="g2">
          <label>Estado<select value={t.estado ?? ""} onChange={(e) => set({ estado: e.target.value || null })}>
            <option value="">Sin estado</option>{ESTADOS.map((s) => <option key={s}>{s}</option>)}</select></label>
          {t.tipo === "corte" && <label>Ubicación<input value={t.ubicacion ?? ""} onChange={(e) => set({ ubicacion: txt(e.target.value.toUpperCase()) })} placeholder="ESTANTERÍA 1" /></label>}
        </div>
        {t.tipo !== "embossing" && <label>Golpes<input type="text" inputMode="numeric" value={t.golpes?.toLocaleString("es-ES") ?? ""} onChange={(e) => { const d = e.target.value.replace(/\D/g, ""); set({ golpes: d === "" ? null : parseInt(d, 10) }); }} /></label>}
        {t.tipo === "corte" && <>
          <div className="herr"><span>Herramientas</span>
            {HERR.map((h) => <button type="button" key={h} className={`chip sm ${t.herramientas.includes(h) ? "on" : ""}`}
              onClick={() => set({ herramientas: t.herramientas.includes(h) ? t.herramientas.filter((x) => x !== h) : [...t.herramientas, h] })}>{h}</button>)}
          </div></>}
        <label>Observaciones<textarea rows={3} value={t.observaciones ?? ""} onChange={(e) => set({ observaciones: txt(e.target.value) })} /></label>
        {err && <p className="err">{err}</p>}
        <div className="acciones"><button type="button" className="btn" onClick={onCancelar}>Cancelar</button><button className="btn prim">Guardar</button></div>
      </form>
    </div>
  );
}




