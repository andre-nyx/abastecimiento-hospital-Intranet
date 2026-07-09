import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  type User,
} from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";

export type Rol = "admin" | "usuario";

export interface UsuarioApp {
  uid: string;
  correo: string;
  rol: Rol;
}

const ADMIN_CORREO = "admin@redsalud.gov.cl";
const ADMIN_PASSWORD = "Admin123";

// Config duplicada (mismos valores que firebase.ts) para poder crear una
// instancia secundaria de Firebase. Se usa solo para crear cuentas nuevas
// sin cerrar la sesión de quien las está creando (el admin).
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

function obtenerAppSecundaria() {
  const nombre = "app-secundaria-alta-usuarios";
  const existente = getApps().find((a) => a.name === nombre);
  return existente ?? initializeApp(firebaseConfig, nombre);
}

/** Lee el rol de un usuario desde Firestore (colección "usuarios", doc = uid). */
async function obtenerRol(uid: string): Promise<Rol> {
  const ref = doc(db, "usuarios", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return (snap.data().rol as Rol) ?? "usuario";
  }
  return "usuario";
}

/**
 * Se asegura de que exista la cuenta admin fija (admin@redsalud.gov.cl / Admin123)
 * con rol "admin" en Firestore. Usa una app secundaria de Firebase para no
 * interferir con la sesión activa. Debe llamarse una vez al iniciar la app.
 */
/**
 * Se asegura de que exista la cuenta admin fija (admin@redsalud.gov.cl / Admin123)
 * con rol "admin" en Firestore. Usa una app secundaria de Firebase para no
 * interferir con la sesión activa. Debe llamarse una vez al iniciar la app.
 *
 * Protegido con un candado a nivel de módulo: si se llama varias veces en
 * paralelo (ej. por React Strict Mode ejecutando el efecto dos veces), solo
 * se ejecuta una vez real, evitando crear cuentas admin duplicadas.
 */
let asegurarAdminPromise: Promise<void> | null = null;

export function asegurarAdminExiste(): Promise<void> {
  if (!asegurarAdminPromise) {
    asegurarAdminPromise = asegurarAdminExisteInterno();
  }
  return asegurarAdminPromise;
}

async function asegurarAdminExisteInterno(): Promise<void> {
  const appSecundaria = obtenerAppSecundaria();
  const authSecundaria = getAuth(appSecundaria);
  const dbSecundaria = getFirestore(appSecundaria);
  try {
    // Intenta iniciar sesión con la cuenta admin en la instancia secundaria
    const cred = await signInWithEmailAndPassword(
      authSecundaria,
      ADMIN_CORREO,
      ADMIN_PASSWORD
    );
    // Ya existe: asegura que su documento de rol esté correcto.
    // Se escribe usando dbSecundaria porque en este punto authSecundaria
    // SÍ tiene sesión activa (necesario si las reglas de Firestore exigen
    // request.auth != null); la app principal (auth/db) aún no tiene sesión.
    await setDoc(
      doc(dbSecundaria, "usuarios", cred.user.uid),
      { correo: ADMIN_CORREO, rol: "admin" },
      { merge: true }
    );
  } catch (err: unknown) {
    const codigo = (err as { code?: string })?.code;
    if (
      codigo === "auth/user-not-found" ||
      codigo === "auth/invalid-credential" ||
      codigo === "auth/invalid-login-credentials"
    ) {
      // No existe todavía: la crea
      try {
        const cred = await createUserWithEmailAndPassword(
          authSecundaria,
          ADMIN_CORREO,
          ADMIN_PASSWORD
        );
        await setDoc(doc(dbSecundaria, "usuarios", cred.user.uid), {
          correo: ADMIN_CORREO,
          rol: "admin",
        });
      } catch (errCreacion) {
        console.error("No se pudo crear la cuenta admin:", errCreacion);
      }
    } else {
      console.error("No se pudo verificar la cuenta admin:", err);
    }
  } finally {
    await signOut(authSecundaria).catch(() => {});
  }
}

/** Inicia sesión con correo y contraseña usando Firebase Authentication. */
export async function iniciarSesion(
  correo: string,
  password: string
): Promise<UsuarioApp> {
  const cred = await signInWithEmailAndPassword(auth, correo, password);
  const rol = await obtenerRol(cred.user.uid);
  return { uid: cred.user.uid, correo: cred.user.email ?? correo, rol };
}

/** Cierra la sesión actual en Firebase Auth. */
export async function cerrarSesionFirebase(): Promise<void> {
  await signOut(auth);
}

/**
 * Crea una cuenta nueva. Debe invocarse solo desde la UI de administrador.
 * Usa una app secundaria de Firebase para no cerrar la sesión de quien
 * está creando la cuenta.
 */
export async function crearUsuario(
  correo: string,
  password: string,
  rol: Rol = "usuario"
): Promise<void> {
  const appSecundaria = obtenerAppSecundaria();
  const authSecundaria = getAuth(appSecundaria);
  const dbSecundaria = getFirestore(appSecundaria);
  try {
    const cred = await createUserWithEmailAndPassword(
      authSecundaria,
      correo,
      password
    );
    await setDoc(doc(dbSecundaria, "usuarios", cred.user.uid), { correo, rol });
  } finally {
    await signOut(authSecundaria).catch(() => {});
  }
}

/**
 * Suscribe a los cambios de sesión de Firebase Auth. Reemplaza por completo
 * el mecanismo anterior basado en localStorage: la sesión ahora la maneja
 * Firebase (persistencia propia del SDK) y este listener informa a la app
 * quién está logueado y con qué rol.
 */
export function escucharSesion(
  callback: (usuario: UsuarioApp | null) => void
): () => void {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (!user) {
      callback(null);
      return;
    }
    try {
      const rol = await obtenerRol(user.uid);
      callback({ uid: user.uid, correo: user.email ?? "", rol });
    } catch (err) {
      // Si falla la lectura del rol (ej. reglas de Firestore), no dejamos
      // la app colgada esperando: igual se entra, con rol por defecto.
      console.error("No se pudo leer el rol del usuario:", err);
      callback({ uid: user.uid, correo: user.email ?? "", rol: "usuario" });
    }
  });
}