import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { getSecureItem } from "../utils/secureStorage";
import { getReservasByEmpleado, eliminarReserva } from "../api/apiClient";
import { useAuth } from "../context/AuthContext"; // 👈 NUEVO IMPORT
import "bootstrap/dist/css/bootstrap.min.css";
import "../assets/Reservas.css";

export default function MisReservas() {
  const [reservas, setReservas] = useState([]);
  const [reservaActiva, setReservaActiva] = useState(null);
  const { setReservasActualizadas } = useAuth(); // 👈 NUEVO

  useEffect(() => {
    const fetchReservas = async () => {
      try {
        const user = getSecureItem("user");
        if (!user) {
          return Swal.fire("Error", "No hay usuario autenticado", "error");
        }

        const data = await getReservasByEmpleado(user.id || user.IdEmpleado);
        setReservas(data);
      } catch (err) {
        Swal.fire("Error", err.message, "error");
      }
    };

    fetchReservas();
  }, []);

  const handleEliminar = async (idReserva) => {
    const confirm = await Swal.fire({
      title: "¿Desea cancelar la reserva?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No",
      confirmButtonColor: "#d33",
    });

    if (!confirm.isConfirmed) return;

    try {
      const result = await eliminarReserva(idReserva);
      Swal.fire("Éxito", result.Message || "Reserva cancelada correctamente", "success");

      // Actualiza estado local
      setReservas((prev) =>
        prev.map((r) =>
          r.idReserva === idReserva ? { ...r, estado: 0 } : r
        )
      );

      // 👇 Notifica al Home que se debe refrescar
      setReservasActualizadas(true);

      setReservaActiva(null);
    } catch (err) {
      Swal.fire("Error", err.message, "error");
    }
  };

  return (
    <div className="container py-4">
      <h2 className="text-info mb-4 fw-bold">
        <i className="bi bi-calendar3 me-2"></i> Mis Reservas
      </h2>

      {reservas.length === 0 ? (
        <p className="text-muted">No tienes reservas activas.</p>
      ) : (
        <div className="row g-4">
          {reservas.map((r) => {
            const isActive = reservaActiva === r.idReserva;
            const cancelada = r.estado === 0;

            return (
              <div key={r.idReserva} className="col-12 col-md-6 col-lg-4">
                <div
                  className={`reserva-card ${isActive ? "active" : ""} ${
                    cancelada ? "bg-secondary bg-opacity-50" : ""
                  }`}
                  onClick={() =>
                    setReservaActiva(isActive ? null : r.idReserva)
                  }
                >
                  <div className="card-body text-light text-center">
                    <h5 className="text-info fw-bold mb-2">
                      <i className="bi bi-door-open me-2"></i>
                      {r.nombreSala}
                    </h5>

                    <div className="mb-2">
                      {cancelada ? (
                        <span className="badge bg-danger">Cancelada</span>
                      ) : (
                        <span className="badge bg-success">Activa</span>
                      )}
                    </div>

                    <p className="mb-1">
                      {new Date(r.fechaInicio).toLocaleDateString()}
                    </p>
                    <p className="mb-2">
                      {new Date(r.fechaInicio).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(r.fechaFin).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>

                    <div
                      className={`expand-section ${
                        isActive ? "show" : "hide"
                      }`}
                    >
                      {!cancelada && (
                        <button
                          className="btn btn-outline-danger mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEliminar(r.idReserva);
                          }}
                        >
                          <i className="bi bi-trash me-2"></i> Cancelar reserva
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
