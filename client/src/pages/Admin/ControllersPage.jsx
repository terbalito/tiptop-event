// client/src/pages/Admin/ControllersPage.jsx
import { useEffect, useState } from "react";
import { Container, Typography, Button, Table, TableHead, TableRow, TableCell, TableBody, Snackbar, Alert } from "@mui/material";
import { fetchControllers, createController } from "../../services/api";

export default function ControllersPage() {
  const [controllers, setControllers] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const loadControllers = async () => {
    try {
      const data = await fetchControllers();
      setControllers(data);
    } catch (err) {
      setSnackbar({ open: true, message: "Erreur chargement contrôleurs", severity: "error" });
    }
  };

  const handleCreate = async () => {
    try {
      // ✅ auto-générer login/pass (simple exemple)
      const username = `ctrl_${Date.now().toString().slice(-4)}`;
      const password = Math.random().toString(36).slice(-8);

      await createController({ username, password });
      setSnackbar({ open: true, message: `Contrôleur ${username} créé !`, severity: "success" });
      loadControllers();
    } catch (err) {
      setSnackbar({ open: true, message: "Erreur création contrôleur", severity: "error" });
    }
  };

  useEffect(() => {
    loadControllers();
  }, []);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Gestion des Contrôleurs</Typography>

      <Button variant="contained" color="primary" onClick={handleCreate} sx={{ mb: 3 }}>
        ➕ Créer un contrôleur
      </Button>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Identifiant</TableCell>
            <TableCell>Password</TableCell>
            <TableCell>Créé le</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {controllers.map((c, i) => (
            <TableRow key={i}>
              <TableCell>{c.username}</TableCell>
              <TableCell>{c.password}</TableCell>
              <TableCell>{new Date(c.createdAt).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
