import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark"
      style={{ backgroundColor: "#002D8D" }} // azul oscuro
    >
      <div className="container-fluid px-3">
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img
            src="/PROSEAR.png"
            alt="Logo"
            height="35"
            className="me-2"
          />
        </Link>

        {/* Botón colapsable */}
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Contenido del menú */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto my-2 my-lg-0">
            <li className="nav-item">
              <Link className="nav-link text-light" to="/">
                Inicio
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link text-light" to="/reservas">
                Reservas
              </Link>
            </li>
          </ul>

          {/* Usuario - Cerrar sesión */}
          {user && (
            <>
              <div className="d-lg-none text-light mb-2 d-flex align-items-center justify-content-between border-top pt-2">
                <div className="d-flex align-items-center">
                  <i className="bi bi-person-circle me-2 text-info"></i>
                  <span>{user.nombre}</span>
                </div>
                <button
                  className="btn btn-outline-light btn-sm ms-3"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </div>
              <ul className="navbar-nav ms-auto d-none d-lg-flex align-items-center">
                <li className="nav-item me-3 d-flex align-items-center text-light">
                  <i className="bi bi-person-circle me-2 text-info"></i>
                  <span>{user.nombre}</span>
                </li>
                <li className="nav-item">
                  <button
                    className="btn btn-outline-light btn-sm"
                    onClick={handleLogout}
                  >
                    Cerrar sesión
                  </button>
                </li>
              </ul>
            </>
          )}

          {!user && (
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="btn btn-info btn-sm" to="/login">
                  Ingresar
                </Link>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
}
