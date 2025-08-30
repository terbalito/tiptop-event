import { useState } from "react";
import { Box, Paper, TextField, Button, Typography, Stack } from "@mui/material";
import { Add as AddIcon, Event as EventIcon } from "@mui/icons-material";
import { createEvent } from "../../services/api";

export default function CreateEvent({ onEventCreated, onSnackbar }) {
  const [form, setForm] = useState({ name: "", date: "", location: "" });

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.date || !form.location) {
      onSnackbar("Tous les champs sont requis", "error");
      return;
    }
    try {
      await createEvent(form);
      onSnackbar("Événement créé ✅", "success");
      setForm({ name: "", date: "", location: "" });
      onEventCreated(); // recharge la liste
    } catch {
      onSnackbar("Création impossible (auth ?)", "error");
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
        <AddIcon sx={{ mr: 1 }} /> Créer un nouvel événement
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        <Stack spacing={2}>
          <TextField
            name="name"
            label="Nom de l'événement"
            value={form.name}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            name="date"
            label="Date"
            type="datetime-local"
            value={form.date}
            onChange={handleChange}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            name="location"
            label="Lieu"
            value={form.location}
            onChange={handleChange}
            fullWidth
            required
          />
          <Button type="submit" variant="contained" size="large" startIcon={<EventIcon />}>
            Créer l'événement
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
