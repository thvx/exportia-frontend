import { ChevronRight } from "lucide-react";

interface AlertCardProps {
  icon: string;
  title: string;
  description: string;
  type: "warning" | "danger" | "info";
  time?: string;
  onClick?: () => void;
}

const typeStyles = {
  warning: "border-l-signal-yellow bg-signal-yellow-bg/50",
  danger: "border-l-signal-red bg-signal-red-bg/50",
  info: "border-l-primary bg-secondary/50",
};

export function AlertCard({ icon, title, description, type, time, onClick }: AlertCardProps) {
  return (
    <div
      className={`content-card border-l-4 ${typeStyles[type]} cursor-pointer active:scale-[0.98] transition-transform`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-card-foreground">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{description}</p>
          {time && <p className="text-[0.65rem] text-muted-foreground mt-1">{time}</p>}
        </div>
        <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 mt-1" />
      </div>
    </div>
  );
}
