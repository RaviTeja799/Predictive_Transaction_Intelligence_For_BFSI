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
  const total = fraudCount + legitimateCount;

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label if less than 5%

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-sm sm:text-base lg:text-lg">Transaction Distribution</CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6">
        <div className="w-full h-[280px] sm:h-[320px] lg:h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius="70%"
                innerRadius="30%"
                fill="#8884d8"
                dataKey="value"
                stroke="hsl(var(--background))"
                strokeWidth={2}
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => [
                  `${value.toLocaleString()} (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`,
                  name
                ]}
              />
              <Legend
                wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }}
                iconType="circle"
                iconSize={10}
                formatter={(value, entry: any) => (
                  <span style={{ color: "hsl(var(--foreground))" }}>
                    {value}: {entry.payload?.value?.toLocaleString() || 0}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
