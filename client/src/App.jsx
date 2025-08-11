import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Admin/Dashboard';
import Login from './pages/Login';

function App() {
  const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />}
      />
      <Route
        path="/dashboard"
        element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
      />
      <Route path="/logout" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
