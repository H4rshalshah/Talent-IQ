import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ClerkProvider } from "@clerk/clerk-react";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "./components/ErrorBoundary";
import { initSmoothScroll } from "./lib/animations/smoothScroll";

// Smooth scrolling (Lenis + ScrollTrigger sync). No-ops for prefers-reduced-motion.
initSmoothScroll();

// Clerk configuration
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const API_URL = import.meta.env.VITE_API_URL;

const container = document.getElementById("root");

// Set once so a failure while rendering the fallback cannot recurse.
let fallbackShown = false;

/* eslint-disable react-refresh/only-export-components */

/**
 * Fatal startup failures must be visible. A blank white page gives no clue
 * that the cause is configuration or an external provider, so every failure
 * path renders a readable screen instead.
 *
 * Deliberately dependency-free (no Clerk hooks, no react-router) so it can
 * render even when those subsystems are what failed.
 */
function StartupError({ title, message, hints = [] }) {
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
      <div className="card bg-base-100 shadow-xl max-w-2xl w-full">
        <div className="card-body gap-3">
          <h1 className="text-2xl font-black">{title}</h1>
          <p className="text-base-content/75">{message}</p>
          {hints.length > 0 && (
            <ul className="list-disc pl-5 space-y-1.5 text-sm text-base-content/70">
              {hints.map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </ul>
          )}
          <button
            className="btn btn-primary btn-sm self-start mt-2"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  );
}

function renderStartupError(props) {
  if (fallbackShown) return;
  fallbackShown = true;
  root.render(<StartupError {...props} />);
}

/*
 * React 19 reports errors that no error boundary handled through the root's
 * `onUncaughtError` callback — they do NOT surface as window error events, so
 * a window listener would never catch them. This is what previously produced
 * a completely blank page when a provider (Clerk) failed to initialize.
 */
const root = createRoot(container, {
  onUncaughtError(error) {
    renderStartupError({
      title: "The application failed to start",
      message: String(error?.message || error || "An unexpected error occurred during startup."),
      hints: [
        "Reload the page. If it persists, check the browser console and the deployment logs.",
        "If the message mentions Clerk, verify that VITE_CLERK_PUBLISHABLE_KEY matches the Clerk application used by CLERK_SECRET_KEY on the backend.",
      ],
    });
  },
  // boundaries render their own fallback, so nothing extra to do here
  onCaughtError() {},
  onRecoverableError() {},
});

// Secondary net for failures outside React (module evaluation, async tasks).
for (const eventName of ["error", "unhandledrejection"]) {
  window.addEventListener(eventName, (event) => {
    const reason = event?.reason ?? event?.message ?? event;
    // Don't show error UI for Chrome extension communication timeouts
    // These are browser-internal issues, not app failures
    const errorStr = String(reason ?? "");
    if (
      errorStr.includes("chrome:") &&
      (errorStr.includes("timed out") || errorStr.includes("call method"))
    ) {
      console.warn("[Talent-IQ] Chrome extension communication timeout (non-critical):", reason);
      return; // Let the app continue loading
    }
    renderStartupError({
      title: "The application failed to start",
      message: String(reason?.message || reason || "An unexpected error occurred during startup."),
      hints: [
        "Reload the page. If it persists, check the browser console and the deployment logs.",
        "If using Chrome extensions (React DevTools, ad blockers, etc.), try disabling them temporarily.",
      ],
    });
  });
}

const keyLooksValid = typeof PUBLISHABLE_KEY === "string" && /^pk_(test|live)_.+/.test(PUBLISHABLE_KEY);

if (!keyLooksValid) {
  renderStartupError({
    title: "Configuration required",
    message:
      "This build is missing a valid Clerk publishable key, so authentication cannot start.",
    hints: [
      "Set VITE_CLERK_PUBLISHABLE_KEY in the frontend environment (for Vercel: Project → Settings → Environment Variables).",
      "The value must start with pk_test_ or pk_live_ and come from the same Clerk application as CLERK_SECRET_KEY on the backend.",
      "Vite inlines environment variables at build time — redeploy after changing them.",
    ],
  });
} else {
  // Wait for Clerk to load before rendering the app
  // This prevents white screen when Clerk script fails to load
  const queryClient = new QueryClient();

  // Render app with Clerk loading state handling
  root.render(
    <StrictMode>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          {/* Catches crashes raised by the auth provider itself, which sit
              outside App's own boundary. */}
          <ErrorBoundary>
            <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
              <App />
            </ClerkProvider>
          </ErrorBoundary>
        </QueryClientProvider>
      </BrowserRouter>
    </StrictMode>
  );

  if (import.meta.env.PROD && !API_URL) {
    console.warn(
      "[Talent-IQ] VITE_API_URL is not set for this production build — API requests will hit the frontend origin and fail."
    );
  }
}
