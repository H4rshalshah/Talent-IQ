import { useUser } from "@clerk/clerk-react";
import { Navigate, Route, Routes } from "react-router";
import HomePage from "./pages/HomePage";

import { Toaster } from "react-hot-toast";
import DashboardPage from "./pages/DashboardPage";
import ProblemPage from "./pages/ProblemPage";
import ProblemsPage from "./pages/ProblemsPage";
import SessionPage from "./pages/SessionPage";
import InterviewsPage from "./pages/InterviewsPage";
import AIInterviewSetupPage from "./pages/AIInterviewSetupPage";
import AIInterviewPage from "./pages/AIInterviewPage";
import HumanInterviewLobbyPage from "./pages/HumanInterviewLobbyPage";
import InterviewResultPage from "./pages/InterviewResultPage";
import PerformancePage from "./pages/PerformancePage";
import CareerRoadmapPage from "./pages/CareerRoadmapPage";

function App() {
  const { isSignedIn, isLoaded } = useUser();

  // this will get rid of the flickering effect
  if (!isLoaded) return null;

  const Protected = ({ children }) => (isSignedIn ? children : <Navigate to={"/"} />);

  return (
    <>
      <Routes>
        <Route path="/" element={!isSignedIn ? <HomePage /> : <Navigate to={"/dashboard"} />} />
        <Route path="/dashboard" element={<Protected><DashboardPage /></Protected>} />

        {/* Interviews */}
        <Route path="/interviews" element={<Protected><InterviewsPage /></Protected>} />
        <Route path="/interviews/ai/configure" element={<Protected><AIInterviewSetupPage /></Protected>} />
        <Route path="/interviews/ai/:id" element={<Protected><AIInterviewPage /></Protected>} />
        <Route path="/interviews/human" element={<Protected><HumanInterviewLobbyPage /></Protected>} />
        <Route path="/interviews/result/:id" element={<Protected><InterviewResultPage /></Protected>} />

        {/* Practice */}
        <Route path="/problems" element={<Protected><ProblemsPage /></Protected>} />
        <Route path="/problem/:id" element={<Protected><ProblemPage /></Protected>} />
        <Route path="/session/:id" element={<Protected><SessionPage /></Protected>} />

        {/* Analytics */}
        <Route path="/performance" element={<Protected><PerformancePage /></Protected>} />
        <Route path="/career-roadmap" element={<Protected><CareerRoadmapPage /></Protected>} />
      </Routes>

      <Toaster toastOptions={{ duration: 3000 }} />
    </>
  );
}

export default App;
