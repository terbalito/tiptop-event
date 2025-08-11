// src/components/Layout.js
import { Box, AppBar, Toolbar, Typography } from '@mui/material';
import Sidebar from '../components/Sidebar';

const Layout = ({ children }) => {
  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" color="primary" sx={{ ml: 30 }}>
          <Toolbar>
            <Typography variant="h6" component="div">
              Dashboard
            </Typography>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
