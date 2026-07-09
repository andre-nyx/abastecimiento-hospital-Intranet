import { db } from "../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
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

/**
 * Actualiza únicamente el campo "cantidad" (stock) de un producto.
 * Se usa desde entregas y devoluciones, que modifican el stock
 * sin tocar el resto de los datos del producto.
 */
export const actualizarStockProducto = async (
  id: string,
  nuevaCantidad: number
): Promise<void> => {
  const productoDoc = doc(db, "productos", id);
  await updateDoc(productoDoc, { cantidad: nuevaCantidad });
};

/**
 * Escucha en tiempo real la colección de productos.
 * Devuelve la función de "unsubscribe" para limpiar el listener.
 */
export const escucharProductos = (
  callback: (productos: Producto[]) => void
) => {
  return onSnapshot(productosRef, (snapshot) => {
    const productos = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Producto, "id">),
    }));
    callback(productos);
  });
};