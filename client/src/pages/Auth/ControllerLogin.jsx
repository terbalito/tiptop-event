import { useState } from "react";
import { Container, TextField, Button, Typography, Snackbar, Alert } from "@mui/material";
import { loginController } from "../../services/api";

export default function ControllerLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const handleLogin = async () => {
    try {
      const { token, eventId } = await loginController({ username, password });
      localStorage.setItem("controllerToken", token);
      localStorage.setItem("eventId", eventId);
      window.location.href = "/controller-dashboard"; // page scan
    } catch (err) {
      setSnackbar({ open: true, message: "Identifiants invalides", severity: "error" });
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>Connexion Contrôleur</Typography>
      <TextField fullWidth margin="normal" label="Identifiant" value={username} onChange={e => setUsername(e.target.value)} />
      <TextField fullWidth margin="normal" label="Mot de passe" type="password" value={password} onChange={e => setPassword(e.target.value)} />
      <Button variant="contained" onClick={handleLogin} sx={{ mt: 2 }}>Se connecter</Button>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
}
