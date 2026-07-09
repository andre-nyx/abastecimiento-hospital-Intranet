import { db } from "../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import type { Devolucion } from "../types/Devolucion";

const devolucionesRef = collection(db, "devoluciones");

export const agregarDevolucionFirestore = async (
  devolucion: Omit<Devolucion, "id">
): Promise<string> => {
  const docRef = await addDoc(devolucionesRef, devolucion);
  return docRef.id;
};

export const editarDevolucionFirestore = async (
  id: string,
  cambios: Partial<Omit<Devolucion, "id">>
): Promise<void> => {
  const devolucionDoc = doc(db, "devoluciones", id);
  await updateDoc(devolucionDoc, cambios);
};

export const eliminarDevolucionFirestore = async (id: string): Promise<void> => {
  const devolucionDoc = doc(db, "devoluciones", id);
  await deleteDoc(devolucionDoc);
};

/**
 * Escucha en tiempo real la coleccion de devoluciones.
 * Devuelve la funcion de "unsubscribe" para limpiar el listener.
 */
export const escucharDevoluciones = (
  callback: (devoluciones: Devolucion[]) => void
) => {
  return onSnapshot(devolucionesRef, (snapshot) => {
    const devoluciones = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Devolucion, "id">),
    }));
    callback(devoluciones);
  });
};