const API_URL = import.meta.env.VITE_API_URL || "https://localhost:7146";

/* ===========================
   Autenticación OTP
=========================== */
export async function generateOtp(IdEmpleado) {
  const response = await fetch(`${API_URL}/api/Auth/request-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ IdEmpleado }),
  });
  return response.json();
}

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
