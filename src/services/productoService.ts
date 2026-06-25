import type { Producto } from '../types/Producto';

const STRORAGE_KEY = "productos";

export const ObtenerProductos = (): Producto[] => {
    const productos = localStorage.getItem(STRORAGE_KEY);
    return productos ? JSON.parse(productos) : [];
};

export const guardarProductos = (
    productos: Producto[]
): void => {
    localStorage.setItem(STRORAGE_KEY, 
        JSON.stringify(productos));
}