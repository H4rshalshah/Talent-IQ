import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  BookOpenIcon,
  CompassIcon,
  LayoutDashboardIcon,
  LineChartIcon,
  MessagesSquareIcon,
  MoonIcon,
  SparklesIcon,
  SunIcon,
} from "lucide-react";
import { UserButton } from "@clerk/clerk-react";

const THEME_KEY = "talentiq-theme";

function Navbar() {
  const location = useLocation();
  const [dark, setDark] = useState(() => localStorage.getItem(THEME_KEY) === "gfg-dark");
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "gfg-dark" : "gfg";
    localStorage.setItem(THEME_KEY, dark ? "gfg-dark" : "gfg");
  }, [dark]);

  // Hide navbar on scroll down, show on scroll up
  const handleScroll = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;

    requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      const delta = scrollY - lastScrollY.current;

      // Always show at the top
      if (scrollY < 60) {
        setHidden(false);
      } else if (delta > 10) {
        // Scrolling down → hide
        setHidden(true);
      } else if (delta < -10) {
        // Scrolling up → show
        setHidden(false);
      }

      lastScrollY.current = scrollY;
      ticking.current = false;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const isActive = (path) => location.pathname === path;

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
    { to: "/interviews", label: "Interviews", icon: MessagesSquareIcon },
    { to: "/practice", label: "Practice", icon: BookOpenIcon },
    { to: "/performance", label: "Performance", icon: LineChartIcon },
    { to: "/career-roadmap", label: "Career Coach", icon: CompassIcon },
  ];

  return (
    <>
    <nav
      className={`fixed top-0 left-0 right-0 bg-base-100/80 backdrop-blur-md border-b border-primary/20 z-50 shadow-lg transition-transform duration-300 ease-in-out ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
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
            <span className="font-black text-xl text-primary font-mono tracking-wider">Talent IQ</span>
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

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setDark((d) => !d)}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="btn btn-ghost btn-circle btn-sm"
          >
            {dark ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
          </button>
          <UserButton />
        </div>
      </div>
    </nav>
    {/* Spacer to offset the fixed navbar height */}
    <div className="h-16" />
    </>
  );
}
export default Navbar;
