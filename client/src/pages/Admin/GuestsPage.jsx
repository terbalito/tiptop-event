// client/src/pages/Admin/GuestsPage.jsx
import { useEffect, useState } from "react";
import { fetchEvents, fetchInvitesByEvent, generateCards } from "../../services/api";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Select,
  MenuItem,
  Button,
  Stack,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

export default function GuestsPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [invites, setInvites] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [loadingGen, setLoadingGen] = useState(false);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await fetchEvents();
        const today = new Date();
        const upcoming = data.filter((ev) => new Date(ev.date) >= today);
        setEvents(upcoming);
        if (upcoming.length > 0) setSelectedEvent(upcoming[0].id);
      } catch (err) {
        console.error("Erreur fetchEvents:", err);
        setSnackbar({ open: true, message: "Erreur chargement événements", severity: "error" });
      }
    };
    loadEvents();
  }, []);

  const loadInvites = async () => {
    if (!selectedEvent) return;
    try {
      const data = await fetchInvitesByEvent(selectedEvent);
      setInvites(data);
    } catch (err) {
      console.error("Erreur fetchInvites:", err);
      setSnackbar({ open: true, message: "Erreur chargement invités", severity: "error" });
    }
  };

  useEffect(() => {
    loadInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent]);

  const handleGenerate = async () => {
    if (!selectedEvent) return;
    try {
      setLoadingGen(true);
      const res = await generateCards(selectedEvent);
      setSnackbar({ open: true, message: res.message || "Cartes générées", severity: "success" });
      await loadInvites(); // rafraîchir (link + cardUrl)
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Échec de la génération", severity: "error" });
    } finally {
      setLoadingGen(false);
    }
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setSnackbar({ open: true, message: "Lien copié ✅", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Impossible de copier", severity: "error" });
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6">Liste des invités</Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <Select
            value={selectedEvent}
            size="small"
            onChange={(e) => setSelectedEvent(e.target.value)}
          >
            {events.map((ev) => (
              <MenuItem key={ev.id} value={ev.id}>
                {ev.name} – {new Date(ev.date).toLocaleDateString("fr-FR")}
              </MenuItem>
            ))}
          </Select>

          <Button variant="contained" onClick={handleGenerate} disabled={!selectedEvent || loadingGen}>
            {loadingGen ? "Génération..." : "Générer QR + Cartes"}
          </Button>
        </Stack>
      </Stack>

      {invites.length === 0 ? (
        <Typography>Aucun invité pour cet événement.</Typography>
      ) : (
        <List>
          {invites.map((invite) => (
            <Box key={invite.id}>
              <ListItem alignItems="flex-start" sx={{ gap: 2 }}>
                <ListItemText
                  primary={invite.name}
                  secondary={`Email: ${invite.email || "N/A"} • Statut: ${
                    invite.scanned ? "Scanné ✅" : "Non scanné ❌"
                  }`}
                />
                {/* Aperçu carte si dispo */}
                {invite.cardUrl ? (
                  <Box sx={{ width: 160, img: { width: "100%", borderRadius: 1, border: "1px solid #eee" } }}>
                    <img src={invite.cardUrl} alt={`Carte ${invite.name}`} />
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    (Pas encore générée)
                  </Typography>
                )}

                {/* Lien + copier */}
                <Stack direction="row" alignItems="center" spacing={1}>
                  {invite.link ? (
                    <>
                      <Typography variant="body2" sx={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {invite.link}
                      </Typography>
                      <Tooltip title="Copier le lien">
                        <IconButton onClick={() => copy(invite.link)} size="small">
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </>
                  ) : (
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      Lien non généré
                    </Typography>
                  )}
                </Stack>
              </ListItem>
              <Divider />
            </Box>
          ))}
        </List>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
