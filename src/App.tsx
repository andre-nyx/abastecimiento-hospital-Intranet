import { useState } from "react";
import "./App.css";

interface UsuarioSesion {
  correo: string;
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

type ModalActivo = "entrega" | "devolucion" | null;
type VistaActual = "inicio" | "entregas" | "devoluciones";

function App() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [errores, setErrores] = useState({ correo: "", password: "" });

  const [usuario, setUsuario] = useState<UsuarioSesion | null>(() => {
    const sesionGuardada = localStorage.getItem("usuarioSesion");
    return sesionGuardada ? JSON.parse(sesionGuardada) : null;
  });

  const [modalActivo, setModalActivo] = useState<ModalActivo>(null);
  const [vistaActual, setVistaActual] = useState<VistaActual>("inicio");

  const [entregas, setEntregas] = useState<Entrega[]>(() => {
    const datosGuardados = localStorage.getItem("entregasBodegaHRC");
    return datosGuardados ? JSON.parse(datosGuardados) : [];
  });

  const [devoluciones, setDevoluciones] = useState<Devolucion[]>(() => {
    const datosGuardados = localStorage.getItem("devolucionesBodegaHRC");
    return datosGuardados ? JSON.parse(datosGuardados) : [];
  });

  const [formEntrega, setFormEntrega] = useState({
    personaEntrega: "",
    servicioEntrega: "",
    personaRecibe: "",
    productos: "",
    fechaHora: "",
  });

  const [formDevolucion, setFormDevolucion] = useState({
    personaRecibe: "",
    servicioDevolucion: "",
    personaDevuelve: "",
    productos: "",
    fechaHora: "",
  });

  const validarCorreo = (correo: string): boolean => {
    return correo.endsWith("@redsalud.gov.cl");
  };

  const validarPassword = (password: string): boolean => {
    const tieneMinimo7 = password.length >= 7;
    const tieneMinuscula = /[a-z]/.test(password);
    const tieneMayuscula = /[A-Z]/.test(password);
    const tieneNumero = /[0-9]/.test(password);
    return tieneMinimo7 && tieneMinuscula && tieneMayuscula && tieneNumero;
  };

  const manejarLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let nuevosErrores = { correo: "", password: "" };

    if (correo.trim() === "") {
      nuevosErrores.correo = "El correo es obligatorio.";
    } else if (!validarCorreo(correo)) {
      nuevosErrores.correo = "El correo debe terminar en @redsalud.gov.cl";
    }

    if (password.trim() === "") {
      nuevosErrores.password = "La contraseña es obligatoria.";
    } else if (!validarPassword(password)) {
      nuevosErrores.password =
        "La contraseña debe tener al menos 7 caracteres, una mayúscula, una minúscula y un número.";
    }

    setErrores(nuevosErrores);

