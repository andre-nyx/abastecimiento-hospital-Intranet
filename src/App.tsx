import { useState, useEffect, useRef } from "react";
import "./App.css";

// ── Interfaces ────────────────────────────────────────────────────────────────

interface UsuarioSesion {
  correo: string;
}

interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
}

interface Entrega {
  id: string;
  personaEntrega: string;
  servicioEntrega: string;
  personaRecibe: string;
  productos: string;
  fechaHora: string;
}

interface Devolucion {
  id: string;
  personaRecibe: string;
  servicioDevolucion: string;
  personaDevuelve: string;
  productos: string;
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
  const [menuAbierto, setMenuAbierto] = useState<"productos" | "entregas" | "devoluciones" | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // Cierra el menú al hacer clic fuera del nav
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

  // Formulario producto
  const productoVacio = { nombre: "", descripcion: "", cantidad: 0, unidad: "" };
  const [formProducto, setFormProducto] = useState(productoVacio);

  // Formulario entrega
  const entregaVacia = {
    personaEntrega: "",
    servicioEntrega: "",
    personaRecibe: "",
    productos: "",
    fechaHora: "",
  };
  const [formEntrega, setFormEntrega] = useState(entregaVacia);

  // Formulario devolución
  const devolucionVacia = {
    personaRecibe: "",
    servicioDevolucion: "",
    personaDevuelve: "",
    productos: "",
    fechaHora: "",
  };
  const [formDevolucion, setFormDevolucion] = useState(devolucionVacia);

  // ── Validaciones login ────────────────────────────────────────────────────

  const validarCorreo = (v: string) => v.endsWith("@redsalud.gov.cl");
  const validarPassword = (v: string) =>
    v.length >= 7 &&
    /[a-z]/.test(v) &&
    /[A-Z]/.test(v) &&
    /[0-9]/.test(v);

  const manejarLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs = { correo: "", password: "" };

    if (!correo.trim()) {
      errs.correo = "El correo es obligatorio.";
    } else if (!validarCorreo(correo)) {
      errs.correo = "El correo debe terminar en @redsalud.gov.cl";
    }

