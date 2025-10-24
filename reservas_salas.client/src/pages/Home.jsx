import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";
import "../assets/Home.css";
import {
  getSalas,
  getReservasPorSalaYFecha,
  crearReserva,
  eliminarReserva,
} from "../api/apiClient";
import { getSecureItem } from "../utils/secureStorage";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FaTv, FaUsers, FaDoorOpen } from "react-icons/fa";

export default function Home() {
  const user = getSecureItem("user");
  const esSuperUsuario = user?.idCargo === 30 || user?.idCargo === '30';
  const navigate = useNavigate();

  const [salas, setSalas] = useState([]);
  const [salaSeleccionada, setSalaSeleccionada] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reservas, setReservas] = useState([]);
  const [bloquesSeleccionados, setBloquesSeleccionados] = useState([]);
  const [paso, setPaso] = useState(1);

  const { reservasActualizadas, setReservasActualizadas } = useAuth();

  // 🔹 Cargar salas
  useEffect(() => {
    const cargarSalas = async () => {
      try {
        const data = await getSalas();
        setSalas(data);
      } catch (err) {
        console.error("Error al cargar salas:", err);
      }
    };
    cargarSalas();
  }, []);

  // 🔹 Cargar reservas por sala y fecha
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
        console.error("Error al cargar reservas:", err);
      }
    };
    cargarReservas();
  }, [salaSeleccionada, fechaSeleccionada]);

  // 🔹 Refrescar reservas globales
  useEffect(() => {
    if (reservasActualizadas && salaSeleccionada) {
      (async () => {
        const data = await getReservasPorSalaYFecha(
          salaSeleccionada,
          fechaSeleccionada
        );
        setReservas(data);
        setReservasActualizadas(false);
      })();
    }
  }, [reservasActualizadas]);

  // 🔹 Generar bloques horarios
  const generarBloques = () => {
    const bloques = [];
    const ahora = new Date();

    for (let hora = 8; hora < 18; hora += 0.5) {
      const horaEntera = Math.floor(hora);
      const minutos = hora % 1 === 0 ? "00" : "30";
      const inicio = new Date(`${fechaSeleccionada}T${horaEntera
        .toString()
        .padStart(2, "0")}:${minutos}:00`);
      const fin = new Date(inicio.getTime() + 30 * 60 * 1000);
      
      const reservaBloque = reservas.find((r) => {
        if (r.estado === 0) return false;
        const fi = new Date(r.fechaInicio);
        const ff = new Date(r.fechaFin);
        return (
          fi.toDateString() === inicio.toDateString() &&
          inicio < ff &&
          fin > fi
        );
      });

      const ocupado = !!reservaBloque;
      const pasado = inicio < ahora;

      bloques.push({
        label: `${inicio.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })} — ${fin.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
        horaInicio: inicio,
        ocupado,
        pasado,
        reserva: reservaBloque || null,
      });
    }
    return bloques;
  };

  const bloques = generarBloques();

  // 🔹 Seleccionar bloque
  const handleSeleccionBloque = (hora) => {
    const bloque = bloques.find((b) => b.horaInicio.getTime() === hora.getTime());
    if (!bloque || bloque.ocupado || bloque.pasado) return;

    setBloquesSeleccionados((prev) => {
      const existe = prev.some((h) => h.getTime() === hora.getTime());
      return existe
        ? prev.filter((h) => h.getTime() !== hora.getTime())
        : [...prev, hora].sort((a, b) => a - b);
    });
  };

  // 🔹 Crear reserva
  const handleReservar = async () => {
    if (!salaSeleccionada)
      return Swal.fire("Selecciona una sala", "", "warning");
    if (bloquesSeleccionados.length === 0)
      return Swal.fire("Selecciona al menos un bloque", "", "warning");

    const bloquesOrdenados = [...bloquesSeleccionados].sort((a, b) => a - b);
    const fechaInicio = bloquesOrdenados[0];
    const fechaFin = new Date(
      bloquesOrdenados[bloquesOrdenados.length - 1].getTime() + 30 * 60 * 1000
    );

    const idEmpleado = user.id || user.IdEmpleado || user.Id;
    const salaNombre =
      salas.find((s) => s.idSala === salaSeleccionada)?.salas || "Sala";

    const confirm = await Swal.fire({
      title: "Confirmar reserva",
      text: `Sala ${salaNombre} desde ${fechaInicio.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })} hasta ${fechaFin.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, reservar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#0033A0",
    });

    if (!confirm.isConfirmed) return;

    try {
      const tzOffset = fechaInicio.getTimezoneOffset() * 60000;
      const formatoLocal = (fecha) =>
        new Date(fecha.getTime() - tzOffset).toISOString().slice(0, 19);

      const result = await crearReserva({
        idSala: salaSeleccionada,
        idEmpleado,
        fechaInicio: formatoLocal(fechaInicio),
        fechaFin: formatoLocal(fechaFin),
        Estado: 1,
      });

      if (result.success) {
        await Swal.fire("Reserva creada correctamente", "", "success");
        setBloquesSeleccionados([]);
        setPaso(4);
        navigate("/reservas");
      } else {
        Swal.fire("Error", result.message, "error");
      }
    } catch (error) {
      console.error("Error en handleReservar:", error);
      Swal.fire("Error inesperado", error.message, "error");
    }
  };

  // 🔹 Cancelar reserva
  const handleCancelarReserva = async (idReserva) => {
    const confirm = await Swal.fire({
      title: "¿Cancelar esta reserva?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, cancelar",
      cancelButtonText: "No",
      confirmButtonColor: "#d33",
    });

    if (!confirm.isConfirmed) return;

    try {
      const result = await eliminarReserva(idReserva);
      if (result.success) {
        await Swal.fire("Reserva cancelada", "", "success");
        const nuevas = await getReservasPorSalaYFecha(
          salaSeleccionada,
          fechaSeleccionada
        );
        setReservas(nuevas);
      } else {
        Swal.fire("Error", result.message, "error");
      }
    } catch (error) {
      console.error("Error al cancelar reserva:", error);
      Swal.fire("Error inesperado", error.message, "error");
    }
  };

  // 🔹 Render principal (wizard)
  return (
    <div className="home-wizard-wrapper">
      {/* Línea de progreso */}
      <div className="stepper-line-container mb-5">
        <div className="stepper-line-base"></div>
        {["Fecha", "Sala", "Horario", "Confirmar"].map((etiqueta, i) => (
          <div
            key={i}
            className={`step-circle ${paso >= i + 1 ? "active" : ""}`}
            style={{ left: `${i * 33}%` }}
          >
            {i + 1}
            <span className="step-label">{etiqueta}</span>
          </div>
        ))}
      </div>

      {/* Card principal */}
      <div className="card-step">
        {paso === 1 && (
          <div className="step-content">
            <h2>Selecciona la fecha</h2>
            <input
              type="date"
              className="form-control"
              value={fechaSeleccionada}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
            />
            <button
              className="btn-next mt-4"
              onClick={() => setPaso(2)}
              disabled={!fechaSeleccionada}
            >
              Siguiente
            </button>
          </div>
        )}

        {paso === 2 && (
          <div className="step-content">
            <h2>Selecciona la sala</h2>
            <div className="salas-grid">
              {salas.map((sala) => (
                <div
                  key={sala.idSala}
                  className={`sala-card ${
                    salaSeleccionada === sala.idSala ? "active" : ""
                  }`}
                  onClick={() => setSalaSeleccionada(sala.idSala)}
                >
                  <div className="sala-icon">
                    {sala.idSala % 3 === 0 ? (
                      <FaDoorOpen size={28} />
                    ) : sala.idSala % 2 === 0 ? (
                      <FaUsers size={28} />
                    ) : (
                      <FaTv size={28} />
                    )}
                  </div>
                  <h4>{sala.salas}</h4>
                </div>
              ))}
            </div>

            <div className="d-flex justify-content-between mt-4">
              <button className="btn-prev" onClick={() => setPaso(1)}>
                Atrás
              </button>
              <button
                className="btn-next"
                onClick={() => setPaso(3)}
                disabled={!salaSeleccionada}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {paso === 3 && (
          <div className="step-content">
            <h2>Selecciona el horario</h2>
            <div className="schedule-grid">
              {bloques.map((bloque, index) => (
                <div
                  key={index}
                  className={`slot ${
                    bloque.pasado
                      ? "pasado"
                      : bloque.ocupado
                      ? "ocupado"
                      : bloquesSeleccionados.some(
                          (b) => b.getTime() === bloque.horaInicio.getTime()
                        )
                      ? "seleccionado"
                      : "disponible"
                  }`}
                  onClick={() => handleSeleccionBloque(bloque.horaInicio)}
                >
                  {bloque.label}
                  {bloque.ocupado && bloque.reserva && (
                    <div className="reserva-info">
                      <strong>{bloque.reserva.idEmpleadoNavigation.nombre} {bloque.reserva.idEmpleadoNavigation.apellido}</strong>
                      <small>{bloque.reserva.idEmpleadoNavigation.cargoNavigation.cargo}</small>
                    </div>
                  )}
                  {esSuperUsuario && bloque.reserva && (
                    <button
                      className="btn-cancelar"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelarReserva(bloque.reserva.idReserva);
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="d-flex justify-content-between mt-4">
              <button className="btn-prev" onClick={() => setPaso(2)}>
                Atrás
              </button>
              <button
                className="btn-next"
                onClick={() => setPaso(4)}
                disabled={bloquesSeleccionados.length === 0}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {paso === 4 && (
          <div className="step-content">
            <h2>Confirmar reserva</h2>
            <p>
              Sala:{" "}
              <strong>
                {salas.find((s) => s.idSala === salaSeleccionada)?.salas}
              </strong>
            </p>
            <p>
              Fecha: <strong>{fechaSeleccionada}</strong>
            </p>
            <p>
              Horas seleccionadas:{" "}
              <strong>
                {bloquesSeleccionados
                  .map((b) =>
                    b.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  )
                  .join(", ")}
              </strong>
            </p>

            <div className="d-flex justify-content-between mt-4">
              <button className="btn-prev" onClick={() => setPaso(3)}>
                Atrás
              </button>
              <button className="btn-confirmar" onClick={handleReservar}>
                Confirmar Reserva
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
