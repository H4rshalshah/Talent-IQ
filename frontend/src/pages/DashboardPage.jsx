import { useUser } from "@clerk/clerk-react";
import { SparklesIcon } from "lucide-react";
import { useActiveSessions, useMyRecentSessions } from "../hooks/useSessions";
import { useDashboardData } from "../hooks/useInterviews";

import Navbar from "../components/Navbar";
import StatsCards from "../components/StatsCards";
import ActiveSessions from "../components/ActiveSessions";
import RecentSessions from "../components/RecentSessions";
import ReadinessCard from "../components/ReadinessCard";
import QuickActions from "../components/QuickActions";
import { useReveal } from "../lib/animations/useReveal";

function DashboardPage() {
  const { user } = useUser();
  const { data: dashboardData, isLoading: loadingDashboard } = useDashboardData();
  const { data: activeSessionsData, isLoading: loadingActiveSessions } = useActiveSessions();
  const { data: recentSessionsData, isLoading: loadingRecentSessions } = useMyRecentSessions();

  const revealRef = useReveal();

  const activeSessions = activeSessionsData?.sessions || [];
  const recentSessions = recentSessionsData?.sessions || [];

  const isUserInSession = (session) => {
    if (!user.id) return false;
    return session.host?.clerkId === user.id || session.participant?.clerkId === user.id;
  };

  return (
    <>
      <div className="min-h-screen bg-base-300">
        <Navbar />

        {/* WELCOME */}
        <div className="relative overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-6 py-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Welcome back, {user?.firstName || "there"}!
              </h1>
            </div>
            <p className="text-lg text-base-content/60 ml-0 sm:ml-[60px]">
              Ready to level up your interview game?
            </p>
          </div>
        </div>

        {/* CONTENT */}
        <div ref={revealRef} className="container mx-auto px-6 pb-16">
          {/* QUICK ACTIONS */}
          <div className="reveal mb-8">
            <QuickActions />
          </div>

          {/* GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="reveal">
              <ReadinessCard data={dashboardData?.data} isLoading={loadingDashboard} />
            </div>

            <div className="lg:col-span-2 reveal">
              <ActiveSessions
                sessions={activeSessions}
                isLoading={loadingActiveSessions}
                isUserInSession={isUserInSession}
              />
            </div>
          </div>

          <div className="reveal mt-6">
            <StatsCards
              activeSessionsCount={activeSessions.length}
              recentSessionsCount={recentSessions.length}
            />
          </div>

          <div className="reveal">
            <RecentSessions sessions={recentSessions} isLoading={loadingRecentSessions} />
          </div>
        </div>
      </div>
    </>
  );
}

export default DashboardPage;
