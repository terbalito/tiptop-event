import { useEffect, useState } from "react";
import { Container, Typography, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import { fetchInvitesByEvent } from "../../services/api";

export default function ScannerResult() {
  const [guests, setGuests] = useState([]);
  const eventId = localStorage.getItem("eventId");

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchInvitesByEvent(eventId);
        setGuests(data.filter(g => g.scanned));
      } catch (err) {
        console.error("Erreur résultats scan:", err);
      }
    };

    loadData();
  }, [eventId]);

  return (
    <Container sx={{ py: 6 }}>
      <Typography variant="h4" gutterBottom>Résultats des Scans</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nom</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Heure de scan</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {guests.map((g, i) => (
            <TableRow key={i}>
              <TableCell>{g.name}</TableCell>
              <TableCell>{g.email}</TableCell>
              <TableCell>{g.scanTime ? new Date(g.scanTime._seconds * 1000).toLocaleString() : "—"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Container>
  );
}
