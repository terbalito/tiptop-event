import { useEffect, useState } from "react";
import {
  Box, Paper, Typography, List, ListItem, ListItemText, Divider, Chip
} from "@mui/material";
import { Event as EventIcon, LocationOn as LocationIcon, CalendarToday as DateIcon, Group as GroupIcon } from "@mui/icons-material";
import { fetchInvitesByEvent } from "../../services/api";
import UploadInvites from "./UploadInvites";

export default function InvitationList({ events }) {
  const [inviteCounts, setInviteCounts] = useState({});

  const loadInviteCounts = async () => {
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
  };

  useEffect(() => {
    if (events.length > 0) loadInviteCounts();
  }, [events]);

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
        <EventIcon sx={{ mr: 1 }} /> Mes événements
      </Typography>

      {events.length === 0 ? (
        <Typography variant="body1" sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
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
                  backgroundColor: "rgba(0,0,0,0.03)",
                  transition: "all 0.2s ease",
                  "&:hover": { transform: "translateY(-2px)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }
                }}
              >
                <Box sx={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
                  <ListItemText
                    primary={<Typography variant="h6" sx={{ fontWeight: 600 }}>{ev.name}</Typography>}
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                          <DateIcon sx={{ fontSize: 18, mr: 1, color: "primary.main" }} />
                          <Typography variant="body2">
                            {new Date(ev.date).toLocaleDateString("fr-FR", {
                              weekday: "long", year: "numeric", month: "long", day: "numeric"
                            })}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <LocationIcon sx={{ fontSize: 18, mr: 1, color: "primary.main" }} />
                          <Typography variant="body2">{ev.location}</Typography>
                        </Box>
                      </Box>
                    }
                  />
                  <Chip label="Actif" color="primary" variant="outlined" size="small" />
                </Box>

                {/* Upload + compteur */}
                <Box sx={{ mt: 2, width: "100%" }}>
                  <UploadInvites eventId={ev.id} onUploadSuccess={loadInviteCounts} />
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
  );
}
