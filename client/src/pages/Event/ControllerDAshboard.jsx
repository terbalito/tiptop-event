import { useEffect, useState } from "react";
import { Container, Typography, Button, Grid, Paper } from "@mui/material";
import { fetchInvitesByEvent } from "../../services/api"; // tu dois déjà avoir cette fonction

export default function ControllerDashboard() {
  const [stats, setStats] = useState({ total: 0, scanned: 0, notScanned: 0 });
  const eventId = localStorage.getItem("eventId");

  useEffect(() => {
    const loadData = async () => {
      try {
        const guests = await fetchInvitesByEvent(eventId);

        const scanned = guests.filter(g => g.scanned).length;
        const total = guests.length;

        setStats({
          total,
          scanned,
          notScanned: total - scanned,
        });
      } catch (err) {
        console.error("Erreur chargement invités:", err);
      }
    };

    loadData();
  }, [eventId]);

  return (
    <Container sx={{ py: 6 }}>
      <Typography variant="h4" gutterBottom>Tableau de bord Contrôleur</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h6">Invités Total</Typography>
            <Typography variant="h4">{stats.total}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h6">Scannés</Typography>
            <Typography variant="h4" color="success.main">{stats.scanned}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h6">Non scannés</Typography>
            <Typography variant="h4" color="warning.main">{stats.notScanned}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Button
        variant="contained"
        color="primary"
        href="/scanner"
        sx={{ mt: 4 }}
      >
        📷 Aller au Scanner
      </Button>

      <Button
        variant="outlined"
        color="secondary"
        href="/scanner-result"
        sx={{ mt: 2, ml: 2 }}
      >
        📊 Voir les résultats
      </Button>
    </Container>
  );
}
