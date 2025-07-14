import React, { useState, useEffect } from "react";
import { useAuth } from "../src/hooks/useAuth";
import axios from "axios";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import {
  Captions,
  Download,
  Fullscreen,
  Thumbnails,
  Zoom,
} from "yet-another-react-lightbox/plugins";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import Images from "./Images";
import Navbar from "./components/Navbar";
import { Box, CircularProgress, Typography } from "@mui/material";

function Home() {
  const { isAuthenticated, user } = useAuth();
  const [index, setIndex] = useState<number>(-1);
  const [slides, setSlides] = useState<{ src: string; title?: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    const fetchImages = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:5000/api/v1/images/", {
          withCredentials: true,
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });


        console.log(response.data);
        const imageSlides = response.data.data.map((image: {
          url: string;
          title?: string;
          author?: { name?: string };
        }) => ({
          src: image.url,
          title: image.title || "Untitled",
          authorName: image.author?.name || 'Auteur inconnu'
        }));

        setSlides(imageSlides);
      } catch (err) {
        console.error("Error loading images:", err);
        setError("Failed to load images. Please try again.");
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          setError("Session expired. Please login again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [isAuthenticated]); // Se déclenche quand l'état d'authentification change

  const filteredSlides = slides.filter((image) =>
    image.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Navbar onSearch={(value) => setSearchTerm(value)} />

      {!isAuthenticated ? (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography variant="h6">
            Please login to access the gallery
          </Typography>
        </Box>
      ) : loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ textAlign: "center", mt: 4 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : (
        <>
          <Images
            data={filteredSlides}
            onClick={(currentIndex) => setIndex(currentIndex)}
          />
          <Lightbox
            plugins={[Captions, Download, Fullscreen, Thumbnails, Zoom]}
            captions={{
              showToggle: true,
              descriptionTextAlign: "end",
            }}
            index={index}
            open={index >= 0}
            close={() => setIndex(-1)}
            slides={filteredSlides}
          />
        </>
      )}
    </>
  );
}

export default Home;