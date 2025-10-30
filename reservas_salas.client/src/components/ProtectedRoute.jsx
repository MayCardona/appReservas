/**
 * ProtectedRoute
 * - Componente que protege rutas que requieren autenticación.
 * - Si no hay usuario en el contexto de Auth, redirige a /login.
 * - Si existe usuario, renderiza <Outlet/> para las rutas hijas.
 *
 * Uso:
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/reservas" element={<ReservasPage />} />
 * </Route>
 *
 */
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { user } = useAuth();

  // Si no hay usuario autenticado, redirige al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Usuario autenticado: renderiza las rutas hijas definidas con <Outlet/>
  return <Outlet />;
}
