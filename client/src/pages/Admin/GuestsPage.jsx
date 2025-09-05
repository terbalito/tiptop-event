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
  Chip,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

export default function GuestsPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [invites, setInvites] = useState([]);
  const [adminTokens, setAdminTokens] = useState({});
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

   // Charger les tokens depuis le localStorage au démarrage
  useEffect(() => {
    const savedTokens = localStorage.getItem(`adminTokens_${selectedEvent}`);
    if (savedTokens) {
      setAdminTokens(JSON.parse(savedTokens));
    }
  }, [selectedEvent]);

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
      
      // Stocker les tokens admin dans le state et localStorage
      const tokens = {};
      res.invites.forEach(invite => {
        tokens[invite.id] = invite.adminToken;
      });
      setAdminTokens(tokens);
      
      // Sauvegarder dans localStorage
      localStorage.setItem(`adminTokens_${selectedEvent}`, JSON.stringify(tokens));
      
      setSnackbar({ open: true, message: res.message || "Cartes générées", severity: "success" });
      await loadInvites();
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Échec de la génération", severity: "error" });
    } finally {
      setLoadingGen(false);
    }
  };
  


  const downloadPdf = (inviteId) => {
    const token = adminTokens[inviteId];
    if (!token) {
      setSnackbar({ open: true, message: "Générez d'abord les invitations pour avoir le PDF", severity: "warning" });
      return;
    }
    
    const url = `http://localhost:4000/api/invites/${selectedEvent}/${inviteId}/pdf?t=${token}`;
    window.open(url, "_blank");
  };



  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setSnackbar({ open: true, message: "Lien copié ✅", severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Impossible de copier", severity: "error" });
    }
  };

  const downloadImage = (cardUrl, name) => {
    if (!cardUrl) return;
    
    // Convertir l'URL relative en URL absolue
    const absoluteUrl = `http://localhost:4000${cardUrl}`;
    const downloadUrl = `http://localhost:4000/download/${cardUrl.split('/').slice(2).join('/')}`;
    
    // Ouvrir dans un nouvel onglet pour visualisation
    window.open(absoluteUrl, '_blank');
    
    // Téléchargement automatique
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${name}_invitation.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

const viewInvitationPage = (invite) => {
  if (!invite.id || !selectedEvent) return;

  // ⚡ Inclure eventId dans l’URL
  const frontendUrl = `${window.location.origin}/invite/${selectedEvent}/${invite.id}?admin=true`;
  window.open(frontendUrl, "_blank");
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
                  secondary={
                    <Box>
                      <div>Email: {invite.email || "N/A"}</div>
                      <div>Téléphone: {invite.phone || "N/A"}</div>
                      <div>Table: {invite.tableNumber || "N/A"}</div>
                      <Chip 
                        label={invite.scanned ? "Scanné ✅" : "Non scanné ❌"} 
                        size="small" 
                        color={invite.scanned ? "success" : "default"}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  }
                />
                
                {/* Actions */}
                <Stack direction="column" spacing={1} alignItems="center">
                  {invite.cardUrl ? (
                    <>
                      <Tooltip title="Voir l'invitation">
                        <IconButton onClick={() => viewInvitationPage(invite)} color="primary">
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Télécharger PNG">
                        <IconButton onClick={() => downloadImage(invite.cardUrl, invite.name)} color="secondary">
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Télécharger PDF">
                        <IconButton onClick={() => downloadPdf(invite.id)} color="primary">
                          <PictureAsPdfIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  ) : (
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      (Pas générée)
                    </Typography>
                  )}
                </Stack>

                {/* Lien + copier */}
                <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 300 }}>
                  {invite.link ? (
                    <>
                      <Typography variant="body2" sx={{ 
                        maxWidth: 250, 
                        overflow: "hidden", 
                        textOverflow: "ellipsis", 
                        whiteSpace: "nowrap" 
                      }}>
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