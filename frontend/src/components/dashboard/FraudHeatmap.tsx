import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from "@/data/mockTransactions";

interface FraudHeatmapProps {
  transactions: Transaction[];
}

export const FraudHeatmap = ({ transactions }: FraudHeatmapProps) => {
  const locationData = transactions.reduce((acc, txn) => {
    const key = txn.location;
    if (!acc[key]) {
      acc[key] = { location: key, fraud: 0, total: 0 };
    }
    acc[key].total++;
    if (txn.isFraud) {
      acc[key].fraud++;
    }
    return acc;
  }, {} as Record<string, { location: string; fraud: number; total: number }>);

  const data = Object.values(locationData)
    .map(d => ({
      location: d.location,
      fraudRate: (d.fraud / d.total) * 100,
      count: d.total,
    }))
    .sort((a, b) => b.fraudRate - a.fraudRate);

  const getColor = (rate: number) => {
    if (rate > 12) return "bg-destructive";
    if (rate > 8) return "bg-warning";
    if (rate > 5) return "bg-accent";
    return "bg-success";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fraud Rate by Location</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {data.map((item) => (
            <div
              key={item.location}
              className={`${getColor(item.fraudRate)} text-white p-4 rounded-lg transition-transform hover:scale-105`}
            >
              <div className="font-semibold text-sm mb-1">{item.location}</div>
              <div className="text-2xl font-bold">{item.fraudRate.toFixed(1)}%</div>
              <div className="text-xs opacity-90">{item.count} transactions</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
