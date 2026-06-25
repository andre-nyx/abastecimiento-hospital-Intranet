import { useState } from "react";
import type { Producto } from "../types/Producto";

interface ProductoFormProps {
  onGuardar: (producto: Producto) => void;
}

function ProductoForm({ onGuardar }: ProductoFormProps) {
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [cantidad, setCantidad] = useState(0);
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState("");

  const handleSubmit = (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (
      !nombre ||
      !codigo ||
      !descripcion ||
      !categoria
    ) {
      alert("Todos los campos son obligatorios");
      return;
    }

    const nuevoProducto: Producto = {
      id: crypto.randomUUID(),
      nombre,
      codigo,
      cantidad,
      descripcion,
      categoria,
    };

    onGuardar(nuevoProducto);

    setNombre("");
    setCodigo("");
    setCantidad(0);
    setDescripcion("");
    setCategoria("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Agregar Producto</h2>

      <input
        type="text"
        placeholder="Nombre"
        value={nombre}
        onChange={(e) =>
          setNombre(e.target.value)
        }
      />

      <input
        type="text"
        placeholder="Código"
        value={codigo}
        onChange={(e) =>
          setCodigo(e.target.value)
        }
      />

      <input
        type="number"
        placeholder="Cantidad"
        value={cantidad}
        onChange={(e) =>
          setCantidad(Number(e.target.value))
        }
      />

      <input
        type="text"
        placeholder="Descripción"
        value={descripcion}
        onChange={(e) =>
          setDescripcion(e.target.value)
        }
      />

      <input
        type="text"
        placeholder="Categoría"
        value={categoria}
        onChange={(e) =>
          setCategoria(e.target.value)
        }
      />

      <button type="submit">
        Guardar
      </button>
    </form>
  );
}

export default ProductoForm;