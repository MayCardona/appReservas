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

  const { reservasActualizadas, setReservasActualizadas } = useAuth();

  //Cargar salas
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

  //Cargar reservas según sala y fecha seleccionadas
  useEffect(() => {
    if (!salaSeleccionada || salaSeleccionada === "null") return;

    const cargarReservas = async () => {
      try {
        const data = await getReservasPorSalaYFecha(
          salaSeleccionada,
          fechaSeleccionada
        );
        setReservas(data);
      } catch (err) {
        console.error(
          `Error al obtener reservas para sala ${salaSeleccionada} y fecha ${fechaSeleccionada}:`,
          err?.message || err
        );
      }
    };

    cargarReservas();
  }, [salaSeleccionada, fechaSeleccionada]);

  // Escuchar si se canceló una reserva en MisReservas
  useEffect(() => {
    if (reservasActualizadas) {
      const actualizarReservas = async () => {
        if (salaSeleccionada) {
          try {
            const data = await getReservasPorSalaYFecha(
              salaSeleccionada,
              fechaSeleccionada
            );
            setReservas(data);
          } catch (error) {
            console.error("Error al refrescar reservas:", error);
          }
        }
        setReservasActualizadas(false);
      };

      actualizarReservas();
    }
  }, [reservasActualizadas]);

  // Generar bloques de horarios (08:00 - 18:00)
  const generarBloques = () => {
    const bloques = [];
    const ahora = new Date();

    for (let hora = 8; hora < 18; hora++) {
      const inicio = new Date(
        `${fechaSeleccionada}T${hora.toString().padStart(2, "0")}:00:00`
      );
      const fin = new Date(inicio.getTime() + 60 * 60 * 1000);

      const ocupado = reservas.some((r) => {
        if (r.estado === 0) return false; 
        const fi = new Date(r.fechaInicio);
        const ff = new Date(r.fechaFin);

        return (
          fi.toDateString() === inicio.toDateString() &&
          inicio < ff &&
          fin > fi
        );
      });

      const pasado = inicio < ahora;

      bloques.push({
        label: `${hora.toString().padStart(2, "0")}:00 — ${(hora + 1)
          .toString()
          .padStart(2, "0")}:00`,
        ocupado,
        pasado,
      });
    }

    return bloques;
  };

  //Crear reserva
  const handleReservar = async (horaInicio) => {
    if (!salaSeleccionada)
      return Swal.fire("Selecciona una sala primero", "", "warning");

    const fechaInicioLocal = `${fechaSeleccionada}T${horaInicio}:00`;
    const ahora = new Date();

    if (new Date(fechaInicioLocal) < ahora) {
      return Swal.fire("No puedes reservar un horario pasado", "", "error");
    }

    const user = getSecureItem("user");
    if (!user) return Swal.fire("Usuario no autenticado", "", "error");

    const idEmpleado = user.id || user.IdEmpleado || user.Id;
    if (!idEmpleado)
      return Swal.fire("Falta el ID de empleado", "", "error");

    const salaNombre =
      salas.find((s) => s.idSala === salaSeleccionada)?.salas ||
      salaSeleccionada;

    const confirm = await Swal.fire({
      title: "¿Confirmar reserva?",
      text: `Sala ${salaNombre} a las ${horaInicio}`,
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
        fechaInicio: fechaInicioLocal,
      });

      if (result.success) {
        await Swal.fire("Reserva creada correctamente", "", "success");

        // Recargar reservas actualizadas
        const nuevasReservas = await getReservasPorSalaYFecha(
          salaSeleccionada,
          fechaSeleccionada
        );
        setReservas(nuevasReservas);
      } else {
        await Swal.fire(
          "Error al crear reserva",
          result.message || "Ocurrió un error desconocido",
          "error"
        );
      }
    } catch (error) {
      console.error("Error en handleReservar:", error);
      await Swal.fire("Error inesperado", error.message || "", "error");
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
        {/* Panel izquierdo - Salas */}
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
                  onClick={() => setSalaSeleccionada(s.idSala)}
                  style={{ cursor: "pointer" }}
                >
                  <i className="bi bi-door-open me-2"></i> {s.salas}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Panel derecho - Horarios */}
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
                        : "disponible"
                    }`}
                    onClick={() =>
                      !b.ocupado &&
                      !b.pasado &&
                      handleReservar(b.label.split(" — ")[0])
                    }
                  >
                    <span className="hora">{b.label}</span>
                    <span className="estado">
                      {b.ocupado
                        ? "Ocupado"
                        : b.pasado
                        ? "Pasado"
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
          </div>
        </div>
      </div>
    </div>
  );
}
