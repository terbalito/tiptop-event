import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { fetchControllers, createController, fetchEvents, updateController, deleteController } from "../../services/api";


export default function ControllersPage() {
  const [controllers, setControllers] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [events, setEvents] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [editId, setEditId] = useState(null);


  // Formulaire modal
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [eventId, setEventId] = useState("");

  // Charger events au montage
  useEffect(() => {
    fetchEvents()
      .then(setEvents)
      .catch(() =>
        setSnackbar({ open: true, message: "Erreur chargement événements", severity: "error" })
      );
  }, []);

  // Charger contrôleurs
  const loadControllers = async () => {
    try {
      const data = await fetchControllers();
      setControllers(data);
    } catch {
      setSnackbar({ open: true, message: "Erreur chargement contrôleurs", severity: "error" });
    }
  };

  useEffect(() => {
    loadControllers();
  }, []);

  // Génération auto du mot de passe
  const generatePassword = () => {
    const newPass = Math.random().toString(36).slice(-8);
    setPassword(newPass);
  };

  // Création contrôleur
  // const handleSave = async () => {
  //   if (!email || !password || !eventId) {
  //     return setSnackbar({ open: true, message: "Remplissez tous les champs", severity: "warning" });
  //   }

  //   try {
  //     await createController({ username: email, password, eventId });
  //     setSnackbar({
  //       open: true,
  //       message: `Contrôleur ${email} créé (MDP: ${password})`,
  //       severity: "success",
  //     });
  //     setOpenModal(false);
  //     setEmail("");
  //     setPassword("");
  //     setEventId("");
  //     loadControllers();
  //   } catch (err) {
  //     setSnackbar({ open: true, message: "Erreur création contrôleur", severity: "error" });
  //   }
  // };

  const handleEdit = (controller) => {
  setEmail(controller.username);
  setPassword(""); // laisser vide pour ne pas modifier
  setEventId(controller.eventId);
  setEditId(controller.id); // nouvel état
  setOpenModal(true);
};

const handleSave = async () => {
  if (!email || !eventId) return alert("Remplissez tous les champs");

  try {
    if (editId) {
      await updateController(editId, { username: email, password: password || undefined, eventId });
      setSnackbar({ open: true, message: "Contrôleur modifié", severity: "success" });
    } else {
      await createController({ username: email, password, eventId });
      setSnackbar({ open: true, message: "Contrôleur créé", severity: "success" });
    }
    setOpenModal(false);
    setEmail("");
    setPassword("");
    setEventId("");
    setEditId(null);
    loadControllers();
  } catch (err) {
    setSnackbar({ open: true, message: "Erreur sauvegarde", severity: "error" });
  }
};

const handleDelete = async (id) => {
  if (window.confirm("Supprimer ce contrôleur ?")) {
    await deleteController(id);
    setSnackbar({ open: true, message: "Contrôleur supprimé", severity: "success" });
    loadControllers();
  }
};


  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des Contrôleurs
      </Typography>

      <Button variant="contained" color="primary" onClick={() => setOpenModal(true)} sx={{ mb: 3 }}>
        ➕ Créer un contrôleur
      </Button>

      {/* Tableau contrôleurs */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Email (Identifiant)</TableCell>
            <TableCell>Mot de passe (hashé en base)</TableCell>
            <TableCell>Événement</TableCell>
            <TableCell>Créé le</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {controllers.map((c) => (
            <TableRow key={c.id}>
              <TableCell>{c.username}</TableCell>
              <TableCell>{c.password}</TableCell>
              <TableCell>{c.eventId}</TableCell>
              <TableCell>
                {c.createdAt?._seconds
                  ? new Date(c.createdAt._seconds * 1000).toLocaleString()
                  : new Date(c.createdAt).toLocaleString()}
              </TableCell>
              <TableCell>
                <Button size="small" onClick={() => handleEdit(c)}>Modifier</Button>
                <Button size="small" color="error" onClick={() => handleDelete(c.id)}>Supprimer</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>

      </Table>

      {/* Modal de création */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)}>
        <DialogTitle>Créer un contrôleur</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            label="Email (Identifiant)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button onClick={generatePassword}>Générer</Button>
          </Box>
          <FormControl fullWidth>
            <InputLabel>Événement</InputLabel>
            <Select value={eventId} onChange={(e) => setEventId(e.target.value)}>
              {events.map((event) => (
                <MenuItem key={event.id} value={event.id}>
                  {event.name || event.id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Annuler</Button>
          <Button onClick={handleSave} variant="contained">
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar feedback */}
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
