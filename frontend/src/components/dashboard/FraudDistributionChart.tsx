import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface FraudDistributionChartProps {
  fraudCount: number;
  legitimateCount: number;
}

export const FraudDistributionChart = ({
  fraudCount,
  legitimateCount,
}: FraudDistributionChartProps) => {
  const data = [
    { name: "Legitimate", value: legitimateCount },
    { name: "Fraud", value: fraudCount },
  ];

  const COLORS = ["hsl(var(--success))", "hsl(var(--destructive))"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(1)}%`
              }
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
