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

interface Transaction {
  date: string;
  transaction_date?: string;
  isFraud: boolean;
}

interface FraudByHourChartProps {
  transactions: Transaction[];
}

export const FraudByHourChart = ({ transactions }: FraudByHourChartProps) => {
  // Generate hourly data from transactions
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const hourTransactions = transactions.filter(txn => {
      const dateStr = txn.transaction_date || txn.date;
      if (!dateStr) return false;
      try {
        const date = new Date(dateStr);
        return date.getHours() === hour;
      } catch {
        return false;
      }
    });

    const fraudCount = hourTransactions.filter(t => t.isFraud).length;
    const legitimateCount = hourTransactions.length - fraudCount;
    const total = hourTransactions.length;
    const fraudRate = total > 0 ? (fraudCount / total) * 100 : 0;

    return {
      hour: `${hour}h`,
      hourNum: hour,
      fraud: fraudCount,
      legitimate: legitimateCount,
      total,
      fraudRate: parseFloat(fraudRate.toFixed(1)),
    };
  });

  // Check if we have real data
  const hasData = hourlyData.some(h => h.total > 0);

  if (!hasData) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-sm sm:text-base lg:text-lg">Fraud by Hour (24h)</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="flex items-center justify-center h-[280px] sm:h-[320px] text-muted-foreground text-sm">
            No hourly transaction data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-sm sm:text-base lg:text-lg">Fraud by Hour (24h)</CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <div className="w-full h-[280px] sm:h-[320px] lg:h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={hourlyData}
              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
              <XAxis
                dataKey="hour"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                interval={2}
                tickMargin={5}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                width={30}
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => {
                  if (name === "fraudRate") return [`${value}%`, "Fraud Rate"];
                  return [value, name === "fraud" ? "Fraud" : "Legitimate"];
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "10px", fontSize: "11px" }}
                iconType="square"
                iconSize={10}
              />
              <Bar
                dataKey="legitimate"
                fill="hsl(var(--success))"
                stackId="a"
                name="Legitimate"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="fraud"
                fill="hsl(var(--destructive))"
                stackId="a"
                name="Fraud"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
