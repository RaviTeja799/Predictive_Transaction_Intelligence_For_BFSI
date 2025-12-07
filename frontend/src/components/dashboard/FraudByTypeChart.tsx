import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChannelStatistics } from "@/services/api";

interface FraudByTypeChartProps {
  channelStats?: ChannelStatistics[];
}

export const FraudByTypeChart = ({ channelStats }: FraudByTypeChartProps) => {
  // No mock data - use only real channel statistics from API
  if (!channelStats || channelStats.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-base lg:text-lg">Fraud by Channel</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center justify-center h-[280px] sm:h-[320px] text-muted-foreground text-sm">
            No channel data available
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = channelStats.map(stat => {
    const fraudCount = Math.floor((stat as any).fraud_count ?? (stat.total * stat.fraud_rate / 100));
    const legitCount = Math.max(0, stat.total - fraudCount);
    return {
      type: stat.channel,
      fraudRate: parseFloat(stat.fraud_rate.toFixed(1)),
      fraudCount,
      legitimateCount: legitCount,
      count: stat.total,
    };
  });

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-sm sm:text-base lg:text-lg">Fraud by Channel</CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <div className="w-full h-[280px] sm:h-[320px] lg:h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="type"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickMargin={5}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                width={35}
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => [
                  value.toLocaleString(),
                  name === "fraudCount" ? "Fraud" : "Legitimate"
                ]}
              />
              <Legend
                wrapperStyle={{ paddingTop: "10px", fontSize: "11px" }}
                iconType="square"
                iconSize={10}
              />
              <Bar
                dataKey="fraudCount"
                fill="hsl(var(--destructive))"
                name="Fraud"
                stackId="a"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="legitimateCount"
                fill="hsl(var(--success))"
                name="Legitimate"
                stackId="a"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
