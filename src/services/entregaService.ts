import { db } from "../firebase/config";
import { collection, addDoc, doc, updateDoc, onSnapshot } from "firebase/firestore";
import type { Entrega } from "../types/Entrega";

const entregasRef = collection(db, "entregas");

export const agregarEntregaFirestore = async (
  entrega: Omit<Entrega, "id">
): Promise<string> => {
  const docRef = await addDoc(entregasRef, entrega);
  return docRef.id;
};

export const editarEntregaFirestore = async (
  id: string,
  cambios: Partial<Omit<Entrega, "id">>
): Promise<void> => {
  const entregaDoc = doc(db, "entregas", id);
  await updateDoc(entregaDoc, cambios);
};

/**
 * Escucha en tiempo real la colección de entregas.
 * Devuelve la función de "unsubscribe" para limpiar el listener.
 */
export const escucharEntregas = (
  callback: (entregas: Entrega[]) => void
) => {
  return onSnapshot(entregasRef, (snapshot) => {
    const entregas = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Entrega, "id">),
    }));
    callback(entregas);
  });
};