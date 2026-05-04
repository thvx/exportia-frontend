interface StatCardProps {
  icon: string;
  value: string;
  label: string;
}

export function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="content-card !mx-0 flex flex-col items-center text-center">
      <span className="text-2xl mb-1">{icon}</span>
      <span className="text-xl font-extrabold text-card-foreground">{value}</span>
      <span className="text-[0.65rem] text-muted-foreground mt-0.5">{label}</span>
    </div>
  );
}
