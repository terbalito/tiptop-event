import { useEffect, useState } from "react";
import {
  Box, Paper, TextField, Button, Typography, Snackbar, Alert,
  List, ListItem, ListItemText, Divider, Stack
} from "@mui/material";
import Layout from "../../components/Layout";
import { createEvent, fetchEvents } from "../../services/api";
import UploadInvites from "./UploadInvites"; // 👈 import du composant

export default function Dashboard() {
  const [form, setForm] = useState({ name: "", date: "", location: "" });
  const [events, setEvents] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const loadEvents = async () => {
    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch (e) {
      setSnackbar({ open: true, message: "Erreur de chargement des événements", severity: "error" });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.date || !form.location) {
      setSnackbar({ open: true, message: "Tous les champs sont requis", severity: "error" });
      return;
    }
    try {
      await createEvent(form);
      setSnackbar({ open: true, message: "Événement créé ✅", severity: "success" });
      setForm({ name: "", date: "", location: "" });
      loadEvents();
    } catch (e) {
      setSnackbar({ open: true, message: "Création impossible (auth ?)", severity: "error" });
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <Layout>
      <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
        {/* Formulaire */}
        <Paper sx={{ p: 3, flex: 1, minWidth: 320 }}>
          <Typography variant="h6" gutterBottom>Créer un événement</Typography>
          <Box component="form" onSubmit={handleCreate}>
            <TextField
              label="Nom de l'événement"
              name="name"
              value={form.name}
              onChange={handleChange}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Date"
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Lieu"
              name="location"
              value={form.location}
              onChange={handleChange}
              fullWidth
              sx={{ mb: 2 }}
            />
            <Button type="submit" variant="contained">Créer</Button>
          </Box>
        </Paper>

        {/* Liste des événements */}
        <Paper sx={{ p: 3, flex: 1 }}>
          <Typography variant="h6" gutterBottom>Vos événements</Typography>
          <List dense>
            {events.map((ev) => (
              <Box key={ev.id} sx={{ mb: 2 }}>
                <ListItem>
                  <ListItemText
                    primary={ev.name}
                    secondary={`Date: ${ev.date} • Lieu: ${ev.location}`}
                  />
                </ListItem>

                {/* 👇 Ajout du bouton Upload pour cet event */}
                <Box sx={{ pl: 2, pb: 1 }}>
                  <UploadInvites eventId={ev.id} />
                </Box>

                <Divider />
              </Box>
            ))}
            {events.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Aucun événement pour le moment.
              </Typography>
            )}
          </List>
        </Paper>
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Layout>
  );
}
