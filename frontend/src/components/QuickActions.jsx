import { Link } from "react-router";
import {
  ArrowRightIcon,
  BotIcon,
  Code2Icon,
  CompassIcon,
  LineChartIcon,
  UsersIcon,
} from "lucide-react";

const ACTIONS = [
  { to: "/interviews/ai/configure", label: "Start AI Interview", icon: BotIcon, color: "from-primary to-secondary" },
  { to: "/interviews/human", label: "Join Human Interview", icon: UsersIcon, color: "from-secondary to-accent" },
  { to: "/problems", label: "Practice Coding", icon: Code2Icon, color: "from-accent to-primary" },
  { to: "/performance", label: "View Performance", icon: LineChartIcon, color: "from-success to-primary" },
  { to: "/career-roadmap", label: "View Career Roadmap", icon: CompassIcon, color: "from-warning to-secondary" },
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
              <div
                className={`size-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-200`}
              >
                <Icon className="size-6 text-white" />
              </div>
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
