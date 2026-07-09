import type { LineaProducto } from "./LineaProducto";

export interface Entrega {
    id: string;
    personaEntrega: string;
    servicioEntrega: string;
    personaRecibe: string;
    lineas: LineaProducto[];
    fechaHora: string;
}