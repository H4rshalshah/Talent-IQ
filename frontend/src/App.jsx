import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Navigate, Route, Routes } from "react-router";
import HomePage from "./pages/HomePage";
import ErrorBoundary from "./components/ErrorBoundary";

import { Toaster } from "react-hot-toast";
import DashboardPage from "./pages/DashboardPage";
import ProblemPage from "./pages/ProblemPage";
import PracticePage from "./pages/PracticePage";
import SessionPage from "./pages/SessionPage";
import InterviewsPage from "./pages/InterviewsPage";
import AIInterviewSetupPage from "./pages/AIInterviewSetupPage";
import AIInterviewPage from "./pages/AIInterviewPage";
import HumanInterviewLobbyPage from "./pages/HumanInterviewLobbyPage";
import InterviewResultPage from "./pages/InterviewResultPage";
import PerformancePage from "./pages/PerformancePage";
import CareerRoadmapPage from "./pages/CareerRoadmapPage";
import RoleReadinessPage from "./pages/RoleReadinessPage";

/** How long to wait for the auth provider before showing an actionable error. */
const AUTH_READY_TIMEOUT_MS = 8000;

/** Branded boot state — never a blank white page while auth resolves. */
function BootSplash({ message = "Starting Talent-IQ…" }) {
  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center gap-4 px-6">
      <div className="size-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p className="text-sm text-base-content/60">{message}</p>
    </div>
  );
}

/**
 * Shown when the auth provider never reports ready. Previously this state
 * rendered `null` forever — a blank page with no error and no way forward.
 */
function AuthUnavailable() {
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
      <div className="card bg-base-100 shadow-xl max-w-2xl w-full">
        <div className="card-body gap-3">
          <h1 className="text-2xl font-black">Authentication is unavailable</h1>
          <p className="text-base-content/75">
            The authentication service did not finish loading, so Talent-IQ cannot start. This is
            usually a configuration problem with the Clerk keys rather than a bug in the app.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-base-content/70">
            <li>
              <code className="font-mono">VITE_CLERK_PUBLISHABLE_KEY</code> must belong to the same
              Clerk application as the backend's <code className="font-mono">CLERK_SECRET_KEY</code>.
            </li>
            <li>
              The key must be a valid Clerk publishable key (<code className="font-mono">pk_test_…</code>{" "}
              or <code className="font-mono">pk_live_…</code>) and the Clerk instance must still exist.
            </li>
            <li>
              Add this site's origin to the allowed origins in the Clerk dashboard.
            </li>
            <li>Vite inlines env vars at build time — redeploy after changing them.</li>
          </ul>
          <div className="flex gap-2 mt-2">
            <button className="btn btn-primary btn-sm" onClick={() => window.location.reload()}>
              Retry
            </button>
            <a className="btn btn-outline btn-sm" href="https://dashboard.clerk.com" target="_blank" rel="noreferrer">
              Open Clerk dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const { isSignedIn, isLoaded } = useUser();
  const [authTimedOut, setAuthTimedOut] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setAuthTimedOut(false);
      return undefined;
    }
    const timer = setTimeout(() => setAuthTimedOut(true), AUTH_READY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  if (!isLoaded) {
    return authTimedOut ? <AuthUnavailable /> : <BootSplash />;
  }

  const Protected = ({ children }) => (isSignedIn ? children : <Navigate to={"/"} />);

  return (
    <>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={!isSignedIn ? <HomePage /> : <Navigate to={"/dashboard"} />} />
          <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />

          {/* Interviews */}
          <Route path="/interviews" element={<Protected><InterviewsPage /></Protected>} />
          <Route path="/interviews/ai/configure" element={<Protected><AIInterviewSetupPage /></Protected>} />
          <Route path="/interviews/ai/:id" element={<Protected><AIInterviewPage /></Protected>} />
          <Route path="/interviews/human" element={<Protected><HumanInterviewLobbyPage /></Protected>} />
          <Route path="/interviews/result/:id" element={<Protected><InterviewResultPage /></Protected>} />

          {/* Practice — one page hosting the Codeforces library + in-house problems */}
          <Route path="/practice" element={<Protected><PracticePage /></Protected>} />
          <Route path="/problems" element={<Navigate to="/practice" replace />} />
          <Route path="/question-bank" element={<Navigate to="/practice" replace />} />
          <Route path="/problem/:id" element={<Protected><ProblemPage /></Protected>} />
          <Route path="/session/:id" element={<Protected><SessionPage /></Protected>} />

          {/* Analytics */}
          <Route path="/performance" element={<Protected><PerformancePage /></Protected>} />
          <Route path="/role-readiness" element={<Protected><RoleReadinessPage /></Protected>} />
          <Route path="/career-roadmap" element={<Protected><CareerRoadmapPage /></Protected>} />

          {/* Unknown routes fall back to the landing page instead of a blank screen */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>

      <Toaster toastOptions={{ duration: 3000 }} />
    </>
  );
}

export default App;
