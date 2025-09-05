// Sidebar.jsx (Corrected Code)
import React, { useState } from "react";
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  useMediaQuery,
  useTheme,
  IconButton,
  Divider
} from "@mui/material"; // 👈 'BadgeIcon' has been removed
import {
  Dashboard as DashboardIcon,
  ExitToApp as LogoutIcon,
  Menu as MenuIcon,
  Close as CloseIcon,
  People as PeopleIcon, // This was already here
  Security as SecurityIcon // 👈 Add the missing Security icon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/api";

const Sidebar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("authToken");
      navigate("/login");
    }
  };

  const menuItems = [
    {
      text: "Dashboard",
      icon: <DashboardIcon />,
      onClick: () => navigate("/dashboard")
    },
    {
      text: "Invités",
      icon: <PeopleIcon />,
      onClick: () => navigate("/guests")
    },
    {
      text: "Contrôleurs",
      icon: <SecurityIcon />, // 👈 The icon is now available
      onClick: () => navigate("/controllers")
    },
    {
      text: "Déconnexion",
      icon: <LogoutIcon />,
      onClick: handleLogout
    }
  ];

  const drawerContent = (
    <Box sx={{ width: 220, height: '100%' }}>
      {/* ... (rest of the drawer content remains the same) */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          TipTop Admin
        </Typography>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle} sx={{ color: theme.palette.text.primary }}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ mb: 1 }} />

      {/* Menu items */}
      <List sx={{ mt: 2 }}>
        {menuItems.map((item, index) => (
          <ListItemButton
            key={index}
            onClick={() => {
              item.onClick();
              if (isMobile) setMobileOpen(false);
            }}
            sx={{
              mb: 1,
              mx: 1,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
                transform: 'translateX(4px)',
                transition: 'all 0.2s ease'
              }
            }}
          >
            <ListItemIcon sx={{ color: theme.palette.primary.main }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              sx={{
                '& .MuiListItemText-primary': {
                  fontWeight: 500
                }
              }}
            />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <>
      {isMobile && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: theme.zIndex.drawer + 1,
            backgroundColor: theme.palette.background.paper,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            '&:hover': {
              backgroundColor: theme.palette.action.hover
            }
          }}
        >
          <MenuIcon />
        </IconButton>
      )}

      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileOpen : true}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          width: isMobile ? 240 : 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            backgroundColor: theme.palette.mode === 'dark'
              ? theme.palette.background.default
              : theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
            backgroundImage: 'none'
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;