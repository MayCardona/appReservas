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

export default function Home() {
  const user = getSecureItem("user");
  const esSuperUsuario = user?.idCargo === 2;
  const [salas, setSalas] = useState([]);
  const [salaSeleccionada, setSalaSeleccionada] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [reservas, setReservas] = useState([]);
  const [bloquesSeleccionados, setBloquesSeleccionados] = useState([]);

  const { reservasActualizadas, setReservasActualizadas } = useAuth();
  

  // 🔹 Cargar salas disponibles
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
        console.error(
          `Error al obtener reservas para sala ${salaSeleccionada}:`,
          err?.message || err
        );
      }
    };

    cargarReservas();
  }, [salaSeleccionada, fechaSeleccionada]);

  // 🔹 Refrescar cuando cambien reservas desde MisReservas
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

  // 🔹 Generar bloques horarios (8am a 6pm)
  const generarBloques = () => {
    const bloques = [];
    const ahora = new Date();

    // 🔹 Desde 8:00 hasta 18:00 en intervalos de 30 minutos
    for (let hora = 8; hora < 18; hora += 0.5) {
        const horaEntera = Math.floor(hora);
        const minutos = hora % 1 === 0 ? "00" : "30";

        const inicio = new Date(`${fechaSeleccionada}T${horaEntera
        .toString()
        .padStart(2, "0")}:${minutos}:00`);
        const fin = new Date(inicio.getTime() + 30 * 60 * 1000); // 30 minutos

        // 🔹 Buscar si hay una reserva activa (estado != 0)
        const reservaBloque = reservas.find((r) => {
        if (r.estado === 0) return false; // Ignorar canceladas

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

        const label = `${inicio
        .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — ${fin.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        })}`;

        bloques.push({
        label,
        horaInicio: inicio,
        ocupado,
        pasado,
        reserva: reservaBloque || null,
        });
    }

    return bloques;
    };

  // 🔹 Seleccionar o deseleccionar bloques
  const handleSeleccionBloque = (hora) => {
    const bloques = generarBloques();
    const bloque = bloques.find((b) => b.horaInicio.getTime() === hora.getTime());
    if (!bloque) return; // seguridad adicional

    if (bloque.ocupado || bloque.pasado) return;

    setBloquesSeleccionados((prev) => {
        const existe = prev.some((h) => h.getTime() === hora.getTime());
        if (existe) {
            return prev.filter((h) => h.getTime() !== hora.getTime());
        } else {
            return [...prev, hora].sort((a, b) => a - b);
        }
    });
    };
  // 🔹 Crear reserva (múltiples bloques)
  const handleReservar = async () => {
    if (!salaSeleccionada)
        return Swal.fire("Selecciona una sala primero", "", "warning");

    if (bloquesSeleccionados.length === 0)
        return Swal.fire("Selecciona al menos un bloque", "", "warning");

    // 🔹 Ordenar bloques seleccionados
    const bloquesOrdenados = [...bloquesSeleccionados].sort((a, b) => a - b);
    const fechaInicio = bloquesOrdenados[0];
    const fechaFin = new Date(
        bloquesOrdenados[bloquesOrdenados.length - 1].getTime() + 30 * 60 * 1000
    );
    
    if (!user) return Swal.fire("Usuario no autenticado", "", "error");

    const idEmpleado = user.id || user.IdEmpleado || user.Id;
    const salaNombre =
        salas.find((s) => s.idSala === salaSeleccionada)?.salas ||
        salaSeleccionada;

    // 🔹 Mostrar hora real (local)
    const horaInicioTexto = fechaInicio.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
    const horaFinTexto = fechaFin.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });

    const confirm = await Swal.fire({
        title: "Confirmar reserva",
        text: `Sala ${salaNombre} desde ${horaInicioTexto} hasta ${horaFinTexto}`,
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
        // 🔹 Convertir fechas a formato local sin desfase (mantiene hora real)
        const formatoLocal = (fecha) => {
            const tzOffset = fecha.getTimezoneOffset() * 60000; // Diferencia del huso horario
            const localISOTime = new Date(fecha.getTime() - tzOffset)
                .toISOString()
                .slice(0, 19); // Mantener solo YYYY-MM-DDTHH:mm:ss
            return localISOTime;
        };

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


    const handleCancelarReserva = async (idReserva) => {
        const confirm = await Swal.fire({
            title: "¿Cancelar esta reserva?",
            text: "Esta acción no se puede deshacer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, cancelar",
            cancelButtonText: "No",
            confirmButtonColor: "#d33",
            background: "#1a1d23",
            color: "#e4e4e4",
        });

        if (!confirm.isConfirmed) return;

        try {
            const result = await eliminarReserva(idReserva);

            if (result.success) {
            await Swal.fire("Reserva cancelada", "", "success");

            // 🔹 Refrescar la lista de reservas
            const nuevasReservas = await getReservasPorSalaYFecha(
                salaSeleccionada,
                fechaSeleccionada
            );
            setReservas(nuevasReservas);
            } else {
            await Swal.fire("Error", result.message, "error");
            }
        } catch (error) {
            console.error("Error al cancelar la reserva:", error);
            Swal.fire("Error inesperado", error.message, "error");
        }
    };

  // 🔹 Render principal
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
                  <i className="bi bi-door-open me-2"></i>
                  {s.salas}
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
                        : bloquesSeleccionados.some((h) => h.getTime() === b.horaInicio.getTime())
                        ? "seleccionado"
                        : "disponible"
                    }`}
                    onClick={() => handleSeleccionBloque(b.horaInicio)}
                  >
                    <span className="hora">{b.label}</span>
                    <span className="estado">
                      {b.ocupado ? (
                        <div className="d-flex justify-content-between align-items-center w-100">
                            <div>
                            <i className="bi bi-person-fill me-1"></i>
                            <small>
                                {b.reserva?.idEmpleado
                                ? `${b.reserva.idEmpleadoNavigation.nombre} ${b.reserva.idEmpleadoNavigation.apellido} (${b.reserva.idEmpleadoNavigation.cargoNavigation.cargo})`
                                : "Ocupado"}
                            </small>
                            </div>

                            {esSuperUsuario && (
                            <button
                                className="btn btn-sm btn-outline-danger ms-2"
                                onClick={(e) => {
                                e.stopPropagation();
                                handleCancelarReserva(b.reserva.idReserva);
                                }}
                            >
                                <i className="bi bi-x-circle"></i>
                            </button>
                            )}
                        </div>
                        ) : b.pasado ? (
                        "Pasado"
                        ) : bloquesSeleccionados.includes(b.horaInicio) ? (
                        "Seleccionado"
                        ) : (
                        "Disponible"
                    )}
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
