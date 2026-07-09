import { useState, useEffect, useRef } from "react";
import "./App.css";

// ── Interfaces ────────────────────────────────────────────────────────────────

interface UsuarioSesion {
  correo: string;
}

interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  cantidad: number;
}

interface LineaProducto {
  productoId: string;
  cantidad: number;
}

interface Entrega {
  id: string;
  personaEntrega: string;
  servicioEntrega: string;
  personaRecibe: string;
  lineas: LineaProducto[];
  fechaHora: string;
}

interface Devolucion {
  id: string;
  personaRecibe: string;
  servicioDevolucion: string;
  personaDevuelve: string;
  lineas: LineaProducto[];
  fechaHora: string;
}

type ModalActivo = "entrega" | "devolucion" | "producto" | null;
type VistaActual = "productos" | "entregas" | "devoluciones";

// ── Helpers ───────────────────────────────────────────────────────────────────

function leerLS<T>(clave: string, defecto: T): T {
  try {
    const raw = localStorage.getItem(clave);
    return raw ? (JSON.parse(raw) as T) : defecto;
  } catch {
    return defecto;
  }
}

function escribirLS<T>(clave: string, valor: T): void {
  localStorage.setItem(clave, JSON.stringify(valor));
}

// ── Componente principal ──────────────────────────────────────────────────────

