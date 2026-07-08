import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LayerProvider } from "@astryxdesign/core/Layer";
import App from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LayerProvider>
      <App />
    </LayerProvider>
  </StrictMode>
);
