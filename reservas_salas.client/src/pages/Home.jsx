import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";
import "../assets/Home.css";
import {
  getSalas,
  getReservasPorSalaYFecha,
  crearReserva,
} from "../api/apiClient";
import { getSecureItem } from "../utils/secureStorage";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const [salas, setSalas] = useState([]);
  const [salaSeleccionada, setSalaSeleccionada] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reservas, setReservas] = useState([]);
  const [bloquesSeleccionados, setBloquesSeleccionados] = useState([]);

  const { reservasActualizadas, setReservasActualizadas } = useAuth();

  // Cargar salas
  useEffect(() => {
    const cargarSalas = async () => {
      try {
        const data = await getSalas();
        setSalas(data);
      } catch (err) {
        console.error("Error al cargar salas:", err?.message || err);
      }
    };
    cargarSalas();
  }, []);

  // Cargar reservas según sala y fecha seleccionadas
  useEffect(() => {
    if (!salaSeleccionada) return;

    const cargarReservas = async () => {
      try {
        const data = await getReservasPorSalaYFecha(
          salaSeleccionada,
          fechaSeleccionada
        );
        setReservas(data);
      } catch (err) {
        console.error(
          `Error al obtener reservas para sala ${salaSeleccionada}:`,
          err?.message || err
        );
      }
    };

    cargarReservas();
  }, [salaSeleccionada, fechaSeleccionada]);

  // Refrescar si hay cambios desde MisReservas
  useEffect(() => {
    if (reservasActualizadas) {
      (async () => {
        if (salaSeleccionada) {
          const data = await getReservasPorSalaYFecha(
            salaSeleccionada,
            fechaSeleccionada
          );
          setReservas(data);
        }
        setReservasActualizadas(false);
      })();
    }
  }, [reservasActualizadas]);

  // Generar bloques de horarios
  const generarBloques = () => {
    const bloques = [];
    const ahora = new Date();

    for (let hora = 8; hora < 18; hora++) {
      const inicio = new Date(`${fechaSeleccionada}T${hora.toString().padStart(2, "0")}:00:00`);
      const fin = new Date(inicio.getTime() + 60 * 60 * 1000);

      const ocupado = reservas.some((r) => {
        if (r.estado === 0) return false;
        const fi = new Date(r.fechaInicio);
        const ff = new Date(r.fechaFin);
        return fi.toDateString() === inicio.toDateString() && inicio < ff && fin > fi;
      });

      const pasado = inicio < ahora;

      bloques.push({
        label: `${hora.toString().padStart(2, "0")}:00 — ${(hora + 1)
          .toString()
          .padStart(2, "0")}:00`,
        horaInicio: hora,
        ocupado,
        pasado,
      });
    }

    return bloques;
  };

  // Seleccionar / deseleccionar bloques
  const handleSeleccionBloque = (hora) => {
    const bloques = generarBloques();
    const bloque = bloques.find((b) => b.horaInicio === hora);

    if (bloque.ocupado || bloque.pasado) return;

    setBloquesSeleccionados((prev) => {
      if (prev.includes(hora)) {
        return prev.filter((h) => h !== hora);
      } else {
        return [...prev, hora].sort((a, b) => a - b);
      }
    });
  };

  // Crear reserva (para múltiples bloques)
  const handleReservar = async () => {
    if (!salaSeleccionada)
      return Swal.fire("Selecciona una sala primero", "", "warning");

    if (bloquesSeleccionados.length === 0)
      return Swal.fire("Selecciona al menos un bloque", "", "warning");

    // Calcular hora de inicio y fin
    const horaInicio = Math.min(...bloquesSeleccionados);
    const horaFin = Math.max(...bloquesSeleccionados) + 1;

    const fechaInicio = `${fechaSeleccionada}T${horaInicio
      .toString()
      .padStart(2, "0")}:00:00`;
    const fechaFin = `${fechaSeleccionada}T${horaFin
      .toString()
      .padStart(2, "0")}:00:00`;

    const user = getSecureItem("user");
    if (!user) return Swal.fire("Usuario no autenticado", "", "error");
    const idEmpleado = user.id || user.IdEmpleado || user.Id;

    const salaNombre =
      salas.find((s) => s.idSala === salaSeleccionada)?.salas ||
      salaSeleccionada;

    const confirm = await Swal.fire({
      title: "Confirmar reserva",
      text: `Sala ${salaNombre} desde ${horaInicio}:00 hasta ${horaFin}:00`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, reservar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#0033A0",
      background: "#1a1d23",
      color: "#e4e4e4",
    });

    if (!confirm.isConfirmed) return;

    try {
      const result = await crearReserva({
        idSala: salaSeleccionada,
        idEmpleado,
        fechaInicio,
        fechaFin,
        Estado: 1,
      });

      if (result.success) {
        await Swal.fire("Reserva creada correctamente", "", "success");
        setBloquesSeleccionados([]);
        const nuevasReservas = await getReservasPorSalaYFecha(
          salaSeleccionada,
          fechaSeleccionada
        );
        setReservas(nuevasReservas);
      } else {
        await Swal.fire("Error", result.message, "error");
      }
    } catch (error) {
      console.error("Error en handleReservar:", error);
      Swal.fire("Error inesperado", error.message, "error");
    }
  };

  return (
    <div className="home-wrapper container-fluid py-4 px-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="display-6 fw-bold text-info">ReservApp Dashboard</h1>
        <input
          type="date"
          className="form-control w-auto bg-dark text-light border-info"
          value={fechaSeleccionada}
          onChange={(e) => setFechaSeleccionada(e.target.value)}
        />
      </div>

      <div className="row">
        {/* Panel de salas */}
        <div className="col-md-3">
          <div className="panel p-3 mb-4">
            <h5 className="mb-3 text-info">Salas disponibles</h5>
            <ul className="list-group bg-dark rounded">
              {salas.map((s) => (
                <li
                  key={s.idSala}
                  className={`list-group-item list-group-item-action ${
                    salaSeleccionada === s.idSala ? "active-sala" : ""
                  }`}
                  onClick={() => {
                    setSalaSeleccionada(s.idSala);
                    setBloquesSeleccionados([]);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <i className="bi bi-door-open me-2"></i> {s.salas}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Panel de horarios */}
        <div className="col-md-9">
          <div className="panel p-4">
            <h4 className="text-center text-light text-info mb-4">
              {salaSeleccionada
                ? `Disponibilidad - ${
                    salas.find((s) => s.idSala === salaSeleccionada)?.salas
                  }`
                : "Selecciona una sala"}
            </h4>

            <div className="schedule-grid text-light">
              {salaSeleccionada ? (
                generarBloques().map((b, i) => (
                  <div
                    key={i}
                    className={`slot ${
                      b.ocupado
                        ? "ocupado"
                        : b.pasado
                        ? "pasado"
                        : bloquesSeleccionados.includes(b.horaInicio)
                        ? "seleccionado"
                        : "disponible"
                    }`}
                    onClick={() => handleSeleccionBloque(b.horaInicio)}
                  >
                    <span className="hora">{b.label}</span>
                    <span className="estado">
                      {b.ocupado
                        ? "Ocupado"
                        : b.pasado
                        ? "Pasado"
                        : bloquesSeleccionados.includes(b.horaInicio)
                        ? "Seleccionado"
                        : "Disponible"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted">
                  Selecciona una sala para ver su horario
                </p>
              )}
            </div>

            {bloquesSeleccionados.length > 0 && (
              <div className="text-center mt-4">
                <button
                  className="btn btn-success px-4 py-2"
                  onClick={handleReservar}
                >
                  Confirmar reserva ({bloquesSeleccionados.length} hora
                  {bloquesSeleccionados.length > 1 ? "s" : ""})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
