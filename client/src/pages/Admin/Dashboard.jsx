import { useEffect, useState } from "react";
import { Container, Typography, Snackbar, Alert } from "@mui/material";
import Layout from "../../components/Layout";
import { fetchEvents } from "../../services/api";
import CreateEvent from "./CreateEvent";
import InvitationList from "./InvitationList";

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const loadEvents = async () => {
    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch {
      setSnackbar({ open: true, message: "Erreur de chargement des événements", severity: "error" });
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Layout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
          Dashboard Événements
        </Typography>

        <CreateEvent onEventCreated={loadEvents} onSnackbar={showSnackbar} />
        <InvitationList events={events} />

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
