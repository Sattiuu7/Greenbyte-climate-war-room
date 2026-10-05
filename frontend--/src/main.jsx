import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
{loading ? (
  <p>Loading disaster data...</p>
) : (
  <p>{zones.length} disaster zones connected</p>
)}