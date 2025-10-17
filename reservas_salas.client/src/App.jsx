import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import VerifyOtp from "./pages/VerifyOtp";
import Home from "./pages/Home";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import Reservas from "./pages/Reservas";


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/*Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/verify" element={<VerifyOtp />} />

          {/*Rutas protegidas con layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/reservas" element={<Reservas />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
