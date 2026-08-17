import { Link, useLocation } from "react-router";
import {
  BookOpenIcon,
  CompassIcon,
  LayoutDashboardIcon,
  LineChartIcon,
  MessagesSquareIcon,
  SparklesIcon,
} from "lucide-react";
import { UserButton } from "@clerk/clerk-react";

function Navbar() {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
    { to: "/interviews", label: "Interviews", icon: MessagesSquareIcon },
    { to: "/problems", label: "Practice", icon: BookOpenIcon },
    { to: "/performance", label: "Performance", icon: LineChartIcon },
    { to: "/career-roadmap", label: "Career Coach", icon: CompassIcon },
  ];

  return (
    <nav className="bg-base-100/80 backdrop-blur-md border-b border-primary/20 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* LOGO */}
        <Link
          to="/"
          className="group flex items-center gap-3 hover:scale-105 transition-transform duration-200 shrink-0"
        >
          <div className="size-10 rounded-xl bg-gradient-to-r from-primary via-secondary to-accent flex items-center justify-center shadow-lg">
            <SparklesIcon className="size-6 text-white" />
          </div>

          <div className="flex flex-col">
            <span className="font-black text-xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent font-mono tracking-wider">
              Talent IQ
            </span>
            <span className="text-xs text-base-content/60 font-medium -mt-1">
              Interview Smarter
            </span>
          </div>
        </Link>

        {/* NAV LINKS */}
        <div className="hidden lg:flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3.5 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-x-2.5 ${
                  isActive(link.to)
                    ? "bg-primary text-primary-content"
                    : "hover:bg-base-200 text-base-content/70 hover:text-base-content"
                }`}
              >
                <Icon className="size-4" />
                <span className="font-medium text-sm">{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* MOBILE: compact links */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.to}
                to={link.to}
                title={link.label}
                className={`px-2.5 py-2 rounded-lg transition-all duration-200 ${
                  isActive(link.to) ? "bg-primary text-primary-content" : "text-base-content/70"
                }`}
              >
                <Icon className="size-5" />
              </Link>
            );
          })}
        </div>

        <div className="shrink-0">
          <UserButton />
        </div>
      </div>
    </nav>
  );
}
export default Navbar;
