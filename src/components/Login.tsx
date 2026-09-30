import logo from "../assets/logo.jpeg";
import { useState } from "react";
import { iniciarSesion, type Rol } from "../lib/roles";

export default function Login({ onEntrar }: { onEntrar: (r: Rol) => void }) {
  const [u, setU] = useState("");
  const [c, setC] = useState("");
  const [err, setErr] = useState("");
  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const r = iniciarSesion(u, c);
    if (r) onEntrar(r); else setErr("Usuario o contraseña incorrectos.");
  };
  return (
    <div className="login">
      <form onSubmit={enviar}>
        <img src={logo} alt="Litografía Romero" />
        <h2>Listado de troqueles</h2>
        <label>Usuario<input autoFocus autoCapitalize="none" value={u} onChange={(e) => setU(e.target.value)} /></label>
        <label>Contraseña<input type="password" value={c} onChange={(e) => setC(e.target.value)} /></label>
        {err && <p className="err">{err}</p>}
        <button className="btn prim">Entrar</button>
        <small>Beta · usuarios de prueba: admin, troquelado, guillotina (contraseña igual al usuario)</small>
      </form>
    </div>
  );
}
