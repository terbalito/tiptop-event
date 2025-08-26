import React, { useState } from "react";
import { Box, Button, Typography, CircularProgress, Snackbar, Alert } from "@mui/material";
import axios from "../../services/api";

const UploadInvites = ({ eventId }) => {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await axios.post(`/invites/upload/${eventId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSnackbar({ open: true, message: res.data.message, severity: "success" });
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Erreur lors de l’upload", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Importer des invités par Excel
      </Typography>

      <input
        type="file"
        id="excel-upload"
        accept=".xlsx, .xls"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <label htmlFor="excel-upload">
        <Button variant="contained" component="span" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Choisir un fichier Excel"}
        </Button>
      </label>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default UploadInvites;
