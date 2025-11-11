import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Transaction } from "@/data/mockTransactions";

interface FraudTrendChartProps {
  transactions: Transaction[];
}

export const FraudTrendChart = ({ transactions }: FraudTrendChartProps) => {
  // Group transactions by month
  const monthlyData = transactions.reduce((acc, txn) => {
    const month = txn.date.substring(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = { month, fraud: 0, legitimate: 0 };
    }
    if (txn.isFraud) {
      acc[month].fraud++;
    } else {
      acc[month].legitimate++;
    }
    return acc;
  }, {} as Record<string, { month: string; fraud: number; legitimate: number }>);

  const data = Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(d => ({
      month: new Date(d.month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      fraud: d.fraud,
      legitimate: d.legitimate,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fraud Trend Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="fraud"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              name="Fraud"
            />
            <Line
              type="monotone"
              dataKey="legitimate"
              stroke="hsl(var(--success))"
              strokeWidth={2}
              name="Legitimate"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
