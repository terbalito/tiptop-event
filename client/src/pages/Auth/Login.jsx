// src/pages/Login.jsx
import React, { useState } from 'react';
import { TextField, Button, Snackbar, Alert, Box, Typography, Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // 👈 IMPORT

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const { login } = useAuth(); // 👈 UTILISATION

  const handleLogin = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setSnackbar({ open: true, message: 'Tous les champs sont obligatoires', severity: 'error' });
      return;
    }

    try {
      await login(trimmedEmail, trimmedPassword);
      setSnackbar({ open: true, message: 'Connexion réussie !', severity: 'success' });
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (err) {
      console.error("Erreur de connexion:", err);
      setSnackbar({ open: true, message: 'Identifiants incorrects', severity: 'error' });
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ mt: 10, p: 4 }}>
        <Typography variant="h5" align="center" gutterBottom>
          Connexion à votre espace
        </Typography>
        <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Email"
            type="email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
          />
          <TextField
            label="Mot de passe"
            type="password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
          />
          <Button type="submit" variant="contained" fullWidth>
            Se connecter
          </Button>
        </Box>
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}