import { useEffect, useState } from "react";
import {
  Box, Paper, TextField, Button, Typography, Snackbar, Alert,
  List, ListItem, ListItemText, Divider, Stack, Chip, IconButton,
  useTheme, useMediaQuery, Container
} from "@mui/material";
import {
  Add as AddIcon,
  Upload as UploadIcon,
  Event as EventIcon,
  LocationOn as LocationIcon,
  CalendarToday as DateIcon
} from "@mui/icons-material";
import Layout from "../../components/Layout";
import { createEvent, fetchEvents } from "../../services/api";
import UploadInvites from "./UploadInvites";

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
      <Container maxWidth="xl" sx={{ 
        p: { xs: 2, md: 3 }, 
        minHeight: '100vh',
        backgroundColor: theme.palette.background.default,
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: 700, 
            mb: 4,
            textAlign: 'center',
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Gestion des Événements
        </Typography>
        
        <Stack 
          direction={{ xs: "column", lg: "row" }} 
          spacing={3} 
          alignItems="flex-start"
          justifyContent="center"
        >
          {/* Formulaire de création */}
          <Paper 
            sx={{ 
              p: 3, 
              flex: 1, 
              minWidth: 300, 
              maxWidth: { lg: '400px' },
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(145deg, #1a1a1a, #2d2d2d)' 
                : 'linear-gradient(145deg, #ffffff, #f0f0f0)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              borderRadius: '16px',
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                fontWeight: 600,
                color: theme.palette.primary.main
              }}
            >
              <AddIcon sx={{ mr: 1 }} /> Créer un événement
            </Typography>
            
            <Box component="form" onSubmit={handleCreate}>
              <TextField
                label="Nom de l'événement"
                name="name"
                value={form.name}
                onChange={handleChange}
                fullWidth
                sx={{ mb: 2 }}
                InputProps={{
                  sx: { borderRadius: '12px' }
                }}
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
                InputProps={{
                  sx: { borderRadius: '12px' }
                }}
              />
              <TextField
                label="Lieu"
                name="location"
                value={form.location}
                onChange={handleChange}
                fullWidth
                sx={{ mb: 2 }}
                InputProps={{
                  sx: { borderRadius: '12px' }
                }}
              />
              <Button 
                type="submit" 
                variant="contained" 
                fullWidth
                sx={{ 
                  borderRadius: '12px', 
                  py: 1.5,
                  fontWeight: 600,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
                }}
              >
                Créer l'événement
              </Button>
            </Box>
          </Paper>

          {/* Liste des événements */}
          <Paper 
            sx={{ 
              p: 3, 
              flex: 2,
              minWidth: 300,
              maxWidth: { lg: '800px' },
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(145deg, #1a1a1a, #2d2d2d)' 
                : 'linear-gradient(145deg, #ffffff, #f0f0f0)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              borderRadius: '16px',
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                fontWeight: 600,
                color: theme.palette.primary.main
              }}
            >
              <EventIcon sx={{ mr: 1 }} /> Vos événements
            </Typography>
            
            {events.length === 0 ? (
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  py: 6,
                  color: theme.palette.text.secondary
                }}
              >
                <EventIcon sx={{ fontSize: 64, opacity: 0.5, mb: 2 }} />
                <Typography variant="body1">
                  Aucun événement pour le moment.
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Créez votre premier événement en utilisant le formulaire.
                </Typography>
              </Box>
            ) : (
              <List>
                {events.map((ev) => (
                  <Box key={ev.id}>
                    <ListItem
                      sx={{
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        p: 2,
                        mb: 2,
                        borderRadius: '12px',
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : 'rgba(0, 0, 0, 0.03)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }
                      }}
                    >
                      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <ListItemText
                          primary={
                            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                              {ev.name}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <DateIcon sx={{ fontSize: 18, mr: 1, color: theme.palette.primary.main }} />
                                <Typography variant="body2" component="span">
                                  {new Date(ev.date).toLocaleDateString('fr-FR', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LocationIcon sx={{ fontSize: 18, mr: 1, color: theme.palette.primary.main }} />
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
                      
                      {/* Bouton d'upload */}
                      <Box sx={{ mt: 2, width: '100%' }}>
                        <UploadInvites eventId={ev.id} />
                      </Box>
                    </ListItem>
                    <Divider sx={{ my: 2 }} />
                  </Box>
                ))}
              </List>
            )}
          </Paper>
        </Stack>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={2500}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert 
            severity={snackbar.severity} 
            sx={{ 
              width: "100%",
              borderRadius: '12px',
              fontWeight: 500
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  );
}