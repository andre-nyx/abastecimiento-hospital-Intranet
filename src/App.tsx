import { useState } from "react";
import "./App.css";

interface UsuarioSesion {
  correo: string;
}

function App() {
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

    let nuevosErrores = {
      correo: "",
      password: "",
    };

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
      const usuarioLogueado = {
        correo: correo,
      };

      localStorage.setItem("usuarioSesion", JSON.stringify(usuarioLogueado));
      setUsuario(usuarioLogueado);
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("usuarioSesion");
    setUsuario(null);
    setCorreo("");
    setPassword("");
  };

  if (usuario) {
    return (
      <div className="dashboard">
        <div className="dashboard-card">
          <h1>Sistema de Bodega HRC</h1>
          <p>Bienvenido, {usuario.correo}</p>

          <button onClick={cerrarSesion} className="btn-cerrar">
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

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