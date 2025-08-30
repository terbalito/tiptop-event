import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Admin/Dashboard';
import Login from './pages/Login';
import GuestsPage from './pages/Admin/GuestsPage';
import Layout from './components/Layout';

// Composant de route privée
const PrivateRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div>Chargement...</div>;

  return user ? <Outlet /> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Privées */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/guests" element={<GuestsPage />} />
          </Route>
        </Route>

        {/* Redirections */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
