import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateOtp } from "../api/apiClient";

export default function Login() {
  const [identificacion, setIdentificacion] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const result = await generateOtp(identificacion);
      if (result.success) {
        setMessage("Código enviado con éxito. Revisa tu correo.");
        // Pasamos la identificación al navegar
        navigate("/verify", { state: { identificacion } });
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setMessage(`Error al conectar con el servidor: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-dark text-light">
      <h2>Ingreso con Identificación</h2>
      <form onSubmit={handleSubmit} className="w-25">
        <input
          type="text"
          placeholder="Número de identificación"
          className="form-control mb-3"
          value={identificacion}
          onChange={(e) => setIdentificacion(e.target.value)}
          required
        />
        <button type="submit" disabled={loading} className="btn btn-info w-100">
          {loading ? "Enviando..." : "Enviar OTP"}
        </button>
      </form>
      {message && <p className="mt-3">{message}</p>}
    </div>
  );
}
