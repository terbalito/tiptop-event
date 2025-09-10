import React from "react";
import { Container, Typography, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function ErrorPage({ message }) {
  const navigate = useNavigate();
  return (
    <Container sx={{ py: 6, textAlign: "center" }}>
      <Typography variant="h4" color="error" sx={{ mb: 3 }}>
        Oups ! Une erreur est survenue
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        {message || "La page demandée est introuvable."}
      </Typography>
      <Button variant="contained" onClick={() => navigate(-1)}>
        Retour
      </Button>
    </Container>
  );
}
