import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { bringEmployeeInfo, verifyOtp } from "../api/apiClient";
import { useAuth } from "../context/AuthContext";
import { FiShield } from "react-icons/fi"; // Ícono moderno opcional

export default function VerifyOtp() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!state?.identificacion) {
      navigate("/login");
    }
  }, [state, navigate]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await verifyOtp(state.identificacion, code);

      if (result.success) {
        const employee = await bringEmployeeInfo(state.identificacion);
        console.log(employee.nombreCompleto + " " + employee.cargo);

        login({
          nombre: employee.nombreCompleto,
          id: state.identificacion,
          idCargo: employee.cargo,
        });
        navigate("/");
      } else {
        setMessage(result.message || "Código incorrecto.");
      }
    } catch (error) {
      console.error("Error en handleVerify:", error);
      setMessage("Error en la verificación del código.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title d-flex align-items-center justify-content-center gap-2">
          <FiShield size={24} color="#004aad" />
          Verificación de Código
        </h2>

        <form onSubmit={handleVerify}>
          <input
            type="text"
            placeholder="Código de verificación"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Verificando..." : "Verificar"}
          </button>
        </form>

        {message && <p className="login-message">{message}</p>}

        <button type="button" className="btn-volver" onClick={() => navigate("/login")}>
          ← Volver al inicio
        </button>
      </div>
    </div>
  );
}
