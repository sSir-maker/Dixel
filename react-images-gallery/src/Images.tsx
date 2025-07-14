import React, { useState } from "react";
import Masonry from "react-masonry-css";
import "../src/index.css";
import { ImageListItemBar, IconButton } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import FavoriteIcon from '@mui/icons-material/Favorite';

interface ImagesProps {
  data: {
    id?: string;
    src: string;
    title?: string;
    authorName?: string; 
  }[];
  onClick: (index: number) => void;
}

const breakpointColumnsObj = {
  default: 4,
  1200: 3,
  768: 2,
  480: 1
};

const Images: React.FC<ImagesProps> = ({ data, onClick }) => {
  const [likedImages, setLikedImages] = useState<Record<string, boolean>>({});

  const handleDownload = (imageUrl: string) => {
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = imageUrl.split('/').pop() || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download error:", error);
    }
  };

  const handleLike = (imageId: string = '', e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedImages(prev => ({
      ...prev,
      [imageId]: !prev[imageId]
    }));
    // Ajouter ici l'appel API pour sauvegarder le like si nécessaire
    // axios.post(`/api/like/${imageId}`);
  };

  return (
    <div className="gallery-container">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {data.map((item, index) => (
          <div key={item.id || index} className="gallery-item" onClick={() => onClick(index)}>
            <img 
              src={item.src} 
              alt={item.title || `Image ${index}`} 
              className="gallery-img" 
              loading="lazy" // Optimisation du chargement
            />
            <ImageListItemBar
              title={item.title}
              subtitle={`By ${item.authorName || 'Auteur inconnu'}`}
              actionIcon={
                <div style={{ display: 'flex', gap: '4px' }}>
                  <IconButton
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.54)',
                      '&:hover': { 
                        color: '#42a5f5',
                        backgroundColor: 'rgba(66, 165, 245, 0.1)'
                      }
                    }}
                    aria-label={`Télécharger ${item.title}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(item.src);
                    }}
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    sx={{ 
                      color: likedImages[item.id || ''] ? '#ff4081' : 'rgba(255, 255, 255, 0.54)',
                      '&:hover': { 
                        color: '#ff4081',
                        backgroundColor: 'rgba(255, 64, 129, 0.1)'
                      }
                    }}
                    aria-label={`Aimer ${item.title}`}
                    onClick={(e) => handleLike(item.id, e)}
                  >
                    <FavoriteIcon fontSize="small" />
                  </IconButton>
                </div>
              }
              sx={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0) 100%)',
              }}
            />
          </div>
        ))}
      </Masonry>
    </div>
  );
};

export default Images;