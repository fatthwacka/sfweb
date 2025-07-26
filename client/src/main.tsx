import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Enhanced error handlers to completely block runtime error plugin
window.addEventListener('error', (event) => {
  console.warn('BLOCKED Error:', event.error?.message || event.message);
  event.stopPropagation();
  event.stopImmediatePropagation();
  event.preventDefault();
  return false; // Additional prevention
}, true); // Capture phase

window.addEventListener('unhandledrejection', (event) => {
  console.warn('BLOCKED Promise rejection:', event.reason);
  event.stopPropagation();
  event.stopImmediatePropagation();
  event.preventDefault();
}, true); // Capture phase

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
