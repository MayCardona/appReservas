/**
 * Cliente HTTP para la API de reservas de salas.
 * Contiene funciones asíncronas para autenticación OTP y operaciones sobre salas y reservas.
 *
 * Nota: API_URL se obtiene de import.meta.env.VITE_API_URL y tiene un fallback para desarrollo local.
 */
const API_URL = import.meta.env.VITE_API_URL || "https://localhost:7146";

/* ===========================
   Autenticación OTP
=========================== */
/**
 * Solicita un OTP para el empleado.
 * @param {number|string} IdEmpleado - Identificador del empleado.
 * @returns {Promise<Object>} Respuesta JSON del servidor.
 * @throws {Error} Cuando la petición falla.
 */
export async function generateOtp(IdEmpleado) {
  const response = await fetch(`${API_URL}/api/Auth/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ IdEmpleado }),
  });
  return response.json();
}

/**
 * Verifica el OTP proporcionado por el empleado.
 * @param {number|string} id - Id del empleado.
 * @param {string|number} code - Código OTP.
 * @returns {Promise<Object>} Respuesta JSON del servidor.
 */
export async function verifyOtp(id, code) {
  const response = await fetch(`${API_URL}/api/Auth/response-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      IdEmpleado: id,
      OtpCode: code,
    }),
  });
  return response.json();
}

/**
 * Trae información básica del empleado (nombre, apellido, etc.).
 * Lanza un Error cuando la respuesta HTTP no es OK.
 * @param {number|string} id - Id del empleado.
 * @returns {Promise<Object>} Información del empleado.
 * @throws {Error}
 */
export async function bringEmployeeInfo(id) {
  const response = await fetch(`${API_URL}/api/Auth/bring-info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ IdEmpleado: id }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al traer el nombre del empleado: ${errorText}`);
  }

  const info = await response.json();
  return info;
}

/**
 * Trae el cargo del empleado.
 * Devuelve texto (puede ser nombre del cargo o estructura según el backend).
 * Lanza Error si la petición falla.
 * @param {number|string} id - Id del empleado.
 * @returns {Promise<string>} Cargo del empleado (texto).
 * @throws {Error}
 */
export async function bringEmployeeCharge(id){
  const response = await fetch(`${API_URL}/api/Cargo`,{
    method: "POST",
    headers: { "Content-Type" : "application/json"},
    body: JSON.stringify({IdEmpleado: id})
  });

  if(!response.ok){
    const error = await response.text();
    throw new Error(`Error al traer el cargo del empleado: ${error}`)
  }

  const cargo = await response.text();
  return cargo;
}



// Obtener todas las salas disponibles
/**
 * Obtiene todas las salas disponibles.
 * @returns {Promise<Array>} Lista de salas.
 * @throws {Error}
 */
export async function getSalas() {
  try {
    const res = await fetch(`${API_URL}/api/TSalas`);
    if (!res.ok) throw new Error("Error al obtener salas");
    return await res.json();
  } catch (err) {
    console.error(" Error al obtener salas:", err);
    throw err;
  }
}

// Obtener reservas por sala y fecha
/**
 * Obtiene reservas para una sala en una fecha concreta.
 * Formato esperado de fecha: yyyy-mm-dd (ISO date).
 * @param {number|string} idSala
 * @param {string} fecha - fecha en formato 'YYYY-MM-DD'
 * @returns {Promise<Array>} Lista de reservas
 * @throws {Error} Con mensaje detallado en caso de fallo.
 */
export async function getReservasPorSalaYFecha(idSala, fecha) {
  try {
    const res = await fetch(`${API_URL}/api/TReservas/sala/${idSala}/fecha/${fecha}`);

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status} - ${res.statusText} → ${errorText}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Error detallado en fetchReservasPorSalaYFecha:", err);
    throw err;
  }
}

// Crear nueva reserva
/**
 * Crea una nueva reserva.
 * Devuelve objeto con success boolean y data o message para facilitar el manejo en UI.
 * @param {{idSala:number|string, idEmpleado:number|string, fechaInicio:string, fechaFin:string}} params
 * @returns {Promise<{success:boolean, data?:any, message?:string}>}
 */
export async function crearReserva({ idSala, idEmpleado, fechaInicio, fechaFin }) {
  try {
    const response = await fetch(`${API_URL}/api/TReservas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idSala,
        idEmpleado,
        fechaInicio,
        fechaFin,
        Estado: 1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(" Error del backend:", errorText);
      return { success: false, message: errorText || "Error al crear reserva" };
    }

    //  Manejar 204 (sin contenido)
    if (response.status === 204) {
      return { success: true, message: "Reserva creada correctamente (sin contenido)" };
    }

    //  Intentar leer JSON solo si existe
    const text = await response.text();
    const data = text ? JSON.parse(text) : {};
    return { success: true, data, message: "Reserva creada correctamente" };
  } catch (error) {
    console.error(" Error creando reserva:", error);
    return { success: false, message: error.message || "Error desconocido al crear reserva" };
  }
}

// Obtener todas las reservas del empleado
/**
 * Obtiene todas las reservas del empleado.
 * @param {number|string} idEmpleado
 * @returns {Promise<Array>} Lista de reservas
 * @throws {Error}
 */
export async function getReservasByEmpleado(idEmpleado) {
  try {
    const response = await fetch(`${API_URL}/api/TReservas/employee-id/${idEmpleado}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Error al obtener reservas del empleado");
    }

    return await response.json();
  } catch (err) {
    console.error("Error en getReservasByEmpleado:", err);
    throw err;
  }
}

//  Eliminar una reserva específica
/**
 * Cancela (marca estado 0) una reserva existente.
 * El backend espera un PUT con IdReserva y Estado:0.
 * @param {number|string} idReserva
 * @returns {Promise<any>} Respuesta JSON del backend
 * @throws {Error}
 */
export async function eliminarReserva(idReserva) {
  try {
    const response = await fetch(`${API_URL}/api/TReservas`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        IdReserva: idReserva,
        Estado: 0,            
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Error al cancelar la reserva");
    }

    return data;
  } catch (err) {
    console.error("Error al cancelar la reserva:", err);
    throw err;
  }
}
