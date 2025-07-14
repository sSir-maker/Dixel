// src/__ tests __/App.test.tsx

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom"; // 📌 Nécessaire pour toBeInTheDocument()
import App from "../App";

test("demo", () => {
  expect(true).toBe(true);
});

test("Renders the main page with search bar and sign in button", () => {
  render(<App />);

  // Vérifie que la barre de recherche s'affiche
  const searchInput = screen.getByPlaceholderText(/rechercher/i);
  expect(searchInput).toBeInTheDocument();

  // Vérifie que le bouton "Sign In" est visible
  const signInButton = screen.getByRole("button", { name: /sign in/i });
  expect(signInButton).toBeInTheDocument();
});

