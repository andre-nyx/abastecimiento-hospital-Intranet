import { db } from "../firebase/config";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import type { Producto } from "../types/Producto";

const productosRef = collection(db, "productos");

export const agregarProductoFirestore = async (
  producto: Omit<Producto, "id">
): Promise<string> => {
  const docRef = await addDoc(productosRef, producto);
  return docRef.id;
};

export const editarProductoFirestore = async (
  id: string,
  cambios: Partial<Omit<Producto, "id">>
): Promise<void> => {
  const productoDoc = doc(db, "productos", id);
  await updateDoc(productoDoc, cambios);
};

export const eliminarProductoFirestore = async (id: string): Promise<void> => {
  const productoDoc = doc(db, "productos", id);
  await deleteDoc(productoDoc);
};