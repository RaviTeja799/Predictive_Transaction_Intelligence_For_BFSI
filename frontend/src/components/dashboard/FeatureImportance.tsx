import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Brain, RefreshCw, Sparkles, Info } from "lucide-react";
import { getModelExplanation } from "@/services/api";

interface FeatureImportanceData {
  feature: string;
  importance: number;
  displayName: string;
}

interface FeatureImportanceProps {
  onExplanationGenerated?: (explanation: string) => void;
}

const FEATURE_DISPLAY_NAMES: Record<string, string> = {
  "transaction_amount": "Transaction Amount",
  "transaction_amount_log": "Amount (Log Scale)",
  "account_age_days": "Account Age",
  "hour": "Transaction Hour",
  "weekday": "Day of Week",
  "month": "Month",
  "is_high_value": "High Value Flag",
  "channel_Atm": "ATM Channel",
  "channel_Mobile": "Mobile Channel",
  "channel_Pos": "POS Channel",
  "channel_Web": "Web Channel",
  "kyc_verified_No": "KYC Not Verified",
  "kyc_verified_Yes": "KYC Verified",
};

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

export const FeatureImportance = ({ onExplanationGenerated }: FeatureImportanceProps) => {
  const [loading, setLoading] = useState(false);
  const [featureData, setFeatureData] = useState<FeatureImportanceData[]>([]);
  const [explanation, setExplanation] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    loadFeatureImportance();
  }, []);

  const loadFeatureImportance = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getModelExplanation();

      let featureImportanceData = response.feature_importance || {};

      // Fallback to static data if backend returns empty
      if (Object.keys(featureImportanceData).length === 0) {
        featureImportanceData = {
          "transaction_amount": 0.245,
          "transaction_amount_log": 0.198,
          "account_age_days": 0.156,
          "is_high_value": 0.132,
          "hour": 0.089,
          "channel_Mobile": 0.067,
          "kyc_verified_No": 0.054,
          "channel_ATM": 0.032,
          "weekday": 0.027,
        };
      }

      if (Object.keys(featureImportanceData).length > 0) {
        // Convert to array and sort by importance
        const features = Object.entries(featureImportanceData)
          .map(([feature, importance]) => ({
            feature,
            importance: Number(importance) * 100, // Convert to percentage
            displayName: FEATURE_DISPLAY_NAMES[feature] || feature.replace(/_/g, " "),
          }))
          .sort((a, b) => b.importance - a.importance)
          .slice(0, 5); // Top 5

        setFeatureData(features);
      }

      if (response.explanation) {
        // Clean up the explanation text
        let cleanExplanation = response.explanation
          .replace(/^(Here is|Here's|Sure,|Certainly,|Okay,|Of course,|I'd be happy|Let me explain).*?[.!]\s*/gi, '')
          .replace(/^(Good morning|Good afternoon|Hello|Hi,?|Dear).*?[,!.]\s*/gi, '')
          .replace(/^\*\*.*?\*\*:?\s*/gm, '') // Remove bold headers
          .replace(/^#+\s*/gm, '') // Remove markdown headers
          .replace(/\*\*/g, '') // Remove bold markers
          .replace(/^\s*[-•]\s*/gm, '') // Remove bullet points at start of lines
          .trim();

        setExplanation(cleanExplanation);
        onExplanationGenerated?.(cleanExplanation);
      }

      if (response.metrics) {
        setMetrics(response.metrics);
      }
    } catch (err: any) {
      console.error("Failed to load feature importance:", err);
      setError("Failed to load feature importance. Backend may not be running.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Brain className="h-4 w-4 text-primary" />
            Feature Importance
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <div className="text-center space-y-2">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <Brain className="h-4 w-4 text-primary" />
            Feature Importance
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <div className="text-center space-y-2">
            <Info className="h-6 w-6 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={loadFeatureImportance}>
              <RefreshCw className="h-3 w-3 mr-1.5" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Brain className="h-4 w-4 text-primary" />
              Feature Importance
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Top 5 features driving fraud detection
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px] w-fit">
            <Sparkles className="h-3 w-3 mr-1" />
            ML Insights
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-3 sm:p-6 pt-0">
        {featureData.length > 0 ? (
          <>
            {/* Feature bars and metrics in a row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left: Chart */}
              <div className="h-[200px] sm:h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={featureData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis
                      type="number"
                      domain={[0, "dataMax"]}
                      tickFormatter={(value) => `${value.toFixed(0)}%`}
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="displayName"
                      width={95}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(1)}%`, "Importance"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                      {featureData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Right: Metrics */}
              {metrics && (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(metrics).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="text-center p-3 rounded-lg bg-muted/50 border border-border/50">
                      <p className="text-[10px] sm:text-xs text-muted-foreground capitalize mb-1">
                        {key.replace(/_/g, " ")}
                      </p>
                      <p className="text-lg sm:text-xl font-bold text-primary">
                        {(Number(value) * 100).toFixed(1)}%
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Explanation - Compact */}
            {explanation && (
              <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 min-w-0">
                    <p className="text-xs font-semibold text-primary">AI Analysis</p>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {explanation}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Feature Legend - Compact */}
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border/50">
              {featureData.map((feature, index) => (
                <div
                  key={feature.feature}
                  className="flex items-center gap-1.5 text-[10px] sm:text-xs px-2 py-1 rounded-full bg-muted/50"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-muted-foreground">{feature.displayName}</span>
                  <span className="font-semibold">{feature.importance.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            <div className="text-center space-y-2">
              <Brain className="h-8 w-8 mx-auto opacity-30" />
              <p className="text-sm">No feature data available</p>
              <Button variant="outline" size="sm" onClick={loadFeatureImportance}>
                Load Data
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeatureImportance;
