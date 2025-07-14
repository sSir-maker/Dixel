import React, { useState, useContext } from "react";
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  InputBase, 
  Button, 
  Box, 
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon 
} from "@mui/material";
import { 
  Search as SearchIcon,
  Person as PersonIcon,
  Upload as UploadIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon
} from "@mui/icons-material";
import { styled, alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

// ... (vos styles Search, SearchIconWrapper, StyledInputBase restent les mêmes)
const Search = styled("div")(({ theme }) => ({
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  "&:hover": {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginLeft: "auto",
  marginRight: "auto",
  width: "40%",
  display: "flex",
  alignItems: "center",
  padding: "5px 10px",
}));

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  marginLeft: 40,
  width: "100%",
}));

interface NavbarProps {
  onSearch: (value: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch }) => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useContext(AuthContext)!;
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // État pour le menu de l'avatar
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleAvatarClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    logout();
    navigate('/');
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: "#2196f3", padding: "10px 0" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Logo à gauche */}
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          MyGallery
        </Typography>

        {/* Barre de recherche au centre */}
        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Rechercher..."
            inputProps={{ "aria-label": "search" }}
            onChange={(e) => onSearch(e.target.value)}
          />
        </Search>

        {/* Bouton dynamique à droite */}
        <Box sx={{ ml: 3, flexGrow: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
          {isAuthenticated ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: 'white', 
                    color: '#2196f3',
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.8 }
                  }}
                  src={user.avatar}
                  onClick={handleAvatarClick}
                  aria-haspopup="true"
                  aria-expanded={open ? 'true' : undefined}
                >
                  {user.name?.charAt(0)}
                </Avatar>
                
                {/* Menu déroulant */}
                <Menu
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleMenuClose}
                  MenuListProps={{
                    'aria-labelledby': 'basic-button',
                  }}
                  PaperProps={{
                    elevation: 0,
                    sx: {
                      overflow: 'visible',
                      filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                      mt: 1.5,
                      '& .MuiAvatar-root': {
                        width: 32,
                        height: 32,
                        ml: -0.5,
                        mr: 1,
                      },
                      '&:before': {
                        content: '""',
                        display: 'block',
                        position: 'absolute',
                        top: 0,
                        right: 14,
                        width: 10,
                        height: 10,
                        bgcolor: 'background.paper',
                        transform: 'translateY(-50%) rotate(45deg)',
                        zIndex: 0,
                      },
                    },
                  }}
                  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                  <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
                    <ListItemIcon>
                      <PersonIcon fontSize="small" />
                    </ListItemIcon>
                    Profile
                  </MenuItem>
                  <MenuItem onClick={() => { handleMenuClose(); navigate('/upload'); }}>
                    <ListItemIcon>
                      <UploadIcon fontSize="small" />
                    </ListItemIcon>
                    Upload
                  </MenuItem>
                  <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
                    <ListItemIcon>
                      <SettingsIcon fontSize="small" />
                    </ListItemIcon>
                    Settings
                  </MenuItem>
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              </Box>
            </>
          ) : (
            <Button
              variant="contained"
              sx={{
                backgroundColor: "white",
                color: "#2196f3",
                "&:hover": { backgroundColor: "#f0f0f0" },
              }}
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;