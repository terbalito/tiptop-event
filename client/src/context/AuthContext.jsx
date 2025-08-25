// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebase"; // Ajustez le chemin si nécessaire
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, getIdToken } from "firebase/auth";
import api from "../services/api"; // 👈 Importez l'instance d'Axios configurée

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await getIdToken(userCredential.user, true);
      // Utilisez l'instance 'api' importée
      await api.post("/auth/login", { idToken }); // 👈 MODIFICATION : utilisez `api`
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Utilisez l'instance 'api' importée
      await api.post("/auth/logout", {}); // 👈 MODIFICATION : utilisez `api`
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};