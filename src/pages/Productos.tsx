import { useEffect, useState } from "react";
import ProductoForm from "../components/ProductoForm";
import ProductoList from "../components/ProductoList";
import type { Producto } from "../types/Producto";

function Productos() {
  const [productos, setProductos] =
    useState<Producto[]>([]);

  const [busqueda, setBusqueda] =
    useState("");

  useEffect(() => {
    const datos = localStorage.getItem(
      "productos"
    );

    if (datos) {
      setProductos(JSON.parse(datos));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "productos",
      JSON.stringify(productos)
    );
  }, [productos]);

  const agregarProducto = (
    producto: Producto
  ) => {
    setProductos([
      ...productos,
      producto,
    ]);
  };

  const eliminarProducto = (
    id: string
  ) => {
    if (
      window.confirm(
        "¿Eliminar producto?"
      )
    ) {
      setProductos(
        productos.filter(
          (p) => p.id !== id
        )
      );
    }
  };

  const productosFiltrados =
    productos.filter(
      (p) =>
        p.nombre
          .toLowerCase()
          .includes(
            busqueda.toLowerCase()
          ) ||
        p.codigo
          .toLowerCase()
          .includes(
            busqueda.toLowerCase()
          )
    );

  return (
    <div>
      <h1>
        Gestión de Productos
      </h1>

      <ProductoForm
        onGuardar={agregarProducto}
      />

      <input
        type="text"
        placeholder="Buscar producto..."
        value={busqueda}
        onChange={(e) =>
          setBusqueda(
            e.target.value
          )
        }
      />

      <ProductoList
        productos={
          productosFiltrados
        }
        eliminarProducto={
          eliminarProducto
        }
      />
    </div>
  );
}

export default Productos;