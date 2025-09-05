import React, { useState } from "react";
import { QrReader } from "react-qr-reader";
import { useParams } from "react-router-dom";
import { scanInvite } from "../../services/api";

export default function Scanner() {
  const { eventId } = useParams();
  const [result, setResult] = useState("");

  const handleScan = async (data) => {
    if (data) {
      setResult(data.text || data);
      try {
        const inviteId = new URL(data).pathname.split("/").pop();
        const res = await scanInvite(eventId, inviteId);
        alert(res.message);
      } catch (err) {
        alert("Erreur scan");
      }
    }
  };

  return (
    <div>
      <h2>Scanner l’invitation</h2>
      <QrReader
        onResult={(result, error) => {
          if (!!result) handleScan(result);
          if (!!error) console.warn(error);
        }}
        style={{ width: "100%" }}
      />
      <p>Résultat: {result}</p>
    </div>
  );
}
