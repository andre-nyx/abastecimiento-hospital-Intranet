import type { Producto } from "../types/Producto";
import { Link } from "react-router-dom";

interface Props {
  productos: Producto[];
  eliminarProducto: (id: string) => void;
}

function ProductoList({
  productos,
  eliminarProducto,
}: Props) {
  return (
    <table>
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Código</th>
          <th>Cantidad</th>
          <th>Categoría</th>
          <th>Acciones</th>
        </tr>
      </thead>

      <tbody>
        {productos.map((producto) => (
          <tr key={producto.id}>
            <td>{producto.nombre}</td>
            <td>{producto.codigo}</td>
            <td>{producto.cantidad}</td>
            <td>{producto.categoria}</td>

            <td>
              <Link
                to={`/productos/${producto.id}`}
              >
                Ver
              </Link>

              <button
                onClick={() =>
                  eliminarProducto(producto.id)
                }
              >
                Eliminar
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ProductoList;