function App() {
  // Auth
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [errores, setErrores] = useState({ correo: "", password: "" });
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(() =>
    leerLS<UsuarioSesion | null>("usuarioSesion", null)
  );

  // Navegación
  const [modalActivo, setModalActivo] = useState<ModalActivo>(null);
  const [vistaActual, setVistaActual] = useState<VistaActual>("productos");
  const [menuAbierto, setMenuAbierto] = useState<
    "productos" | "entregas" | "devoluciones" | null
  >(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMenuAbierto(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Datos persistidos
  const [productos, setProductos] = useState<Producto[]>(() =>
    leerLS<Producto[]>("productosBodegaHRC", [])
  );
  const [entregas, setEntregas] = useState<Entrega[]>(() =>
    leerLS<Entrega[]>("entregasBodegaHRC", [])
  );
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>(() =>
    leerLS<Devolucion[]>("devolucionesBodegaHRC", [])
  );

  // ── Formulario producto ───────────────────────────────────────────────────

  const productoVacio = { codigo: "", nombre: "", descripcion: "", categoria: "", cantidad: 0 };

  // ── Filtros de productos ──────────────────────────────────────────────────
  const [filtroBusqueda, setFiltroBusqueda] = useState("");
  const [filtroCampo, setFiltroCampo] = useState<"todos" | "nombre" | "codigo" | "descripcion" | "categoria">("todos");

  const productosFiltrados = productos.filter((p) => {
    const q = filtroBusqueda.trim().toLowerCase();
    if (!q) return true;
    if (filtroCampo === "nombre")      return p.nombre.toLowerCase().includes(q);
    if (filtroCampo === "codigo")      return p.codigo.toLowerCase().includes(q);
    if (filtroCampo === "descripcion") return p.descripcion.toLowerCase().includes(q);
    if (filtroCampo === "categoria")   return p.categoria.toLowerCase().includes(q);
    // "todos"
    return (
      p.nombre.toLowerCase().includes(q) ||
      p.codigo.toLowerCase().includes(q) ||
      p.descripcion.toLowerCase().includes(q) ||
      p.categoria.toLowerCase().includes(q)
    );
  });
  const [formProducto, setFormProducto] = useState(productoVacio);

  // ── Formulario entrega ────────────────────────────────────────────────────

  const entregaVacia = {
    personaEntrega: "",
    servicioEntrega: "",
    personaRecibe: "",
    fechaHora: "",
  };
  const [formEntrega, setFormEntrega] = useState(entregaVacia);
  const [lineasEntrega, setLineasEntrega] = useState<LineaProducto[]>([
    { productoId: "", cantidad: 1 },
  ]);

  // ID de la entrega que se está editando (null = modo creación)
  const [entregaEditandoId, setEntregaEditandoId] = useState<string | null>(null);
  // Líneas originales de la entrega antes de editar (para calcular diferencia de stock)
  const [lineasEntregaOriginal, setLineasEntregaOriginal] = useState<LineaProducto[]>([]);

  // ── Formulario devolución ─────────────────────────────────────────────────

  const devolucionVacia = {
    personaRecibe: "",
    servicioDevolucion: "",
    personaDevuelve: "",
    fechaHora: "",
  };
  const [formDevolucion, setFormDevolucion] = useState(devolucionVacia);
  const [lineasDevolucion, setLineasDevolucion] = useState<LineaProducto[]>([
    { productoId: "", cantidad: 1 },
  ]);

  // ── Helpers de líneas ─────────────────────────────────────────────────────

  const agregarLinea = (
    setter: React.Dispatch<React.SetStateAction<LineaProducto[]>>
  ) => setter((prev) => [...prev, { productoId: "", cantidad: 1 }]);

  const eliminarLinea = (
    idx: number,
    setter: React.Dispatch<React.SetStateAction<LineaProducto[]>>
  ) => setter((prev) => prev.filter((_, i) => i !== idx));

  const actualizarLinea = (
    idx: number,
    campo: keyof LineaProducto,
    valor: string | number,
    setter: React.Dispatch<React.SetStateAction<LineaProducto[]>>
  ) =>
    setter((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, [campo]: valor } : l))
    );

  // ── Validaciones login ────────────────────────────────────────────────────

  const validarCorreo = (v: string) => v.endsWith("@redsalud.gov.cl");
  const validarPassword = (v: string) =>
    v.length >= 7 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v);

  const manejarLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = { correo: "", password: "" };
    if (!correo.trim()) errs.correo = "El correo es obligatorio.";
    else if (!validarCorreo(correo))
      errs.correo = "El correo debe terminar en @redsalud.gov.cl";
    if (!password.trim()) errs.password = "La contraseña es obligatoria.";
    else if (!validarPassword(password))
      errs.password =
        "Debe tener al menos 7 caracteres, una mayúscula, una minúscula y un número.";
    setErrores(errs);
    if (!errs.correo && !errs.password) {
      const u = { correo };
      escribirLS("usuarioSesion", u);
      setUsuario(u);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("usuarioSesion");
    setUsuario(null);
    setCorreo("");
    setPassword("");
  };

  // ── CRUD Productos ────────────────────────────────────────────────────────

  const guardarProducto = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formProducto.nombre.trim()) {
      alert("El nombre es obligatorio.");
      return;
    }
    const nuevo: Producto = { id: Date.now().toString(), ...formProducto };
    const lista = [...productos, nuevo];
    setProductos(lista);
    escribirLS("productosBodegaHRC", lista);
    setFormProducto(productoVacio);
    setModalActivo(null);
    setVistaActual("productos");
    setFiltroBusqueda("");
    setFiltroCampo("todos");
  };

  const eliminarProducto = (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    const lista = productos.filter((p) => p.id !== id);
    setProductos(lista);
    escribirLS("productosBodegaHRC", lista);
  };

  // ── CRUD Entregas ─────────────────────────────────────────────────────────

  /** Abre el modal de entrega en modo edición, pre-cargando los datos existentes */
  const abrirEditarEntrega = (entrega: Entrega) => {
    setEntregaEditandoId(entrega.id);
    setLineasEntregaOriginal(entrega.lineas);
    setFormEntrega({
      personaEntrega: entrega.personaEntrega,
      servicioEntrega: entrega.servicioEntrega,
      personaRecibe: entrega.personaRecibe,
      fechaHora: entrega.fechaHora,
    });
    setLineasEntrega(entrega.lineas.map((l) => ({ ...l })));
    setModalActivo("entrega");
  };

  const cerrarModalEntrega = () => {
    setModalActivo(null);
    setEntregaEditandoId(null);
    setLineasEntregaOriginal([]);
    setFormEntrega(entregaVacia);
    setLineasEntrega([{ productoId: "", cantidad: 1 }]);
  };

  const guardarEntrega = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { personaEntrega, servicioEntrega, personaRecibe, fechaHora } =
      formEntrega;

    if (
      !personaEntrega.trim() ||
      !servicioEntrega.trim() ||
      !personaRecibe.trim() ||
      !fechaHora.trim()
    ) {
      alert("Completa todos los campos de la entrega.");
      return;
    }

    const lineasValidas = lineasEntrega.filter((l) => l.productoId !== "");
    if (lineasValidas.length === 0) {
      alert("Debes seleccionar al menos un producto.");
      return;
    }
    for (const l of lineasValidas) {
      if (l.cantidad <= 0) {
        alert("La cantidad de cada producto debe ser mayor a 0.");
        return;
      }
    }

    if (entregaEditandoId) {
      // ── Modo edición ──────────────────────────────────────────────────────
      // Calcular el stock disponible considerando que las líneas originales
      // ya fueron descontadas: primero revertimos el original, luego
      // comprobamos si hay stock suficiente para las nuevas líneas.

      // Stock virtual = stock actual + lo que se había descontado antes
      const stockVirtual: Record<string, number> = {};
      productos.forEach((p) => (stockVirtual[p.id] = p.cantidad));
      lineasEntregaOriginal.forEach((l) => {
        if (stockVirtual[l.productoId] !== undefined) {
          stockVirtual[l.productoId] += l.cantidad;
        }
      });

      // Validar que el nuevo pedido cabe en el stock virtual
      for (const l of lineasValidas) {
        const disponible = stockVirtual[l.productoId] ?? 0;
        if (l.cantidad > disponible) {
          const prod = productos.find((p) => p.id === l.productoId);
          alert(
            `Stock insuficiente para "${prod?.nombre ?? l.productoId}". Disponible (considerando la entrega anterior): ${disponible}.`
          );
          return;
        }
      }

      // Aplicar diferencia de stock: revertir originales y descontar nuevas
      const productosActualizados = productos.map((p) => {
        const cantOriginal =
          lineasEntregaOriginal.find((l) => l.productoId === p.id)?.cantidad ?? 0;
        const cantNueva =
          lineasValidas.find((l) => l.productoId === p.id)?.cantidad ?? 0;
        return { ...p, cantidad: p.cantidad + cantOriginal - cantNueva };
      });
      setProductos(productosActualizados);
      escribirLS("productosBodegaHRC", productosActualizados);

      const lista = entregas.map((en) =>
        en.id === entregaEditandoId
          ? { ...en, ...formEntrega, lineas: lineasValidas }
          : en
      );
      setEntregas(lista);
      escribirLS("entregasBodegaHRC", lista);
    } else {
      // ── Modo creación ─────────────────────────────────────────────────────
      for (const l of lineasValidas) {
        const prod = productos.find((p) => p.id === l.productoId)!;
        if (l.cantidad > prod.cantidad) {
          alert(
            `Stock insuficiente para "${prod.nombre}". Disponible: ${prod.cantidad}.`
          );
          return;
        }
      }

      const productosActualizados = productos.map((p) => {
        const linea = lineasValidas.find((l) => l.productoId === p.id);
        return linea ? { ...p, cantidad: p.cantidad - linea.cantidad } : p;
      });
      setProductos(productosActualizados);
      escribirLS("productosBodegaHRC", productosActualizados);

      const nueva: Entrega = {
        id: Date.now().toString(),
        ...formEntrega,
        lineas: lineasValidas,
      };
      const lista = [...entregas, nueva];
      setEntregas(lista);
      escribirLS("entregasBodegaHRC", lista);
    }

    cerrarModalEntrega();
    setVistaActual("entregas");
  };

  // ── CRUD Devoluciones ─────────────────────────────────────────────────────

  const guardarDevolucion = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { personaRecibe, servicioDevolucion, personaDevuelve, fechaHora } =
      formDevolucion;

    if (
      !personaRecibe.trim() ||
      !servicioDevolucion.trim() ||
      !personaDevuelve.trim() ||
      !fechaHora.trim()
    ) {
      alert("Completa todos los campos de la devolución.");
      return;
    }

    const lineasValidas = lineasDevolucion.filter((l) => l.productoId !== "");
    if (lineasValidas.length === 0) {
      alert("Debes seleccionar al menos un producto.");
      return;
    }
    for (const l of lineasValidas) {
      if (l.cantidad <= 0) {
        alert("La cantidad de cada producto debe ser mayor a 0.");
        return;
      }
    }

    const productosActualizados = productos.map((p) => {
      const linea = lineasValidas.find((l) => l.productoId === p.id);
      return linea ? { ...p, cantidad: p.cantidad + linea.cantidad } : p;
    });
    setProductos(productosActualizados);
    escribirLS("productosBodegaHRC", productosActualizados);

    const nueva: Devolucion = {
      id: Date.now().toString(),
      ...formDevolucion,
      lineas: lineasValidas,
    };
    const lista = [...devoluciones, nueva];
    setDevoluciones(lista);
    escribirLS("devolucionesBodegaHRC", lista);

    setFormDevolucion(devolucionVacia);
    setLineasDevolucion([{ productoId: "", cantidad: 1 }]);
    setModalActivo(null);
    setVistaActual("devoluciones");
  };

  const eliminarDevolucion = (id: string) => {
    if (!confirm("¿Eliminar esta devolución? El stock NO se revertirá.")) return;
    const lista = devoluciones.filter((d) => d.id !== id);
    setDevoluciones(lista);
    escribirLS("devolucionesBodegaHRC", lista);
  };

  // ── Utilidad: formato fecha ───────────────────────────────────────────────

  const formatFecha = (iso: string) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const lineasATexto = (lineas: LineaProducto[]) =>
    lineas
      .map((l) => {
        const p = productos.find((x) => x.id === l.productoId);
        return p ? `${p.nombre} × ${l.cantidad}` : "—";
      })
      .join(", ");

  // ── Componente: selector de líneas de producto ────────────────────────────

  const SelectorProductos = ({
    lineas,
    setLineas,
    modo,
    stockVirtualOverride,
  }: {
    lineas: LineaProducto[];
    setLineas: React.Dispatch<React.SetStateAction<LineaProducto[]>>;
    modo: "entrega" | "devolucion";
    /** Stock a mostrar en lugar del real (usado en modo edición para sumar lo ya descontado) */
    stockVirtualOverride?: Record<string, number>;
  }) => {
    const seleccionados = lineas.map((l) => l.productoId).filter(Boolean);

    return (
      <div className="selector-productos">
        <label className="selector-label">Productos *</label>

        {lineas.map((linea, idx) => {
          const prodActual = productos.find((p) => p.id === linea.productoId);

          // Stock a mostrar: si hay override (edición), usar ese; si no, el real
          const stockBase =
            stockVirtualOverride && linea.productoId
              ? (stockVirtualOverride[linea.productoId] ?? 0)
              : (prodActual?.cantidad ?? 0);

          const maxCantidad =
            modo === "entrega" && prodActual
              ? stockBase -
                lineas.reduce(
                  (acc, l, i) =>
                    i !== idx && l.productoId === linea.productoId
                      ? acc + l.cantidad
                      : acc,
                  0
                )
              : 9999;

          return (
            <div key={idx} className="linea-producto">
              <select
                value={linea.productoId}
                className="select-producto"
                onChange={(e) =>
                  actualizarLinea(idx, "productoId", e.target.value, setLineas)
                }
              >
                <option value="">— Seleccionar producto —</option>
                {productos.map((p) => {
                  const yaUsado =
                    seleccionados.includes(p.id) && linea.productoId !== p.id;
                  const stockMostrar =
                    stockVirtualOverride
                      ? (stockVirtualOverride[p.id] ?? p.cantidad)
                      : p.cantidad;
                  return (
                    <option key={p.id} value={p.id} disabled={yaUsado}>
                      {p.nombre}
                      {modo === "entrega"
                        ? ` (stock: ${stockMostrar})`
                        : ``}
                    </option>
                  );
                })}
              </select>

              <input
                type="number"
                min={1}
                max={modo === "entrega" ? maxCantidad : undefined}
                value={linea.cantidad}
                className="input-cantidad-linea"
                disabled={!linea.productoId}
                onChange={(e) =>
                  actualizarLinea(
                    idx,
                    "cantidad",
                    Math.max(1, Number(e.target.value)),
                    setLineas
                  )
                }
              />

              {prodActual && modo === "entrega" && (
                <span className="etiqueta-unidad">
                  <span
                    className={
                      linea.cantidad > maxCantidad
                        ? "stock-insuficiente"
                        : "stock-ok"
                    }
                  >
                    disp: {maxCantidad}
                  </span>
                </span>
              )}

              {lineas.length > 1 && (
                <button
                  type="button"
                  className="btn-quitar-linea"
                  onClick={() => eliminarLinea(idx, setLineas)}
                  title="Quitar línea"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}

        {productos.length > lineas.filter((l) => l.productoId).length && (
          <button
            type="button"
            className="btn-agregar-linea"
            onClick={() => agregarLinea(setLineas)}
          >
            + Agregar otro producto
          </button>
        )}

        {productos.length === 0 && (
          <p className="aviso-sin-productos">
            No hay productos en bodega. Agrégalos primero desde el menú
            Productos.
          </p>
        )}
      </div>
    );
  };

  // Stock virtual para el modal de edición: stock actual + lo que la entrega
  // original había descontado (para que el usuario vea el stock "disponible real")
  const stockVirtualEdicion: Record<string, number> | undefined =
    entregaEditandoId
      ? (() => {
          const sv: Record<string, number> = {};
          productos.forEach((p) => (sv[p.id] = p.cantidad));
          lineasEntregaOriginal.forEach((l) => {
            if (sv[l.productoId] !== undefined) sv[l.productoId] += l.cantidad;
          });
          return sv;
        })()
      : undefined;

  // ── Vista: Login ──────────────────────────────────────────────────────────

  if (!usuario) {
    return (
      <main className="login-container">
        <section className="login-card">
          <h1>Intranet RedSalud</h1>
          <p>Ingrese sus credenciales para continuar</p>
          <form onSubmit={manejarLogin} className="login-form">
            <div className="form-grupo">
              <label htmlFor="correo">Correo institucional</label>
              <input
                type="email"
                id="correo"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="usuario@redsalud.gov.cl"
                className={errores.correo ? "input-error" : ""}
              />
              {errores.correo && (
                <span className="error-texto">{errores.correo}</span>
              )}
            </div>
            <div className="form-grupo">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese su contraseña"
                className={errores.password ? "input-error" : ""}
              />
              {errores.password && (
                <span className="error-texto">{errores.password}</span>
              )}
            </div>
            <button type="submit" className="btn-login">
              Iniciar sesión
            </button>
          </form>
        </section>
      </main>
    );
  }

  // ── Vista: Sistema autenticado ────────────────────────────────────────────

  return (
    <div className="sistema-bodega">
      {/* Sidebar */}
      <aside className="sidebar-bodega">
        <div className="logo-bodega">
          <img src="/hospitalcopiapo_logo.png" alt="Logo Hospital Copiapó" />
        </div>
        <div className="sidebar-info">
          <h2>HRC</h2>
          <p>Unidad de Abastecimiento</p>
        </div>
      </aside>

      {/* Panel principal */}
      <section className="panel-bodega">
        {/* Header / Nav */}
        <header className="header-bodega">
          <div className="titulo-bodega">
            <h1>Sistema de Bodega HRC</h1>
            <p>Gestión interna de productos, entregas y devoluciones</p>
          </div>

          <nav className="nav-bodega" ref={navRef}>
            {/* Productos */}
            <div className="nav-dropdown">
              <button
                type="button"
                className={`nav-btn${menuAbierto === "productos" ? " nav-btn--activo" : ""}`}
                onClick={() =>
                  setMenuAbierto(menuAbierto === "productos" ? null : "productos")
                }
              >
                Productos ▾
              </button>
              {menuAbierto === "productos" && (
                <div className="dropdown-menu dropdown-menu--visible">
                  <button
                    type="button"
                    onClick={() => {
                      setModalActivo("producto");
                      setMenuAbierto(null);
                    }}
                  >
                    Agregar producto
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVistaActual("productos");
                      setMenuAbierto(null);
                    }}
                  >
                    Ver todos los productos
                  </button>
                </div>
              )}
            </div>

            {/* Entregas */}
            <div className="nav-dropdown">
              <button
                type="button"
                className={`nav-btn${menuAbierto === "entregas" ? " nav-btn--activo" : ""}`}
                onClick={() =>
                  setMenuAbierto(menuAbierto === "entregas" ? null : "entregas")
                }
              >
                Entregas ▾
              </button>
              {menuAbierto === "entregas" && (
                <div className="dropdown-menu dropdown-menu--visible">
                  <button
                    type="button"
                    onClick={() => {
                      setModalActivo("entrega");
                      setMenuAbierto(null);
                    }}
                  >
                    Crear entrega
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVistaActual("entregas");
                      setMenuAbierto(null);
                    }}
                  >
                    Ver todas las entregas
                  </button>
                </div>
              )}
            </div>

            {/* Devoluciones */}
            <div className="nav-dropdown">
              <button
                type="button"
                className={`nav-btn${menuAbierto === "devoluciones" ? " nav-btn--activo" : ""}`}
                onClick={() =>
                  setMenuAbierto(
                    menuAbierto === "devoluciones" ? null : "devoluciones"
                  )
                }
              >
                Devoluciones ▾
              </button>
              {menuAbierto === "devoluciones" && (
                <div className="dropdown-menu dropdown-menu--visible">
                  <button
                    type="button"
                    onClick={() => {
                      setModalActivo("devolucion");
                      setMenuAbierto(null);
                    }}
                  >
                    Crear devolución
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVistaActual("devoluciones");
                      setMenuAbierto(null);
                    }}
                  >
                    Ver todas las devoluciones
                  </button>
                </div>
              )}
            </div>
          </nav>

          <div className="usuario-bodega">
            <span>{usuario.correo}</span>
            <button type="button" onClick={cerrarSesion}>
              Cerrar sesión
            </button>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="contenido-bodega">

          {/* ── Vista: Productos ─────────────────────────────────────── */}
          {vistaActual === "productos" && (
            <section className="modulo-listado">
              <div className="modulo-encabezado">
                <h2>Productos en bodega</h2>
                <button
                  type="button"
                  className="btn-nuevo"
                  onClick={() => setModalActivo("producto")}
                >
                  + Agregar producto
                </button>
              </div>

              {/* ── Barra de filtros ── */}
              <div className="barra-filtros">
                <div className="filtro-campo-wrapper">
                  <select
                    className="select-filtro-campo"
                    value={filtroCampo}
                    onChange={(e) =>
                      setFiltroCampo(
                        e.target.value as "todos" | "nombre" | "codigo" | "descripcion" | "categoria"
                      )
                    }
                  >
                    <option value="todos">Todos los campos</option>
                    <option value="nombre">Nombre</option>
                    <option value="codigo">Código</option>
                    <option value="descripcion">Descripción</option>
                    <option value="categoria">Categoría</option>
                  </select>
                </div>
                <div className="filtro-input-wrapper">
                  <input
                    type="text"
                    className="input-filtro"
                    placeholder={
                      filtroCampo === "todos"
                        ? "Buscar en todos los campos..."
                        : `Buscar por ${filtroCampo}...`
                    }
                    value={filtroBusqueda}
                    onChange={(e) => setFiltroBusqueda(e.target.value)}
                  />
                  {filtroBusqueda && (
                    <button
                      type="button"
                      className="btn-limpiar-filtro"
                      onClick={() => setFiltroBusqueda("")}
                      title="Limpiar búsqueda"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {filtroBusqueda && (
                  <span className="filtro-resultado">
                    {productosFiltrados.length} resultado{productosFiltrados.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {productos.length === 0 ? (
                <div className="estado-vacio">
                  <p>No hay productos registrados.</p>
                  <p>Usa el botón de arriba para agregar el primero.</p>
                </div>
              ) : productosFiltrados.length === 0 ? (
                <div className="estado-vacio">
                  <p>No se encontraron productos con esa búsqueda.</p>
                  <p>Intenta con otros términos o cambia el campo de búsqueda.</p>
                </div>
              ) : (
                <div className="tabla-contenedor">
                  <table>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Categoría</th>
                        <th>Stock actual</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosFiltrados.map((p) => (
                        <tr key={p.id}>
                          <td>{p.codigo || "—"}</td>
                          <td>{p.nombre}</td>
                          <td>{p.descripcion || "—"}</td>
                          <td>{p.categoria || "—"}</td>
                          <td>
                            <span
                              className={
                                p.cantidad === 0
                                  ? "badge-stock badge-stock--vacio"
                                  : p.cantidad <= 5
                                  ? "badge-stock badge-stock--bajo"
                                  : "badge-stock badge-stock--ok"
                              }
                            >
                              {p.cantidad}
                            </span>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn-eliminar"
                              onClick={() => eliminarProducto(p.id)}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* ── Vista: Entregas ──────────────────────────────────────── */}
          {vistaActual === "entregas" && (
            <section className="modulo-listado">
              <div className="modulo-encabezado">
                <h2>Entregas registradas</h2>
                <button
                  type="button"
                  className="btn-nuevo"
                  onClick={() => {
                    setEntregaEditandoId(null);
                    setLineasEntregaOriginal([]);
                    setFormEntrega(entregaVacia);
                    setLineasEntrega([{ productoId: "", cantidad: 1 }]);
                    setModalActivo("entrega");
                  }}
                >
                  + Nueva entrega
                </button>
              </div>

              {entregas.length === 0 ? (
                <div className="estado-vacio">
                  <p>No hay entregas registradas.</p>
                </div>
              ) : (
                <div className="tabla-contenedor">
                  <table>
                    <thead>
                      <tr>
                        <th>Quien entrega</th>
                        <th>Servicio destino</th>
                        <th>Quien recibe</th>
                        <th>Productos entregados</th>
                        <th>Fecha y hora</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entregas.map((en) => (
                        <tr key={en.id}>
                          <td>{en.personaEntrega}</td>
                          <td>{en.servicioEntrega}</td>
                          <td>{en.personaRecibe}</td>
                          <td className="td-productos">
                            {lineasATexto(en.lineas)}
                          </td>
                          <td>{formatFecha(en.fechaHora)}</td>
                          <td>
                            <button
                              type="button"
                              className="btn-editar"
                              onClick={() => abrirEditarEntrega(en)}
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* ── Vista: Devoluciones ──────────────────────────────────── */}
          {vistaActual === "devoluciones" && (
            <section className="modulo-listado">
              <div className="modulo-encabezado">
                <h2>Devoluciones registradas</h2>
                <button
                  type="button"
                  className="btn-nuevo"
                  onClick={() => setModalActivo("devolucion")}
                >
                  + Nueva devolución
                </button>
              </div>

              {devoluciones.length === 0 ? (
                <div className="estado-vacio">
                  <p>No hay devoluciones registradas.</p>
                </div>
              ) : (
                <div className="tabla-contenedor">
                  <table>
                    <thead>
                      <tr>
                        <th>Quien recibe</th>
                        <th>Servicio origen</th>
                        <th>Quien devuelve</th>
                        <th>Productos devueltos</th>
                        <th>Fecha y hora</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devoluciones.map((dev) => (
                        <tr key={dev.id}>
                          <td>{dev.personaRecibe}</td>
                          <td>{dev.servicioDevolucion}</td>
                          <td>{dev.personaDevuelve}</td>
                          <td className="td-productos">
                            {lineasATexto(dev.lineas)}
                          </td>
                          <td>{formatFecha(dev.fechaHora)}</td>
                          <td>
                            <button
                              type="button"
                              className="btn-eliminar"
                              onClick={() => eliminarDevolucion(dev.id)}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </main>

        {/* ── Modal: Agregar producto ───────────────────────────────────── */}
        {modalActivo === "producto" && (
          <div className="modal-fondo" onClick={() => setModalActivo(null)}>
            <div className="modal-bodega" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="cerrar-modal-bodega"
                onClick={() => setModalActivo(null)}
              >
                ×
              </button>
              <h2>Agregar producto</h2>
              <form onSubmit={guardarProducto} className="form-modal-bodega">
                <div className="grupo-formulario grupo-doble">
                  <div>
                    <label>Código</label>
                    <input
                      type="text"
                      value={formProducto.codigo}
                      placeholder="Ej: MED-001"
                      onChange={(e) =>
                        setFormProducto({ ...formProducto, codigo: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label>Categoría</label>
                    <input
                      type="text"
                      value={formProducto.categoria}
                      placeholder="Ej: Insumos, Medicamentos"
                      onChange={(e) =>
                        setFormProducto({ ...formProducto, categoria: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grupo-formulario">
                  <label>Nombre del producto *</label>
                  <input
                    type="text"
                    value={formProducto.nombre}
                    placeholder="Ej: Guantes de látex"
                    onChange={(e) =>
                      setFormProducto({ ...formProducto, nombre: e.target.value })
                    }
                  />
                </div>
                <div className="grupo-formulario">
                  <label>Descripción</label>
                  <textarea
                    value={formProducto.descripcion}
                    placeholder="Descripción opcional"
                    onChange={(e) =>
                      setFormProducto({
                        ...formProducto,
                        descripcion: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grupo-formulario">
                  <label>Cantidad inicial *</label>
                  <input
                    type="number"
                    min={0}
                    value={formProducto.cantidad}
                    onChange={(e) =>
                      setFormProducto({
                        ...formProducto,
                        cantidad: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <button type="submit" className="btn-guardar-modal">
                  Guardar producto
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal: Crear / Editar entrega ─────────────────────────────── */}
        {modalActivo === "entrega" && (
          <div className="modal-fondo" onClick={cerrarModalEntrega}>
            <div className="modal-bodega" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="cerrar-modal-bodega"
                onClick={cerrarModalEntrega}
              >
                ×
              </button>
              <h2>{entregaEditandoId ? "Editar entrega" : "Crear entrega"}</h2>
              <form onSubmit={guardarEntrega} className="form-modal-bodega">
                <div className="grupo-formulario">
                  <label>Persona que entrega *</label>
                  <input
                    type="text"
                    value={formEntrega.personaEntrega}
                    placeholder="Nombre completo"
                    onChange={(e) =>
                      setFormEntrega({
                        ...formEntrega,
                        personaEntrega: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grupo-formulario">
                  <label>Nombre del servicio al que se le entrega *</label>
                  <input
                    type="text"
                    value={formEntrega.servicioEntrega}
                    placeholder="Ej: Urgencias, Pabellón..."
                    onChange={(e) =>
                      setFormEntrega({
                        ...formEntrega,
                        servicioEntrega: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grupo-formulario">
                  <label>Persona que recibe *</label>
                  <input
                    type="text"
                    value={formEntrega.personaRecibe}
                    placeholder="Nombre completo"
                    onChange={(e) =>
                      setFormEntrega({
                        ...formEntrega,
                        personaRecibe: e.target.value,
                      })
                    }
                  />
                </div>

                <SelectorProductos
                  lineas={lineasEntrega}
                  setLineas={setLineasEntrega}
                  modo="entrega"
                  stockVirtualOverride={stockVirtualEdicion}
                />

                <div className="grupo-formulario">
                  <label>Fecha y hora *</label>
                  <input
                    type="datetime-local"
                    value={formEntrega.fechaHora}
                    onChange={(e) =>
                      setFormEntrega({ ...formEntrega, fechaHora: e.target.value })
                    }
                  />
                </div>
                <button type="submit" className="btn-guardar-modal">
                  {entregaEditandoId ? "Guardar cambios" : "Guardar entrega"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal: Crear devolución ───────────────────────────────────── */}
        {modalActivo === "devolucion" && (
          <div className="modal-fondo" onClick={() => setModalActivo(null)}>
            <div className="modal-bodega" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="cerrar-modal-bodega"
                onClick={() => setModalActivo(null)}
              >
                ×
              </button>
              <h2>Crear devolución</h2>
              <form onSubmit={guardarDevolucion} className="form-modal-bodega">
                <div className="grupo-formulario">
                  <label>Persona que recibe *</label>
                  <input
                    type="text"
                    value={formDevolucion.personaRecibe}
                    placeholder="Nombre completo"
                    onChange={(e) =>
                      setFormDevolucion({
                        ...formDevolucion,
                        personaRecibe: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grupo-formulario">
                  <label>Nombre del servicio que realiza la devolución *</label>
                  <input
                    type="text"
                    value={formDevolucion.servicioDevolucion}
                    placeholder="Ej: Urgencias, Pabellón..."
                    onChange={(e) =>
                      setFormDevolucion({
                        ...formDevolucion,
                        servicioDevolucion: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grupo-formulario">
                  <label>Persona que devuelve *</label>
                  <input
                    type="text"
                    value={formDevolucion.personaDevuelve}
                    placeholder="Nombre completo"
                    onChange={(e) =>
                      setFormDevolucion({
                        ...formDevolucion,
                        personaDevuelve: e.target.value,
                      })
                    }
                  />
                </div>

                <SelectorProductos
                  lineas={lineasDevolucion}
                  setLineas={setLineasDevolucion}
                  modo="devolucion"
                />

                <div className="grupo-formulario">
                  <label>Fecha y hora *</label>
                  <input
                    type="datetime-local"
                    value={formDevolucion.fechaHora}
                    onChange={(e) =>
                      setFormDevolucion({
                        ...formDevolucion,
                        fechaHora: e.target.value,
                      })
                    }
                  />
                </div>
                <button type="submit" className="btn-guardar-modal">
                  Guardar devolución
                </button>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default App;