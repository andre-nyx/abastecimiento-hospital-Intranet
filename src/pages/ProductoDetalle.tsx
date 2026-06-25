import { useParams } from "react-router-dom";

function ProductoDetalle() {
  const { id } = useParams();

  const productos = JSON.parse(
    localStorage.getItem(
      "productos"
    ) || "[]"
  );

  const producto = productos.find(
    (p: any) => p.id === id
  );

  if (!producto) {
    return (
      <h2>
        Producto no encontrado
      </h2>
    );
  }

  return (
    <div>
      <h1>
        {producto.nombre}
      </h1>

      <p>
        Código: {producto.codigo}
      </p>

      <p>
        Cantidad:
        {producto.cantidad}
      </p>

      <p>
        Descripción:
        {producto.descripcion}
      </p>

      <p>
        Categoría:
        {producto.categoria}
      </p>
    </div>
  );
}

export default ProductoDetalle;