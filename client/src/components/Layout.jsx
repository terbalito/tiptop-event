import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sidebar from '../components/Sidebar';

const Layout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: theme.palette.background.default }}>
      <Sidebar />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          // ml: { md: '240px' },
          width: { md: `calc(100% - 240px)` },
          minHeight: '100vh',
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;