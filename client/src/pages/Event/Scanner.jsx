import React, { useState, useEffect } from "react";
import { QrReader } from "react-qr-reader";
import { io } from "socket.io-client";
import axios from "axios";
import { Container, Typography, Alert } from "@mui/material";

// On récupère l'URL du backend depuis les variables d'environnement
const BACKEND_BASE = import.meta.env.VITE_API_URL;

// Initialisation socket avec l’URL dynamique
const socket = io(BACKEND_BASE, { withCredentials: true });

export default function Scanner() {
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    socket.on("scanResult", (data) => {
      console.log("Résultat socket:", data);
      setStatus(data.status);
    });

    return () => socket.off("scanResult");
  }, []);

  const handleScan = async (value) => {
    if (value) {
      setResult(value);

      try {
        const parts = value.split("/");
        const eventId = parts[parts.length - 2];
        const inviteId = parts[parts.length - 1];

        await axios.post(
          `${BACKEND_BASE}/api/scan`,
          { eventId, inviteId },
          { withCredentials: true }
        );

      } catch (err) {
        console.error("Erreur scan:", err);
      }
    }
  };

  return (
    <Container sx={{ py: 6 }}>
      <Typography variant="h4" gutterBottom>
        Scanner une invitation
      </Typography>

      <QrReader
        constraints={{ facingMode: "environment" }}
        onResult={(res, err) => {
          if (!!res) handleScan(res?.text);
          if (!!err) console.warn(err);
        }}
        style={{ width: "100%" }}
      />

      <Typography sx={{ mt: 2 }}>Résultat brut : {result}</Typography>

      {status && (
        <Alert
          severity={
            status === "scanSuccess"
              ? "success"
              : status === "alreadyScanned"
              ? "warning"
              : "error"
          }
          sx={{ mt: 2 }}
        >
          {status === "scanSuccess" && "✔️ Scan validé"}
          {status === "alreadyScanned" && "⚠️ Déjà scanné"}
          {status === "invalidCode" && "❌ Code invalide"}
        </Alert>
      )}
    </Container>
  );
}
