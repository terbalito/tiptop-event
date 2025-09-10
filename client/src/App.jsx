import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// PAGES
import Dashboard from "./pages/Admin/Dashboard";
import Login from "./pages/Login";
import GuestsPage from "./pages/Admin/GuestsPage";
import Layout from "./components/Layout";
import InvitationPage from "./pages/InvitationPages";
import ControllersPage from "./pages/Admin/ControllersPage";
import ControllerLogin from "./pages/Auth/ControllerLogin";
import ScanResult from "./pages/Event/ScanResult";
import ControllerDashboard from "./pages/Event/ControllerDAshboard";
import ErrorPage from "./pages/ErrorPage";

// Composant de route privée
const PrivateRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Chargement...</div>;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ROUTES PUBLIQUES - INVITÉS */}
        <Route path="/invite/:eventId/:inviteId" element={<InvitationPage />} />

        {/* ROUTES PUBLIQUES - CONTROLLER */}
        <Route path="/controller-login" element={<ControllerLogin />} />
        <Route path="/controller-dashboard" element={<ControllerDashboard />} />
        <Route path="/scanner-result" element={<ScanResult />} />

        {/* ROUTES ADMIN (PRIVÉES) */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/guests" element={<GuestsPage />} />
            <Route path="/controllers" element={<ControllersPage />} />
          </Route>
        </Route>

        {/* LOGIN */}
        <Route path="/login" element={<Login />} />

        {/* REDIRECTION PAR DÉFAUT */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 */}
        <Route path="*" element={<ErrorPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
