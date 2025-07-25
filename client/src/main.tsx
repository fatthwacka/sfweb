import { createRoot } from "react-dom/client";
import { Suspense } from "react";
import App from "./App";
import "./index.css";

// Loading component to show during app initialization
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-salmon border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-salmon font-medium">Loading SlyFox Studios...</p>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <Suspense fallback={<LoadingScreen />}>
    <App />
  </Suspense>
);
