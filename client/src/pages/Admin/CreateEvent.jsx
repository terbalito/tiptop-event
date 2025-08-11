import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { createEvent, fetchEvents } from '../../services/api';

const CreateEvent = () => {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [events, setEvents] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const token = localStorage.getItem('authToken');

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await createEvent({ name, date, location }, token);
      setSnackbar({ open: true, message: 'Evénement créé avec succès !', severity: 'success' });
      setName('');
      setDate('');
      setLocation('');
      loadEvents();
    } catch (err) {
      setSnackbar({ open: true, message: 'Erreur lors de la création', severity: 'error' });
    }
  };

  const loadEvents = async () => {
    try {
      const data = await fetchEvents(token);
      setEvents(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <Container maxWidth="md">
      <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
        Créer un Evénement
      </Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleCreate}>
          <TextField
            label="Nom de l'événement"
            fullWidth
            sx={{ mb: 2 }}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="Date"
            type="date"
            fullWidth
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <TextField
            label="Lieu"
            fullWidth
            sx={{ mb: 2 }}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <Button variant="contained" type="submit">Créer</Button>
        </form>
      </Paper>

      <Typography variant="h5" gutterBottom>
        Vos Evénements
      </Typography>
      <List>
        {events.map((event) => (
          <ListItem key={event.id} divider>
            <ListItemText
              primary={`${event.name} - ${event.date}`}
              secondary={`Lieu: ${event.location}`}
            />
          </ListItem>
        ))}
      </List>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CreateEvent;
