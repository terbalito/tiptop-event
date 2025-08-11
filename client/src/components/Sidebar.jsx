// src/components/Sidebar.js
import { Drawer, List, ListItem, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user"); // ou sessionStorage, selon
    navigate('/login');
  };

  return (
    <Drawer variant="permanent" anchor="left">
      <List sx={{ width: 240 }}>
        <ListItem button onClick={() => navigate('/')}>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button onClick={handleLogout}>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;
