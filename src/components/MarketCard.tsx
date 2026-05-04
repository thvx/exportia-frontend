import { ChevronRight } from "lucide-react";

type Signal = "green" | "yellow" | "red";

interface MarketCardProps {
  flag: string;
  country: string;
  label: string;
  signal: Signal;
  subtitle?: string;
}

const signalConfig: Record<Signal, { dot: string; badge: string }> = {
  green: { dot: "signal-green", badge: "badge-green" },
  yellow: { dot: "signal-yellow", badge: "badge-yellow" },
  red: { dot: "signal-red", badge: "badge-red" },
};

export function MarketCard({ flag, country, label, signal, subtitle }: MarketCardProps) {
  const cfg = signalConfig[signal];
  return (
    <div className="content-card flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform">
      <span className="text-2xl">{flag}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-card-foreground">{country}</span>
          <span className={`signal-dot ${cfg.dot}`} />
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitle}</p>
      </div>
      <span className={cfg.badge}>{label}</span>
      <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />
    </div>
  );
}
