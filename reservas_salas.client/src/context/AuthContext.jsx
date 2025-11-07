import { createContext, useContext, useState, useEffect, useRef } from "react";
import { setSecureItem, getSecureItem, removeSecureItem } from "../utils/secureStorage";

const AuthContext = createContext();

const SessionTimeout = 30 * 60 * 1000; // 30 minutos

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getSecureItem("user"));
  const [reservasActualizadas, setReservasActualizadas] = useState(false);
  const timeoutRef = useRef(null);

  const startSessionTimer = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      logout();
      alert("Sesión expirada por inactividad.");
      
    }, SessionTimeout);
  };

  const login = (userData) => {
    setUser(userData);
    setSecureItem("user", userData);
    resetInactivityTimer();
  };

  const logout = () => {
    setUser(null);
    removeSecureItem("user");
    clearTimeout(timeoutRef.current);
  };

  const resetInactivityTimer = () => {
    clearTimeout(timeoutRef.current);
    if (user) {
      timeoutRef.current = setTimeout(() => {
        logout();
      }, SessionTimeout);
    }
  };



  useEffect(() => {
    const savedUser = getSecureItem("user");
    if (savedUser && !user) {
      setUser(savedUser);
    }
  }, []);

  useEffect(() => {
    const savedUser = getSecureItem("user");
    if (savedUser) {
      setUser(savedUser);
      resetInactivityTimer();
    }
  }, []);

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll"];
    const handleActivity = () => resetInactivityTimer();

    if (user) {
      events.forEach((event) => window.addEventListener(event, handleActivity));
      resetInactivityTimer();
    }

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      clearTimeout(SessionTimeout.current);
    };
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        reservasActualizadas,     
        setReservasActualizadas, 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
