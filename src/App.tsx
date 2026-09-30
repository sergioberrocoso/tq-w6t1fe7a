import logo from "./assets/logo.jpeg";
import { useEffect, useMemo, useState } from "react";
import type { Filtros, Movimiento, Tipo, Troquel } from "./lib/types";
import { filtrar, fmtFecha, indexar, jsonService, relacionados, superaUmbral, unicos } from "./lib/data";
import { ROLES, TIPOS_ROL, cerrarSesion, leerSesion, puedeEditar, type Rol } from "./lib/roles";
import Golpes from "./components/Golpes";
import Login from "./components/Login";
import Formulario, { nuevo } from "./components/Formulario";
import "./App.css";

const TIPOS: { id: Tipo; label: string }[] = [
  { id: "corte", label: "Troquel" }, { id: "embossing", label: "Relieve" }, { id: "blummer", label: "Blummer" },
];
const HERR = ["Pertinax", "P. fresada", "Expulsión", "Sep. poses", "Die embossing", "Relieves", "Moldes"];
const vacio: Filtros = { texto: "", tipos: [], cliente: "", fabricante: "", estado: "", herramientas: [] };
const tipoLabel = (t: Tipo) => TIPOS.find((x) => x.id === t)!.label;
const claseEstado = (e: string | null) => (e === "ACTIVO" ? "ok" : e?.startsWith("PDT") || e === "DESECHAR?" ? "bad" : e ? "warn" : "none");

function Badge({ e }: { e: string | null }) { return <span className={`badge ${claseEstado(e)}`}>{e ?? "Sin estado"}</span>; }

export default function App() {
  const [rol, setRol] = useState<Rol | null>(leerSesion);
  if (!rol) return <Login onEntrar={setRol} />;
  return <Principal rol={rol} onSalir={() => { cerrarSesion(); setRol(null); }} />;
}

