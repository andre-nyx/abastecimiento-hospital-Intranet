import type { LineaProducto } from "./LineaProducto";

export interface Devolucion {
    id: string;
    personaRecibe: string;
    servicioDevolucion: string;
    personaDevuelve: string;
    lineas: LineaProducto[];
    fechaHora: string;
}