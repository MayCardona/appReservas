import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { bringEmployeeInfo, verifyOtp } from "../api/apiClient";
import { useAuth } from "../context/AuthContext";

export default function VerifyOtp() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");

  
  useEffect(() => {
    if (!state?.identificacion) {
      navigate("/login");
    }
  }, [state, navigate]);

    const handleVerify = async (e) => {
        e.preventDefault();
        try {
            const result = await verifyOtp(state.identificacion, code);

            if (result.success) {
                const employee = await bringEmployeeInfo(state.identificacion);

                console.log(employee.nombreCompleto + employee.cargo);
                
                login({ nombre: employee.nombreCompleto, id: state.identificacion, idCargo: employee.cargo});
                navigate("/");
            } else {
                setMessage(result.message || "Código incorrecto.");
            }
        } catch (error) {
            console.error("Error en handleVerify:", error);
            setMessage("Error en la verificación del código.");
        }
    };

  return (
    <div className="otp-container d-flex flex-column align-items-center justify-content-center min-vh-100 bg-dark text-light">
      <h2>Verificación de Código</h2>
      <form onSubmit={handleVerify} className="w-25">
        <input
          type="text"
          placeholder="Código de verificación"
          className="form-control mb-3"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-info w-100">
          Verificar
        </button>
      </form>
      {message && <p className="mt-3">{message}</p>}
    </div>
  );
}