function Principal({ rol, onSalir }: { rol: Rol; onSalir: () => void }) {
  const [lista, setLista] = useState<Troquel[]>([]);
  const [f, setF] = useState<Filtros>(vacio);
  const [sel, setSel] = useState<Troquel | null>(null);
  const [panel, setPanel] = useState(false);
  const [edit, setEdit] = useState<Troquel | null>(null);
  useEffect(() => { jsonService.load().then(setLista); }, []);
  const admin = puedeEditar(rol);
  const tiposOk = TIPOS_ROL[rol];
  const visibles = useMemo(() => lista.filter((t) => tiposOk.includes(t.tipo)), [lista, tiposOk]);
  const idx = useMemo(() => new Map(lista.map((t) => [t.id, indexar(t)])), [lista]);
  const res = useMemo(() => filtrar(visibles, idx, f), [visibles, idx, f]);
  const persistir = (l: Troquel[]) => { setLista(l); jsonService.save(l); };
  const guardar = (t: Troquel) => {
    const l = t.id ? lista.map((x) => (x.id === t.id ? t : x)) : [...lista, { ...t, id: `${t.tipo}-${Date.now()}` }];
    persistir(l); setEdit(null); setSel(t.id ? t : l[l.length - 1]);
  };
  const mover = (t: Troquel, m: Omit<Movimiento, "fecha" | "perfil">, cambios: Partial<Troquel>) => {
    const n: Troquel = { ...t, ...cambios, historial: [...(t.historial ?? []), { ...m, fecha: new Date().toISOString(), perfil: ROLES.find((r) => r.id === rol)!.label }] };
    persistir(lista.map((x) => (x.id === t.id ? n : x))); setSel(n);
  };
  const sumar = (t: Troquel, n: number) => mover(t, { tipo: "suma", cantidad: n }, { golpes: (t.golpes ?? 0) + n });
  const reiniciar = (t: Troquel, motivo: string) =>
    mover(t, { tipo: "reinicio", cantidad: t.golpes ?? 0, motivo }, { golpes: 0, ...(motivo === "Reposición" ? { fecha: new Date().toISOString().slice(0, 10) } : {}) });
  const borrar = (t: Troquel) => {
    if (!confirm(`¿Eliminar el troquel ${t.numero}${t.variante ? " " + t.variante : ""}? Esta acción no se puede deshacer.`)) return;
    persistir(lista.filter((x) => x.id !== t.id)); setSel(null);
  };
  const set = (p: Partial<Filtros>) => setF((o) => ({ ...o, ...p }));
  const toggle = <K extends "tipos" | "herramientas">(k: K, v: Filtros[K][number]) =>
    set({ [k]: (f[k] as string[]).includes(v as string) ? (f[k] as string[]).filter((x) => x !== v) : [...f[k], v] } as Partial<Filtros>);
  const activos = f.tipos.length + f.herramientas.length + [f.cliente, f.fabricante, f.estado].filter(Boolean).length;

  return (
    <div className="app">
      <header>
        <img className="logo" src={logo} alt="Litografía Romero" />
        <input className="search" type="search" placeholder="Buscar por número, referencia, cliente, código, ubicación…"
          value={f.texto} onChange={(e) => set({ texto: e.target.value })} />
        {admin && <button className="btn prim" onClick={() => setEdit(nuevo(tiposOk[0]))}>+ Nuevo</button>}
        <span className="usuario">{ROLES.find((r) => r.id === rol)!.label}</span><button className="btn" onClick={onSalir}>Salir</button>
        <button className="btn filtros-btn" onClick={() => setPanel(!panel)}>Filtros{activos ? ` (${activos})` : ""}</button>
      </header>
      <div className="chips">
        {TIPOS.filter((t) => tiposOk.includes(t.id)).length > 1 && TIPOS.filter((t) => tiposOk.includes(t.id)).map((t) => (
          <button key={t.id} className={`chip ${f.tipos.includes(t.id) ? "on" : ""}`} onClick={() => toggle("tipos", t.id)}>{t.label}</button>
        ))}
      </div>
      <section className={`panel ${panel ? "open" : ""}`}>
        <label>Cliente<select value={f.cliente} onChange={(e) => set({ cliente: e.target.value })}>
          <option value="">Todos</option>{unicos(visibles, "cliente").map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Fabricante<select value={f.fabricante} onChange={(e) => set({ fabricante: e.target.value })}>
          <option value="">Todos</option>{unicos(visibles, "fabricante").map((c) => <option key={c}>{c}</option>)}</select></label>
        <label>Estado<select value={f.estado} onChange={(e) => set({ estado: e.target.value })}>
          <option value="">Todos</option>{unicos(visibles, "estado").map((c) => <option key={c}>{c}</option>)}</select></label>
        <div className="herr"><span>Herramientas (corte)</span>
          {HERR.map((h) => <button key={h} className={`chip sm ${f.herramientas.includes(h) ? "on" : ""}`} onClick={() => toggle("herramientas", h)}>{h}</button>)}
        </div>
        <button className="btn link" onClick={() => setF(vacio)}>Limpiar todo</button>
      </section>
      <p className="count">{res.length} de {visibles.length} troqueles</p>

      <table className="tabla">
        <thead><tr><th>Nº</th><th>Tipo</th><th>Ref. fabricante</th>{f.cliente && <th>Cliente</th>}<th>Fabricante</th><th>Poses</th><th>Golpes</th><th>Ubic.</th><th>Estado</th></tr></thead>
        <tbody>{res.map((t) => (
          <tr key={t.id} onClick={() => setSel(t)}>
            <td><b>{t.numero}{t.variante ? ` ${t.variante}` : ""}</b></td><td>{tipoLabel(t.tipo)}</td><td>{t.codigo ?? "—"}</td>
            {f.cliente && <td>{t.cliente ?? "—"}</td>}<td>{t.fabricante ?? "—"}</td><td>{t.poses ?? "—"}</td>
            <td className={superaUmbral(t) ? "alerta" : ""}>{superaUmbral(t) && "⚠ "}{t.golpes?.toLocaleString("es-ES") ?? "—"}</td><td>{t.ubicacion ?? "—"}</td><td><Badge e={t.estado} /></td>
          </tr>))}</tbody>
      </table>
      <div className="cards">{res.map((t) => (
        <article key={t.id} className="card" onClick={() => setSel(t)}>
          <div className="row"><b>{t.numero}{t.variante ? ` ${t.variante}` : ""}</b><span>{superaUmbral(t) && <span className="badge bad">⚠ Afilar</span>} <Badge e={t.estado} /></span></div>
          <div className="ref">{t.codigo ?? "Sin código"}</div>
          <div className="meta">{tipoLabel(t.tipo)}{f.cliente ? ` · ${t.cliente}` : ""}{t.ubicacion ? ` · ${t.ubicacion}` : ""}</div>
        </article>))}</div>
      {!res.length && <p className="vacio">Sin resultados. Prueba a quitar filtros.</p>}

      {edit && <Formulario key={edit.id || "nuevo"} inicial={edit} clientes={unicos(lista, "cliente")} fabricantes={unicos(lista, "fabricante")} onGuardar={guardar} onCancelar={() => setEdit(null)} />}
      {sel && <Detalle t={sel} lista={visibles} rol={rol} onSumar={(n) => sumar(sel, n)} onReiniciar={(m) => reiniciar(sel, m)} admin={admin} onEdit={() => { setEdit(sel); }} onDelete={() => borrar(sel)} onClose={() => setSel(null)} onSel={setSel} />}
    </div>
  );
}

function Detalle({ t, lista, rol, onSumar, onReiniciar, admin, onEdit, onDelete, onClose, onSel }: { t: Troquel; lista: Troquel[]; rol: Rol; onSumar: (n: number) => void; onReiniciar: (m: string) => void; admin: boolean; onEdit: () => void; onDelete: () => void; onClose: () => void; onSel: (t: Troquel) => void }) {
  const rel = relacionados(lista, t);
  const campos: [string, React.ReactNode][] = [
    ["Tipo", tipoLabel(t.tipo)], ["Cliente", t.cliente ?? "—"], ["Fabricante", t.fabricante ?? "—"], ["Referencia fabricante", t.codigo ?? "—"],
    ["Fecha", fmtFecha(t.fecha)], ["Poses", t.poses ?? "—"], ["Ubicación", t.ubicacion ?? "—"],
    
  ];
  return (
    <div className="overlay" onClick={onClose}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Cerrar">×</button>
        <h2>Troquel {t.numero}{t.variante ? ` ${t.variante}` : ""} <Badge e={t.estado} /></h2>
        <p className="ref">{t.referencia}</p>
        <dl>{campos.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
        {t.tipo === "corte" && <Herr d={t} />}
        {t.tipo === "embossing" && rel.filter((r) => r.tipo === "corte").map((r) => <Herr key={r.id} d={r} titulo={`Herramientas del troquel ${r.numero}${r.variante ? " " + r.variante : ""}`} />)}
        {t.tipo !== "embossing" && <Golpes key={t.id} t={t} rol={rol} onSumar={onSumar} onReiniciar={onReiniciar} />}
        {t.observaciones && <p className="obs"><b>Observaciones:</b> {t.observaciones}</p>}
        {rel.length > 0 && <>
          <h3>Mismo trabajo (nº base {t.base})</h3>
          <ul className="rel">{rel.map((r) => (
            <li key={r.id} onClick={() => onSel(r)}><b>{r.numero}{r.variante ? ` ${r.variante}` : ""}</b> <small>{tipoLabel(r.tipo)}</small><br />{r.referencia}</li>))}</ul></>}
      {admin && <div className="acciones"><button className="btn del" onClick={onDelete}>Eliminar</button><button className="btn prim" onClick={onEdit}>Modificar</button></div>}
      </aside>
    </div>
  );
}


function Herr({ d, titulo = "Herramientas" }: { d: Troquel; titulo?: string }) {
  return (
    <>
      <h3>{titulo}</h3>
      <ul className="herrs">{HERR.map((h) => { const on = d.herramientas.includes(h); return <li key={h} className={on ? "si" : "no"}>{on ? "✓" : "–"} {h}</li>; })}</ul>
    </>
  );
}






