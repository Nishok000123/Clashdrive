import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Use cache-busting version parameter to ensure updates are fetched immediately on refresh
    navigator.serviceWorker.register("/sw.js?v=" + Date.now()).catch((err) => {
      console.error("ServiceWorker registration failed: ", err);
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
