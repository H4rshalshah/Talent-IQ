import { Link } from "react-router";
import {
  ArrowRightIcon,
  BotIcon,
  Code2Icon,
  CompassIcon,
  LineChartIcon,
  UsersIcon,
} from "lucide-react";

// One primary action (first card) keeps a filled treatment; the rest use a
// soft tint so the row reads as a hierarchy, not five equally loud blocks.
const ACTIONS = [
  {
    to: "/interviews/ai/configure",
    label: "Start AI Interview",
    icon: BotIcon,
    primary: true,
  },
  { to: "/interviews/human", label: "Join Human Interview", icon: UsersIcon },
  { to: "/practice", label: "Practice Coding", icon: Code2Icon },
  { to: "/performance", label: "View Performance", icon: LineChartIcon },
  { to: "/career-roadmap", label: "Career Coach", icon: CompassIcon },
];

function QuickActions() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {ACTIONS.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.to}
            to={action.to}
            className="card bg-base-100 border-2 border-base-300 hover:border-primary/50 hover:-translate-y-1 transition-all duration-200 group"
          >
            <div className="card-body items-center text-center p-4">
              {action.primary ? (
                <div className="size-12 rounded-xl bg-primary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200">
                  <Icon className="size-6 text-primary-content" />
                </div>
              ) : (
                <div className="icon-tint size-12 mb-2 group-hover:scale-110 transition-transform duration-200">
                  <Icon className="size-6" />
                </div>
              )}
              <p className="text-sm font-semibold leading-tight">{action.label}</p>
              <ArrowRightIcon className="size-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default QuickActions;
