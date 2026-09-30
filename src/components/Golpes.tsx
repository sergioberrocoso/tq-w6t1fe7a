import { useState } from "react";
import type { Troquel } from "../lib/types";
import { UMBRAL_GOLPES, superaUmbral } from "../lib/data";
import { puedeEditar, puedeEditarGolpes, type Rol } from "../lib/roles";

export default function Golpes({ t, rol, onSumar, onReiniciar }: {
  t: Troquel; rol: Rol; onSumar: (n: number) => void; onReiniciar: (motivo: string) => void;
}) {
  const [n, setN] = useState("");
  const [motivo, setMotivo] = useState("Afilado");
  const [confirmar, setConfirmar] = useState(false);
  const cant = parseInt(n.replace(/[.,\s]/g, ""), 10) || 0;
  const hist = [...(t.historial ?? [])].reverse().slice(0, 5);
  return (
    <>
      <h3>Golpes: <b>{(t.golpes ?? 0).toLocaleString("es-ES")}</b></h3>
      {superaUmbral(t) && <p className="aviso">⚠ Supera los {UMBRAL_GOLPES[t.tipo as "corte" | "blummer"].toLocaleString("es-ES")} golpes: revisar para afilado o reposición.</p>}
      {puedeEditarGolpes(rol, t.tipo) && (
        <div className="golpes">
          <input type="text" inputMode="numeric" placeholder="Golpes de esta tirada" value={n} onChange={(e) => setN(e.target.value.replace(/[^\d.,\s]/g, ""))} />
          <button className="btn prim" disabled={!(cant > 0)} onClick={() => { onSumar(cant); setN(""); }}>Sumar</button>
        </div>
      )}
      {puedeEditar(rol) && (confirmar ? (
        <div className="golpes">
          <select value={motivo} onChange={(e) => setMotivo(e.target.value)}><option>Afilado</option><option>Reposición</option></select>
          <button className="btn del" onClick={() => { onReiniciar(motivo); setConfirmar(false); }}>Confirmar reinicio</button>
          <button className="btn" onClick={() => setConfirmar(false)}>Cancelar</button>
        </div>
      ) : <button className="btn link" onClick={() => setConfirmar(true)}>Reiniciar contador…</button>)}
      {hist.length > 0 && <ul className="hist">{hist.map((m, i) => (
        <li key={i}>{new Date(m.fecha).toLocaleDateString("es-ES")} · {m.perfil} · {m.tipo === "suma" ? `+${m.cantidad.toLocaleString("es-ES")}` : `Reinicio (${m.motivo})`}</li>))}</ul>}
    </>
  );
}


