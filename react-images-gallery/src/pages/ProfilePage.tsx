import * as React from 'react';
import { 
  Box,
  Typography,
  Avatar,
  Paper,
  Container,
  Button,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

interface UserData {
  name: string;
  email: string;
  role: string;
  avatar: string;
}

export default function ProfilePage() {
  const navigate = useNavigate();
  
  // Récupération des données utilisateur (remplacez par votre propre logique)
  const [user, setUser] = React.useState<UserData>({
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Administrator',
    avatar: '/path/to/avatar.jpg'
  });

  // Exemple: Récupération depuis le localStorage
  React.useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleEditProfile = () => {
    navigate('/profile/edit');
  };

    function setSearchTerm(value: string): void {
        throw new Error('Function not implemented.');
    }

  return (
    <Box>
      <Navbar onSearch={(value) => setSearchTerm(value)} />
      
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
            User Profile
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            gap: 4,
            alignItems: 'center'
          }}>
            {/* Avatar Section */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              minWidth: 200
            }}>
              <Avatar
                src={user.avatar}
                sx={{ 
                  width: 150, 
                  height: 150,
                  mb: 2
                }}
              />
              <Button 
                variant="outlined" 
                onClick={handleEditProfile}
                sx={{ mt: 2 }}
              >
                Edit Avatar
              </Button>
            </Box>
            
            {/* User Info Section */}
            <Box sx={{ flexGrow: 1 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" color="text.secondary">
                  Full Name
                </Typography>
                <Typography variant="h5" sx={{ mt: 1 }}>
                  {user.name}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" color="text.secondary">
                  Email Address
                </Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {user.email}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" color="text.secondary">
                  Role
                </Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {user.role}
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                onClick={handleEditProfile}
                sx={{ mt: 3 }}
              >
                Edit Profile
              </Button>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}