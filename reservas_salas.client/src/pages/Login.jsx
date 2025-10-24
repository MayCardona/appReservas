import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateOtp } from "../api/apiClient";
import "../assets/Login.css";

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
    <div className="login-container">
      <div className="login-card">
        <img src="/PROSEARr.png" width='100%'/>
        <hr />
        <h2 className="login-title">Reservación de salas</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Número de identificación"
            value={identificacion}
            onChange={(e) => setIdentificacion(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Enviar OTP"}
          </button>
        </form>

        {message && <p className="login-message">{message}</p>}
      </div>
    </div>

  );
}
