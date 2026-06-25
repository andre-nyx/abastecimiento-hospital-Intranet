import { useState } from "react";
import "./App.css";

interface UsuarioSesion {
  correo: string;
}

function App() {
  // LOGIN
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");

  const [errores, setErrores] = useState({
    correo: "",
    password: "",
  });

  const [usuario, setUsuario] = useState<UsuarioSesion | null>(() => {
    const sesionGuardada = localStorage.getItem("usuarioSesion");
    return sesionGuardada ? JSON.parse(sesionGuardada) : null;
  });

  // VALIDACIONES
  const validarCorreo = (correo: string) => {
    return correo.endsWith("@redsalud.gov.cl");
  };

  const validarPassword = (password: string) => {
    return (
      password.length >= 7 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password)
    );
  };

  // LOGIN
  const manejarLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const nuevosErrores = {
      correo: "",
      password: "",
    };

    if (!correo.trim()) {
      nuevosErrores.correo = "El correo es obligatorio.";
    } else if (!validarCorreo(correo)) {
      nuevosErrores.correo = "Debe terminar en @redsalud.gov.cl";
    }

    if (!password.trim()) {
      nuevosErrores.password = "La contraseña es obligatoria.";
    } else if (!validarPassword(password)) {
      nuevosErrores.password =
        "Mínimo 7 caracteres, mayúscula, minúscula y número.";
    }

    setErrores(nuevosErrores);

    if (!nuevosErrores.correo && !nuevosErrores.password) {
      const usuarioLogueado: UsuarioSesion = { correo };

      localStorage.setItem("usuarioSesion", JSON.stringify(usuarioLogueado));
      setUsuario(usuarioLogueado);
    }
  };

  // LOGOUT
  const cerrarSesion = () => {
    localStorage.removeItem("usuarioSesion");
    setUsuario(null);
    setCorreo("");
    setPassword("");
  };

  // ─────────────────────────────────────────
  // VISTA LOGUEADO
  // ─────────────────────────────────────────
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
              <button type="button" className="nav-btn">
                Productos
              </button>

              <button type="button" className="nav-btn">
                Entregas
              </button>

              <button type="button" className="nav-btn">
                Devoluciones
              </button>
            </nav>

            <div className="usuario-bodega">
              <span>{usuario.correo}</span>
              <button type="button" onClick={cerrarSesion}>
                Cerrar sesión
              </button>
            </div>
          </header>

          <main className="contenido-bodega">
            <section className="bienvenida-bodega">
              <h2>Panel principal</h2>
              <p>
                Bienvenido al sistema interno de bodega. Desde aquí podrás
                gestionar productos, entregas y devoluciones.
              </p>
            </section>
          </main>
        </section>
      </div>
    );
  }

  // ─────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────
  return (
    <main className="login-container">
      <section className="login-card">
        <h1>Intranet RedSalud</h1>
        <p>Ingrese sus credenciales para continuar</p>

        <form onSubmit={manejarLogin} className="login-form">
          <div className="form-grupo">
            <label>Correo institucional</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="usuario@redsalud.gov.cl"
              className={errores.correo ? "input-error" : ""}
            />
            {errores.correo && <span>{errores.correo}</span>}
          </div>

          <div className="form-grupo">
            <label>Contraseña</label>
            <input
              type="password"
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