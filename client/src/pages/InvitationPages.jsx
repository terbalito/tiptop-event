import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Button,
  Stack,
  Snackbar,
  Alert,
  Divider,
  Card,
  CardContent,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CelebrationIcon from "@mui/icons-material/Celebration";
import { fetchInviteById, registerDeviceForInvite } from "../services/api";

const BACKEND_BASE = "http://localhost:4000";

function generateDeviceId() {
  try {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
  } catch (e) {}
  return `dv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateClientToken(deviceId) {
  return btoa(deviceId + ':' + Date.now());
}

export default function InvitationPage() {
  const { eventId, inviteId } = useParams();
  const [searchParams] = useSearchParams();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clientToken, setClientToken] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [error, setError] = useState(null);

  const isAdminView = searchParams.get("admin") === "true";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchInviteById(eventId, inviteId);

        if (!data) {
          setError("Invitation introuvable");
          return;
        }

        setInvite(data);

        // Gestion des tokens pour les invités
        if (!isAdminView) {
          let deviceId = localStorage.getItem("deviceId_for_invite");
          if (!deviceId) {
            deviceId = generateDeviceId();
            localStorage.setItem("deviceId_for_invite", deviceId);
          }

          const token = generateClientToken(deviceId);
          setClientToken(token);
          localStorage.setItem(`clientToken_${inviteId}`, token);

          try {
            await registerDeviceForInvite(eventId, inviteId, deviceId);
          } catch (err) {
            console.warn("Erreur non bloquante lors de l'enregistrement du device:", err.message);
          }
        } else {
          const adminToken = searchParams.get("t");
          setClientToken(adminToken);
        }

      } catch (err) {
        console.error("Erreur fetchInviteById:", err);
        setError("Impossible de charger l'invitation. Veuillez réessayer plus tard.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [eventId, inviteId, searchParams, isAdminView]);

  // Affichage chargement
  if (loading) {
    return <Container sx={{ py: 6 }}>Chargement...</Container>;
  }

  // Affichage erreur
  if (error) {
    return (
      <Container sx={{ py: 6, textAlign: "center" }}>
        <Typography variant="h4" color="error" sx={{ mb: 2 }}>
          Oups !
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          {error}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Réessayer
        </Button>
      </Container>
    );
  }

  const isEventPassed = invite.event ? new Date(invite.event.date) < new Date() : false;
  const qrValue = invite.link || `${window.location.origin}/invite/${invite.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrValue)}`;

  const handleDownloadPng = () => {
    if (!invite.cardUrl) {
      setSnackbar({ open: true, message: "Carte non générée encore", severity: "warning" });
      return;
    }
    const url = `${BACKEND_BASE}${invite.cardUrl}`;
    window.open(url, "_blank");
  };

  const handleDownloadPdf = () => {
    if (isEventPassed) {
      setSnackbar({ open: true, message: "L'événement est terminé, le téléchargement n'est plus disponible", severity: "warning" });
      return;
    }

    const token = isAdminView ? searchParams.get("t") : clientToken;

    if (!token || token === "null") {
      setSnackbar({ open: true, message: isAdminView ? "Token manquant pour le PDF" : "Préparation du téléchargement...", severity: "warning" });

      if (!isAdminView) {
        const deviceId = localStorage.getItem("deviceId_for_invite");
        if (deviceId) {
          const newToken = generateClientToken(deviceId);
          setClientToken(newToken);
          localStorage.setItem(`clientToken_${inviteId}`, newToken);

          setTimeout(() => {
            const url = `${BACKEND_BASE}/api/invites/${invite.eventId}/${invite.id}/pdf?t=${newToken}`;
            window.open(url, "_blank");
          }, 500);
        }
      }
      return;
    }

    const url = `${BACKEND_BASE}/api/invites/${invite.eventId}/${invite.id}/pdf?t=${token}`;
    window.open(url, "_blank");
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Card elevation={8} sx={{ borderRadius: 4, overflow: "hidden", background: "linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%)" }}>
        <CardContent sx={{ p: 4, textAlign: "center" }}>
          <CelebrationIcon sx={{ fontSize: 60, color: "gold", mb: 2 }} />

          {isEventPassed && (
            <Box sx={{ backgroundColor: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: 2, p: 2, mb: 3 }}>
              <Typography variant="body2" color="#856404" align="center">
                ⚠️ Cet événement est terminé
              </Typography>
            </Box>
          )}

          <Typography variant="h4" fontWeight={700}>{invite.event?.name || "Invitation"}</Typography>
          <Typography variant="subtitle1" sx={{ mb: 3, color: "text.secondary" }}>
            {invite.event ? (
              <>
                {new Date(invite.event.date).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })} • {invite.event.location}
              </>
            ) : null}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h5" fontWeight={600} sx={{ mb: 1 }}>{invite.name}</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>{invite.email}</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>Table : {invite.tableNumber || "Non assignée"}</Typography>

          <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
            <img src={qrUrl} alt="QR Code" width={240} height={240} />
          </Box>

          <Typography variant="caption" display="block" sx={{ mb: 3, wordBreak: "break-all" }}>{invite.link}</Typography>

          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="contained" startIcon={<OpenInNewIcon />} onClick={() => window.open(qrValue, "_blank")}>Ouvrir</Button>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadPng}>PNG</Button>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleDownloadPdf} disabled={isEventPassed}>PDF</Button>
          </Stack>
        </CardContent>
      </Card>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snackbar.severity} sx={{ width: "100%" }}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
}