    if (nuevosErrores.correo === "" && nuevosErrores.password === "") {
      const usuarioLogueado = { correo };
      localStorage.setItem("usuarioSesion", JSON.stringify(usuarioLogueado));
      setUsuario(usuarioLogueado);
    }
  };

  const guardarEntrega = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      formEntrega.personaEntrega.trim() === "" ||
      formEntrega.servicioEntrega.trim() === "" ||
      formEntrega.personaRecibe.trim() === "" ||
      formEntrega.productos.trim() === "" ||
      formEntrega.fechaHora.trim() === ""
    ) {
      alert("Debes completar todos los campos de la entrega.");
      return;
    }

    const nuevaEntrega: Entrega = { id: Date.now().toString(), ...formEntrega };
    const entregasActualizadas = [...entregas, nuevaEntrega];

    setEntregas(entregasActualizadas);
    localStorage.setItem("entregasBodegaHRC", JSON.stringify(entregasActualizadas));

    setFormEntrega({
      personaEntrega: "",
      servicioEntrega: "",
      personaRecibe: "",
      productos: "",
      fechaHora: "",
    });

    setModalActivo(null);
    setVistaActual("entregas");
  };

  const guardarDevolucion = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      formDevolucion.personaRecibe.trim() === "" ||
      formDevolucion.servicioDevolucion.trim() === "" ||
      formDevolucion.personaDevuelve.trim() === "" ||
      formDevolucion.productos.trim() === "" ||
      formDevolucion.fechaHora.trim() === ""
    ) {
      alert("Debes completar todos los campos de la devolución.");
      return;
    }

    const nuevaDevolucion: Devolucion = {
      id: Date.now().toString(),
      ...formDevolucion,
    };
    const devolucionesActualizadas = [...devoluciones, nuevaDevolucion];

    setDevoluciones(devolucionesActualizadas);
    localStorage.setItem(
      "devolucionesBodegaHRC",
      JSON.stringify(devolucionesActualizadas)
    );

    setFormDevolucion({
      personaRecibe: "",
      servicioDevolucion: "",
      personaDevuelve: "",
      productos: "",
      fechaHora: "",
    });

    setModalActivo(null);
    setVistaActual("devoluciones");
  };

  const cerrarSesion = () => {
    localStorage.removeItem("usuarioSesion");
    setUsuario(null);
    setCorreo("");
    setPassword("");
  };

  // ── Vista autenticada ──────────────────────────────────────────────────────
  if (usuario) {
    return (
      <div className="sistema-bodega">
        <aside className="sidebar-bodega">
          <div className="logo-bodega">
            <img src="/hospitalcopiapo_logo.png" alt="Logo Hospital Copiapó" />
          </div>
          <div className="sidebar-info">
            <h2>HRC</h2>
            <p>Unidad de Abastecimiento</p>
          </div>
        </aside>

        <section className="panel-bodega">
          <header className="header-bodega">
            <div className="titulo-bodega">
              <h1>Sistema de Bodega HRC</h1>
              <p>Gestión interna de productos, entregas y devoluciones</p>
            </div>

            <nav className="nav-bodega">
              <button
                type="button"
                className="nav-btn"
                onClick={() => setVistaActual("inicio")}
              >
                Productos
              </button>

              <div className="nav-dropdown">
                <button type="button" className="nav-btn">
                  Entregas
                </button>
                <div className="dropdown-menu">
                  <button type="button" onClick={() => setModalActivo("entrega")}>
                    Crear entrega
                  </button>
                  <button type="button" onClick={() => setVistaActual("entregas")}>
                    Ver todas las entregas
                  </button>
                </div>
              </div>

              <div className="nav-dropdown">
                <button type="button" className="nav-btn">
                  Devoluciones
                </button>
                <div className="dropdown-menu">
                  <button type="button" onClick={() => setModalActivo("devolucion")}>
                    Crear devolución
                  </button>
                  <button
                    type="button"
                    onClick={() => setVistaActual("devoluciones")}
                  >
                    Ver todas las devoluciones
                  </button>
                </div>
              </div>
            </nav>

            <div className="usuario-bodega">
              <span>{usuario.correo}</span>
              <button type="button" onClick={cerrarSesion}>
                Cerrar sesión
              </button>
            </div>
          </header>

          <main className="contenido-bodega">
            {vistaActual === "inicio" && (
              <section className="bienvenida-bodega">
                <h2>Panel principal</h2>
                <p>
                  Bienvenido al sistema interno de bodega. Desde aquí podrás
                  gestionar productos, registrar entregas y controlar
                  devoluciones de insumos.
                </p>
              </section>
            )}

            {vistaActual === "entregas" && (
              <section className="modulo-listado">
                <h2>Entregas registradas</h2>
                {entregas.length === 0 ? (
                  <p>No hay entregas registradas.</p>
                ) : (
                  <div className="tabla-contenedor">
                    <table>
                      <thead>
                        <tr>
                          <th>Entrega</th>
                          <th>Servicio</th>
                          <th>Recibe</th>
                          <th>Productos</th>
                          <th>Fecha y hora</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entregas.map((entrega) => (
                          <tr key={entrega.id}>
                            <td>{entrega.personaEntrega}</td>
                            <td>{entrega.servicioEntrega}</td>
                            <td>{entrega.personaRecibe}</td>
                            <td>{entrega.productos}</td>
                            <td>{entrega.fechaHora}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {vistaActual === "devoluciones" && (
              <section className="modulo-listado">
                <h2>Devoluciones registradas</h2>
                {devoluciones.length === 0 ? (
                  <p>No hay devoluciones registradas.</p>
                ) : (
                  <div className="tabla-contenedor">
                    <table>
                      <thead>
                        <tr>
                          <th>Recibe</th>
                          <th>Servicio</th>
                          <th>Devuelve</th>
                          <th>Productos</th>
                          <th>Fecha y hora</th>
                        </tr>
                      </thead>
                      <tbody>
                        {devoluciones.map((devolucion) => (
                          <tr key={devolucion.id}>
                            <td>{devolucion.personaRecibe}</td>
                            <td>{devolucion.servicioDevolucion}</td>
                            <td>{devolucion.personaDevuelve}</td>
                            <td>{devolucion.productos}</td>
                            <td>{devolucion.fechaHora}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </main>

          {/* ── Modal: Crear entrega ──────────────────────────────────────── */}
          {modalActivo === "entrega" && (
            <div className="modal-fondo">
              <div className="modal-bodega">
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
                    <label>Persona que entrega</label>
                    <input
                      type="text"
                      value={formEntrega.personaEntrega}
                      onChange={(e) =>
                        setFormEntrega({
                          ...formEntrega,
                          personaEntrega: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grupo-formulario">
                    <label>Nombre del servicio al que se le entrega</label>
                    <input
                      type="text"
                      value={formEntrega.servicioEntrega}
                      onChange={(e) =>
                        setFormEntrega({
                          ...formEntrega,
                          servicioEntrega: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grupo-formulario">
                    <label>Persona que recibe</label>
                    <input
                      type="text"
                      value={formEntrega.personaRecibe}
                      onChange={(e) =>
                        setFormEntrega({
                          ...formEntrega,
                          personaRecibe: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grupo-formulario">
                    <label>Productos</label>
                    <textarea
                      value={formEntrega.productos}
                      onChange={(e) =>
                        setFormEntrega({
                          ...formEntrega,
                          productos: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grupo-formulario">
                    <label>Fecha y hora</label>
                    <input
                      type="datetime-local"
                      value={formEntrega.fechaHora}
                      onChange={(e) =>
                        setFormEntrega({
                          ...formEntrega,
                          fechaHora: e.target.value,
                        })
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

          {/* ── Modal: Crear devolución ───────────────────────────────────── */}
          {modalActivo === "devolucion" && (
            <div className="modal-fondo">
              <div className="modal-bodega">
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
                    <label>Persona que recibe</label>
                    <input
                      type="text"
                      value={formDevolucion.personaRecibe}
                      onChange={(e) =>
                        setFormDevolucion({
                          ...formDevolucion,
                          personaRecibe: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grupo-formulario">
                    <label>Nombre del servicio que realiza la devolución</label>
                    <input
                      type="text"
                      value={formDevolucion.servicioDevolucion}
                      onChange={(e) =>
                        setFormDevolucion({
                          ...formDevolucion,
                          servicioDevolucion: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grupo-formulario">
                    <label>Persona que devuelve</label>
                    <input
                      type="text"
                      value={formDevolucion.personaDevuelve}
                      onChange={(e) =>
                        setFormDevolucion({
                          ...formDevolucion,
                          personaDevuelve: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grupo-formulario">
                    <label>Productos</label>
                    <textarea
                      value={formDevolucion.productos}
                      onChange={(e) =>
                        setFormDevolucion({
                          ...formDevolucion,
                          productos: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grupo-formulario">
                    <label>Fecha y hora</label>
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

  // ── Vista de login ─────────────────────────────────────────────────────────
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
            {errores.correo && <span>{errores.correo}</span>}
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
            {errores.password && <span>{errores.password}</span>}
          </div>

          <button type="submit" className="btn-login">
            Iniciar sesión
          </button>
        </form>
      </section>
    </main>
  );
}

export default App;