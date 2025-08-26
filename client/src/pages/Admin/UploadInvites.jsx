import React, { useState } from "react";
import {
  Box, Button, Typography, CircularProgress, Snackbar, Alert,
  Paper, useTheme, Fade
} from "@mui/material";
import { CloudUpload, Description } from "@mui/icons-material";
import axios from "../../services/api";

const UploadInvites = ({ eventId }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [fileName, setFileName] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Vérification du type de fichier
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      setSnackbar({ open: true, message: "Veuillez sélectionner un fichier Excel (.xlsx ou .xls)", severity: "error" });
      return;
    }

    setFileName(file.name);
    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await axios.post(`/invites/upload/${eventId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSnackbar({ open: true, message: res.data.message || "Fichier uploadé avec succès", severity: "success" });
    } catch (err) {
      console.error(err);
      setSnackbar({ 
        open: true, 
        message: err.response?.data?.message || "Erreur lors de l'upload du fichier", 
        severity: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper 
      sx={{ 
        p: 3, 
        mt: 3,
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(145deg, #1a1a1a, #2d2d2d)' 
          : 'linear-gradient(145deg, #ffffff, #f0f0f0)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        borderRadius: '12px',
        border: `1px solid ${theme.palette.divider}`
      }}
    >
      <Typography 
        variant="h6" 
        gutterBottom 
        sx={{ 
          display: 'flex', 
          alignItems: 'center',
          fontWeight: 600,
          color: theme.palette.primary.main
        }}
      >
        <Description sx={{ mr: 1 }} /> Importer des invités
      </Typography>

      <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
        Téléchargez un fichier Excel (.xlsx ou .xls) contenant la liste de vos invités
      </Typography>

      <input
        type="file"
        id={`excel-upload-${eventId}`}
        accept=".xlsx, .xls"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <label htmlFor={`excel-upload-${eventId}`}>
          <Button 
            variant="contained" 
            component="span" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <CloudUpload />}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
              }
            }}
          >
            {loading ? "Traitement..." : "Choisir un fichier"}
          </Button>
        </label>

        {fileName && (
          <Fade in={!!fileName}>
            <Typography 
              variant="body2" 
              sx={{ 
                fontStyle: 'italic',
                color: theme.palette.success.main
              }}
            >
              {fileName}
            </Typography>
          </Fade>
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert 
          severity={snackbar.severity} 
          sx={{ 
            borderRadius: '8px',
            fontWeight: 500
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default UploadInvites;