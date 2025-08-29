import { useEffect, useState } from "react";
import {
  Box, Paper, TextField, Button, Typography, Snackbar, Alert,
  List, ListItem, ListItemText, Divider, Stack, Chip, Container,
  useTheme, useMediaQuery
} from "@mui/material";
import {
  Add as AddIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
  CalendarToday as DateIcon,
  Group as GroupIcon
} from "@mui/icons-material";
import Layout from "../../components/Layout";
import { createEvent, fetchEvents, fetchInvitesByEvent } from "../../services/api";
import UploadInvites from "./UploadInvites";

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [form, setForm] = useState({ name: "", date: "", location: "" });
  const [events, setEvents] = useState([]);
  const [inviteCounts, setInviteCounts] = useState({});
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

  const loadInviteCounts = async () => {
    try {
      const counts = {};
      for (const ev of events) {
        try {
          const invites = await fetchInvitesByEvent(ev.id);
          counts[ev.id] = invites.length;
        } catch {
          counts[ev.id] = 0;
        }
      }
      setInviteCounts(counts);
    } catch (err) {
      console.error("Erreur chargement des invités:", err);
    }
  };

  // Charger les compteurs après le chargement des événements
  useEffect(() => {
    if (events.length > 0) {
      loadInviteCounts();
    }
  }, [events]);

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
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
          Dashboard Événements
        </Typography>

        {/* Formulaire de création */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <AddIcon sx={{ mr: 1 }} /> Créer un nouvel événement
          </Typography>
          <Box component="form" onSubmit={handleCreate} sx={{ mt: 2 }}>
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

        {/* Liste des événements */}
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <EventIcon sx={{ mr: 1 }} /> Mes événements
          </Typography>

          {events.length === 0 ? (
            <Typography variant="body1" sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
              Aucun événement créé pour le moment
            </Typography>
          ) : (
            <List>
              {events.map((ev) => (
                <Box key={ev.id}>
                  <ListItem
                    sx={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                      p: 2,
                      mb: 2,
                      borderRadius: "12px",
                      backgroundColor:
                        theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.03)",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <ListItemText
                        primary={
                          <Typography
                            variant="h6"
                            component="div"
                            sx={{ fontWeight: 600 }}
                          >
                            {ev.name}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                mb: 0.5,
                              }}
                            >
                              <DateIcon
                                sx={{
                                  fontSize: 18,
                                  mr: 1,
                                  color: theme.palette.primary.main,
                                }}
                              />
                              <Typography variant="body2" component="span">
                                {new Date(ev.date).toLocaleDateString("fr-FR", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </Typography>
                            </Box>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <LocationIcon
                                sx={{
                                  fontSize: 18,
                                  mr: 1,
                                  color: theme.palette.primary.main,
                                }}
                              />
                              <Typography variant="body2" component="span">
                                {ev.location}
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />

                      <Chip
                        label="Actif"
                        color="primary"
                        variant="outlined"
                        size="small"
                        sx={{ ml: 2 }}
                      />
                    </Box>

                    {/* Bouton d'upload + compteur */}
                    <Box sx={{ mt: 2, width: "100%" }}>
                      <UploadInvites eventId={ev.id} onUploadSuccess={loadInviteCounts} />

                      {/* Compteur d'invités */}
                      <Chip
                        icon={<GroupIcon />}
                        label={`${inviteCounts[ev.id] || 0} invités`}
                        color="secondary"
                        variant="outlined"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </ListItem>
                  <Divider sx={{ my: 2 }} />
                </Box>
              ))}
            </List>
          )}
        </Paper>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  );
}