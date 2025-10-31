import { createContext, useContext, useState, useEffect } from "react";
import { setSecureItem, getSecureItem, removeSecureItem } from "../utils/secureStorage";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSecureItem("user"));
  const [reservasActualizadas, setReservasActualizadas] = useState(false); 

  const login = (userData) => {
    setUser(userData);
    setSecureItem("user", userData);
  };

  const logout = () => {
    setUser(null);
    removeSecureItem("user");
  };

  const notificarCambioReservas = () => {
    setReservasActualizadas((prev) => !prev);
  };

  useEffect(() => {
    const savedUser = getSecureItem("user");
    if (savedUser && !user) {
      setUser(savedUser);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        reservasActualizadas,     
        notificarCambioReservas, 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
