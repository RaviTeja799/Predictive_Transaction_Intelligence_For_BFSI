import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity } from "lucide-react";

interface ModelPerformanceProps {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc?: number;
}

export const ModelPerformance = ({
  accuracy,
  precision,
  recall,
  f1Score,
  rocAuc = 0.7334,
}: ModelPerformanceProps) => {
  const metrics = [
    { label: "Accuracy", value: accuracy },
    { label: "Precision", value: precision },
    { label: "Recall", value: recall },
    { label: "F1-Score", value: f1Score },
  ];

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <CardTitle className="text-base sm:text-lg">Model Performance</CardTitle>
          <Badge className="bg-success text-success-foreground text-[10px] sm:text-xs">
            <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
            SMOTE Balanced
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* ROC-AUC Score */}
        <div className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <span className="font-medium text-xs sm:text-base">ROC-AUC Score</span>
          </div>
          <span className="text-lg sm:text-xl font-bold text-primary">{(rocAuc * 100).toFixed(2)}%</span>
        </div>

        {/* Removed Risk Level Distribution per product request */}

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="space-y-1 sm:space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-sm font-medium text-muted-foreground">
                  {metric.label}
                </span>
                <span className="text-sm sm:text-lg font-bold">
                  {(metric.value * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 sm:h-2">
                <div
                  className="bg-primary h-1.5 sm:h-2 rounded-full transition-all"
                  style={{ width: `${metric.value * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
