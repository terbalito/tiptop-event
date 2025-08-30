import { useEffect, useState } from "react";
import { fetchEvents, fetchInvitesByEvent } from "../../services/api";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Select,
  MenuItem
} from "@mui/material";

export default function GuestsPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [invites, setInvites] = useState([]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const data = await fetchEvents();
        const today = new Date();

        // garder que les événements à venir
        const upcoming = data.filter(ev => new Date(ev.date) >= today);

        setEvents(upcoming);

        if (upcoming.length > 0) {
          setSelectedEvent(upcoming[0].id);
        }
      } catch (err) {
        console.error("Erreur fetchEvents:", err);
      }
    };

    loadEvents();
  }, []);

  useEffect(() => {
    if (!selectedEvent) return;

    const loadInvites = async () => {
      try {
        const data = await fetchInvitesByEvent(selectedEvent);
        setInvites(data);
      } catch (err) {
        console.error("Erreur fetchInvites:", err);
      }
    };

    loadInvites();
  }, [selectedEvent]);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>Liste des invités</Typography>

      {/* Sélecteur d’événement */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>Événement :</Typography>
        <Select
          value={selectedEvent}
          onChange={(e) => setSelectedEvent(e.target.value)}
          size="small"
        >
          {events.map(ev => (
            <MenuItem key={ev.id} value={ev.id}>
              {ev.name} – {new Date(ev.date).toLocaleDateString("fr-FR")}
            </MenuItem>
          ))}
        </Select>
      </Box>

      {/* Liste des invités */}
      {invites.length === 0 ? (
        <Typography>Aucun invité pour cet événement.</Typography>
      ) : (
        <List>
          {invites.map(invite => (
            <Box key={invite.id}>
              <ListItem>
                <ListItemText
                  primary={invite.name}
                  secondary={`Email: ${invite.email || "N/A"} • Statut: ${
                    invite.scanned ? "Scanné ✅" : "Non scanné ❌"
                  }`}
                />
              </ListItem>
              <Divider />
            </Box>
          ))}
        </List>
      )}
    </Paper>
  );
}
