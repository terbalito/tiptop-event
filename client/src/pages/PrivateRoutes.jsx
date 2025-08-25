import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Ajustez le chemin

const PrivateRoute = () => {
  const { user, loading } = useAuth();

  // Ne rien afficher tant que l'état de l'authentification n'est pas chargé
  if (loading) {
    return <div>Chargement...</div>; // Ou un spinner
  }

  // Si un utilisateur est connecté, on rend les routes enfant
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;