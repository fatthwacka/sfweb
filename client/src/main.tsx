import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Global error handlers to prevent runtime error plugin crashes
window.addEventListener('error', (event) => {
  console.warn('Global error caught:', event.error);
  event.preventDefault(); // Prevent default error handling
});

window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection caught:', event.reason);
  event.preventDefault(); // Prevent default handling
});

try {
  const rootElement = document.getElementById("root");
  if (rootElement) {
    createRoot(rootElement).render(<App />);
  } else {
    console.error('Root element not found');
  }
} catch (error) {
  console.error('Error initializing React app:', error);
}
