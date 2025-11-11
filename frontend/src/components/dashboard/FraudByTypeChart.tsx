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
import { Transaction } from "@/data/mockTransactions";

interface FraudByTypeChartProps {
  transactions: Transaction[];
}

export const FraudByTypeChart = ({ transactions }: FraudByTypeChartProps) => {
  const typeData = transactions.reduce((acc, txn) => {
    const key = txn.type;
    if (!acc[key]) {
      acc[key] = { type: key, fraud: 0, total: 0 };
    }
    acc[key].total++;
    if (txn.isFraud) {
      acc[key].fraud++;
    }
    return acc;
  }, {} as Record<string, { type: string; fraud: number; total: number }>);

  const data = Object.values(typeData).map(d => ({
    type: d.type,
    fraudRate: ((d.fraud / d.total) * 100).toFixed(1),
    count: d.total,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fraud Rate by Transaction Type</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="type" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" label={{ value: "Fraud Rate (%)", angle: -90, position: "insideLeft" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
            />
            <Legend />
            <Bar dataKey="fraudRate" fill="hsl(var(--chart-3))" name="Fraud Rate (%)" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
