import React, { useState } from 'react';
import { TextField, Button, Snackbar, Alert, Box, Typography, Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const navigate = useNavigate();


const handleLogin = async (e) => {
  e.preventDefault();

  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();

  if (!trimmedEmail || !trimmedPassword) {
    setSnackbar({ open: true, message: 'Tous les champs sont obligatoires', severity: 'error' });
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
    setSnackbar({ open: true, message: 'Connexion réussie !', severity: 'success' });

    setTimeout(() => {
      localStorage.setItem("isAuthenticated", "true");
      navigate('/dashboard');
    }, 1500);
  } catch (err) {
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

      {/* Popup */}
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
