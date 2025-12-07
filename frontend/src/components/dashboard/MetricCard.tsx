import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "success" | "danger" | "warning";
}

export const MetricCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = "default",
}: MetricCardProps) => {
  const variantStyles = {
    default: "bg-primary/5 text-primary",
    success: "bg-success/10 text-success",
    danger: "bg-destructive/10 text-destructive",
    warning: "bg-warning/10 text-warning",
  };

  return (
    <Card className="transition-all hover:shadow-lg">
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 sm:space-y-2 flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs md:text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight truncate">{value}</p>
            {subtitle && (
              <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate">{subtitle}</p>
            )}
            {trend && trendValue && (
              <div className={`flex items-center gap-1 text-[10px] sm:text-xs md:text-sm font-medium ${
                trend === "up" ? "text-success" : trend === "down" ? "text-destructive" : "text-muted-foreground"
              }`}>
                <span className="truncate">{trendValue}</span>
              </div>
            )}
          </div>
          <div className={`p-1.5 sm:p-2 md:p-3 rounded-lg sm:rounded-xl shrink-0 ${variantStyles[variant]}`}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
