// src/components/Sidebar.js
import { Drawer, List, ListItemButton, ListItemText } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/api";

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();                    // backend: clear cookie si utilisé
    localStorage.removeItem("isAuthenticated"); // ton guard actuel
    localStorage.removeItem("authToken");       // si tu en ajoutes plus tard
    navigate("/login");
  };

  return (
    <Drawer variant="permanent" anchor="left">
      <List sx={{ width: 240 }}>
        <ListItemButton onClick={() => navigate("/dashboard")}>
          <ListItemText primary="Dashboard" />
        </ListItemButton>
        <ListItemButton onClick={handleLogout}>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>
    </Drawer>
  );
};

export default Sidebar;