    if (!password.trim()) {
      errs.password = "La contraseña es obligatoria.";
    } else if (!validarPassword(password)) {
      errs.password =
        "Debe tener al menos 7 caracteres, una mayúscula, una minúscula y un número.";
    }

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
    if (!formProducto.nombre.trim() || !formProducto.unidad.trim()) {
      alert("Nombre y unidad son obligatorios.");
      return;
    }
    const nuevo: Producto = { id: Date.now().toString(), ...formProducto };
    const lista = [...productos, nuevo];
    setProductos(lista);
    escribirLS("productosBodegaHRC", lista);
    setFormProducto(productoVacio);
    setModalActivo(null);
    setVistaActual("productos");
  };

  const eliminarProducto = (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    const lista = productos.filter((p) => p.id !== id);
    setProductos(lista);
    escribirLS("productosBodegaHRC", lista);
  };

  // ── CRUD Entregas ─────────────────────────────────────────────────────────

  const guardarEntrega = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { personaEntrega, servicioEntrega, personaRecibe, productos: prod, fechaHora } =
      formEntrega;
    if (!personaEntrega.trim() || !servicioEntrega.trim() || !personaRecibe.trim() || !prod.trim() || !fechaHora.trim()) {
      alert("Debes completar todos los campos de la entrega.");
      return;
    }
    const nueva: Entrega = { id: Date.now().toString(), ...formEntrega };
    const lista = [...entregas, nueva];
    setEntregas(lista);
    escribirLS("entregasBodegaHRC", lista);
    setFormEntrega(entregaVacia);
    setModalActivo(null);
    setVistaActual("entregas");
  };

  const eliminarEntrega = (id: string) => {
    if (!confirm("¿Eliminar esta entrega?")) return;
    const lista = entregas.filter((e) => e.id !== id);
    setEntregas(lista);
    escribirLS("entregasBodegaHRC", lista);
  };

  // ── CRUD Devoluciones ─────────────────────────────────────────────────────

  const guardarDevolucion = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { personaRecibe, servicioDevolucion, personaDevuelve, productos: prod, fechaHora } =
      formDevolucion;
    if (!personaRecibe.trim() || !servicioDevolucion.trim() || !personaDevuelve.trim() || !prod.trim() || !fechaHora.trim()) {
      alert("Debes completar todos los campos de la devolución.");
      return;
    }
    const nueva: Devolucion = { id: Date.now().toString(), ...formDevolucion };
    const lista = [...devoluciones, nueva];
    setDevoluciones(lista);
    escribirLS("devolucionesBodegaHRC", lista);
    setFormDevolucion(devolucionVacia);
    setModalActivo(null);
    setVistaActual("devoluciones");
  };

  const eliminarDevolucion = (id: string) => {
    if (!confirm("¿Eliminar esta devolución?")) return;
    const lista = devoluciones.filter((d) => d.id !== id);
    setDevoluciones(lista);
    escribirLS("devolucionesBodegaHRC", lista);
  };

  // ── Utilidad: formato fecha ───────────────────────────────────────────────

  const formatFecha = (iso: string) => {
    if (!iso) return "-";
    const d = new Date(iso);
    return d.toLocaleString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
              {errores.correo && <span className="error-texto">{errores.correo}</span>}
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

          {/* ── Vista: Productos ─────────────────────────────────────────── */}
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

              {productos.length === 0 ? (
                <div className="estado-vacio">
                  <p>No hay productos registrados.</p>
                  <p>Usa el botón de arriba para agregar el primero.</p>
                </div>
              ) : (
                <div className="tabla-contenedor">
                  <table>
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Cantidad</th>
                        <th>Unidad</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productos.map((p) => (
                        <tr key={p.id}>
                          <td>{p.nombre}</td>
                          <td>{p.descripcion || "-"}</td>
                          <td>{p.cantidad}</td>
                          <td>{p.unidad}</td>
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

          {/* ── Vista: Entregas ──────────────────────────────────────────── */}
          {vistaActual === "entregas" && (
            <section className="modulo-listado">
              <div className="modulo-encabezado">
                <h2>Entregas registradas</h2>
                <button
                  type="button"
                  className="btn-nuevo"
                  onClick={() => setModalActivo("entrega")}
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
                        <th>Productos</th>
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
                          <td>{en.productos}</td>
                          <td>{formatFecha(en.fechaHora)}</td>
                          <td>
                            <button
                              type="button"
                              className="btn-eliminar"
                              onClick={() => eliminarEntrega(en.id)}
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

          {/* ── Vista: Devoluciones ──────────────────────────────────────── */}
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
                        <th>Productos</th>
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
                          <td>{dev.productos}</td>
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

        {/* ── Modal: Agregar producto ───────────────────────────────────────── */}
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
                      setFormProducto({ ...formProducto, descripcion: e.target.value })
                    }
                  />
                </div>

                <div className="grupo-formulario grupo-doble">
                  <div>
                    <label>Cantidad *</label>
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
                  <div>
                    <label>Unidad *</label>
                    <input
                      type="text"
                      value={formProducto.unidad}
                      placeholder="Ej: Caja, Unidad, Kg"
                      onChange={(e) =>
                        setFormProducto({ ...formProducto, unidad: e.target.value })
                      }
                    />
                  </div>
                </div>

                <button type="submit" className="btn-guardar-modal">
                  Guardar producto
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal: Crear entrega ──────────────────────────────────────────── */}
        {modalActivo === "entrega" && (
          <div className="modal-fondo" onClick={() => setModalActivo(null)}>
            <div className="modal-bodega" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="cerrar-modal-bodega"
                onClick={() => setModalActivo(null)}
              >
                ×
              </button>

              <h2>Crear entrega</h2>

              <form onSubmit={guardarEntrega} className="form-modal-bodega">
                <div className="grupo-formulario">
                  <label>Persona que entrega *</label>
                  <input
                    type="text"
                    value={formEntrega.personaEntrega}
                    placeholder="Nombre completo"
                    onChange={(e) =>
                      setFormEntrega({ ...formEntrega, personaEntrega: e.target.value })
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
                      setFormEntrega({ ...formEntrega, servicioEntrega: e.target.value })
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
                      setFormEntrega({ ...formEntrega, personaRecibe: e.target.value })
                    }
                  />
                </div>

                <div className="grupo-formulario">
                  <label>Productos *</label>
                  <textarea
                    value={formEntrega.productos}
                    placeholder="Lista de productos entregados"
                    onChange={(e) =>
                      setFormEntrega({ ...formEntrega, productos: e.target.value })
                    }
                  />
                </div>

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
                  Guardar entrega
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal: Crear devolución ───────────────────────────────────────── */}
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

                <div className="grupo-formulario">
                  <label>Productos *</label>
                  <textarea
                    value={formDevolucion.productos}
                    placeholder="Lista de productos devueltos"
                    onChange={(e) =>
                      setFormDevolucion({
                        ...formDevolucion,
                        productos: e.target.value,
                      })
                    }
                  />
                </div>

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