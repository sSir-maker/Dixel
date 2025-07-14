import * as React from 'react';
import { 
  styled,
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Chip,
  Stack,
  CircularProgress,
  Snackbar,
  Alert,
  Grid,
  IconButton,
  Container
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { useForm } from 'react-hook-form';
import Navbar from '../components/Navbar';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

interface ImageData {
  file: File;
  id: string;
}

interface FormData {
  title: string;
  description: string;
  tags: string[];
  newTag: string;
  images: ImageData[];
}

export default function UploadPage() {
  const { register, handleSubmit, watch, setValue, reset } = useForm<FormData>({
    defaultValues: {
      title: '',
      description: '',
      tags: [],
      newTag: '',
      images: []
    }
  });

  const [isUploading, setIsUploading] = React.useState(false);
  const [snackbar, setSnackbar] = React.useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const images = watch('images');
  const tags = watch('tags');

  const handleAddTag = () => {
    const newTag = watch('newTag').trim();
    if (newTag && !tags.includes(newTag)) {
      setValue('tags', [...tags, newTag]);
      setValue('newTag', '');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setValue('tags', tags.filter(tag => tag !== tagToRemove));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const newImages = Array.from(event.target.files).map(file => ({
        file,
        id: Math.random().toString(36).substring(2, 9)
      }));
      setValue('images', [...images, ...newImages]);
    }
  };

  const handleRemoveImage = (id: string) => {
    setValue('images', images.filter(img => img.id !== id));
  };

const onSubmit = async (data: FormData) => {
  if (!data.images?.length) return;

  const token = localStorage.getItem('token');
  if (!token) {
    setSnackbar({
      open: true,
      message: 'Authentification requise',
      severity: 'error'
    });
    return;
  }

  setIsUploading(true);

  try {
    await Promise.all(data.images.map(async (image) => {
      const formData = new FormData();
      formData.append('images', image.file);
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      data.tags?.forEach(tag => formData.append('tags', tag));

      const response = await fetch('http://localhost:5000/api/v1/images/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }

      return response.json();
    }));

    setSnackbar({
      open: true,
      message: `${data.images.length} image(s) uploadée(s) avec succès !`,
      severity: 'success'
    });
    reset();
  } catch (error) {
    console.error("Erreur upload:", error);
    
    let errorMessage = 'Erreur lors de l\'upload';
    if (error instanceof Error) {
      errorMessage = error.message.includes('Failed to fetch')
        ? 'Connexion au serveur impossible. Vérifiez:'
          + '\n1. Que le serveur est démarré'
          + '\n2. Que l\'URL est correcte'
          + '\n3. Les logs du serveur'
        : error.message;
    }

    setSnackbar({
      open: true,
      message: errorMessage,
      severity: 'error'
    });
  } finally {
    setIsUploading(false);
  }
};

  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };

  function setSearchTerm(value: string): void {
    throw new Error('Function not implemented.');
  }

  return (
    <Box>
      <Navbar onSearch={(value) => setSearchTerm(value)} />
      
      <Container maxWidth="lg" sx={{ my: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
            Upload Images
          </Typography>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="Title"
                    {...register('title', { required: 'Title is required' })}
                    sx={{ '& .MuiOutlinedInput-root': { height: 40 } }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={4}
                    {...register('description')}
                  />
                  
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                      <TextField
                        fullWidth
                        label="Add Tag"
                        value={watch('newTag')}
                        onChange={(e) => setValue('newTag', e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                      />
                      <Button onClick={handleAddTag}>Add</Button>
                    </Stack>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          onDelete={() => handleRemoveTag(tag)}
                        />
                      ))}
                    </Box>
                  </Box>
                  
                  <Button
                    component="label"
                    variant="contained"
                    color="primary"
                    startIcon={<CloudUploadIcon />}
                    disabled={isUploading}
                  >
                    Select Images
                    <VisuallyHiddenInput 
                      type="file" 
                      onChange={handleFileChange}
                      accept="image/*"
                      multiple
                    />
                  </Button>
                  {images.length > 0 && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Selected: {images.length} image(s)
                    </Typography>
                  )}
                </Stack>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 2,
                  minHeight: 300
                }}>
                  {images.length > 0 ? (
                    <Stack spacing={2}>
                      {images.map((image) => (
                        <Box key={image.id} sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1
                        }}>
                          <Typography variant="body2">
                            {image.file.name}
                          </Typography>
                          <IconButton
                            onClick={() => handleRemoveImage(image.id)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Stack>
                  ) : (
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%'
                    }}>
                      <Typography color="text.secondary">
                        No images selected
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="success"
                  disabled={images.length === 0 || isUploading}
                  startIcon={isUploading ? <CircularProgress size={20} /> : null}
                  sx={{ mt: 2 }}
                >
                  {isUploading ? 'Uploading...' : `Upload ${images.length} Image(s)`}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
        
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}