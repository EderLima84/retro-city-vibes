import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CityIconProps {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export const CityIcon = ({ icon: Icon, label, active, onClick, className }: CityIconProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-lg transition-all duration-300 group",
        "hover:scale-105 hover:shadow-elevated",
        active ? "bg-gradient-orkut text-primary-foreground shadow-glow" : "bg-card hover:bg-muted",
        className
      )}
    >
      <div className={cn(
        "p-3 rounded-full transition-all duration-300",
        active ? "bg-white/20" : "bg-primary/10 group-hover:bg-primary/20"
      )}>
        <Icon className={cn(
          "w-6 h-6",
          active ? "text-white" : "text-primary"
        )} />
      </div>
      <span className={cn(
        "text-sm font-medium",
        active ? "text-white" : "text-foreground"
      )}>
        {label}
      </span>
    </button>
  );
};
