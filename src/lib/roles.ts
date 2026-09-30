import type { Tipo } from "./types";
export type Rol = "admin" | "troquelado" | "guillotina";
export const ROLES: { id: Rol; label: string }[] = [
  { id: "admin", label: "Administrador" }, { id: "troquelado", label: "Troquelado" }, { id: "guillotina", label: "Guillotina" },
];
// Pestañas (tipos) visibles por perfil
export const TIPOS_ROL: Record<Rol, Tipo[]> = {
  admin: ["corte", "embossing", "blummer"],
  troquelado: ["corte", "embossing"],
  guillotina: ["blummer"],
};
export const puedeEditar = (r: Rol) => r === "admin";
// Campo "golpes" editable por perfil (se activará en una fase posterior)
export const puedeEditarGolpes = (r: Rol, t: Tipo) => r === "admin" || (r === "troquelado" && t === "corte") || (r === "guillotina" && t === "blummer");

// BETA: el perfil se elige a mano. En SharePoint saldrá del grupo del usuario (p. ej. SPFx: sp.web.currentUser.groups()).
export const leerRol = (): Rol => (localStorage.getItem("rol") as Rol) || "admin";
export const guardarRol = (r: Rol) => localStorage.setItem("rol", r);

// BETA: usuarios de prueba (credenciales en el código, NO seguro). Se sustituirá por la identidad de SharePoint/Microsoft 365.
export const USUARIOS: { usuario: string; clave: string; rol: Rol; nombre: string }[] = [
  { usuario: "admin", clave: "admin", rol: "admin", nombre: "Administrador" },
  { usuario: "troquelado", clave: "troquelado", rol: "troquelado", nombre: "Troquelado" },
  { usuario: "guillotina", clave: "guillotina", rol: "guillotina", nombre: "Guillotina" },
];
export const leerSesion = (): Rol | null => sessionStorage.getItem("sesion") as Rol | null;
export const iniciarSesion = (u: string, c: string): Rol | null => {
  const x = USUARIOS.find((y) => y.usuario === u.trim().toLowerCase() && y.clave === c);
  if (x) sessionStorage.setItem("sesion", x.rol);
  return x?.rol ?? null;
};
export const cerrarSesion = () => sessionStorage.removeItem("sesion");
