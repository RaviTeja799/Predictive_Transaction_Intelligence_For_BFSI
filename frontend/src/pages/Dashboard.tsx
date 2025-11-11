import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  IndianRupee,
  Users,
  AlertTriangle,
  TrendingDown,
  Download,
  RefreshCw,
  Shield,
  Home,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { FraudDistributionChart } from "@/components/dashboard/FraudDistributionChart";
import { FraudTrendChart } from "@/components/dashboard/FraudTrendChart";
import { FraudByTypeChart } from "@/components/dashboard/FraudByTypeChart";
import { FraudHeatmap } from "@/components/dashboard/FraudHeatmap";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { TransactionsTable } from "@/components/dashboard/TransactionsTable";
import { ModelPerformance } from "@/components/dashboard/ModelPerformance";
import { mockTransactions, modelMetrics, Transaction } from "@/data/mockTransactions";
import { loadTransactionsFromCSV } from "@/utils/csvParser";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState("all");
  const [transactionType, setTransactionType] = useState("all");
  
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const csvTransactions = await loadTransactionsFromCSV();
      if (csvTransactions.length > 0) {
        setTransactions(csvTransactions);
        toast.success(`Loaded ${csvTransactions.length} transactions from dataset`);
      } else {
        setTransactions(mockTransactions);
        toast.info("Using sample data");
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (timeRange !== "all") {
      const now = new Date();
      const ranges: Record<string, number> = {
        today: 1,
        week: 7,
        month: 30,
        quarter: 90,
        year: 365,
      };
      const daysBack = ranges[timeRange];
      const cutoffDate = new Date(now.setDate(now.getDate() - daysBack));
      filtered = filtered.filter((t) => new Date(t.date) >= cutoffDate);
    }

    if (transactionType !== "all") {
      filtered = filtered.filter((t) => t.type === transactionType);
    }

    

    return filtered;
  }, [transactions, timeRange, transactionType]);

  const stats = useMemo(() => {
    const total = filteredTransactions.length;
    const fraudCount = filteredTransactions.filter((t) => t.isFraud).length;
    const legitimateCount = total - fraudCount;
    const totalAmount = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
    const avgAmount = totalAmount / total;
    const maxAmount = Math.max(...filteredTransactions.map((t) => t.amount));
    const minAmount = Math.min(...filteredTransactions.map((t) => t.amount));
    const fraudRate = (fraudCount / total) * 100;
    const uniqueCustomers = new Set(filteredTransactions.map((t) => t.id.split("_")[0])).size;

    return {
      total,
      fraudCount,
      legitimateCount,
      totalAmount,
      avgAmount,
      maxAmount,
      minAmount,
      fraudRate,
      uniqueCustomers,
    };
  }, [filteredTransactions]);

  const handleDownloadReport = () => {
    const csvContent = [
      ["Transaction ID", "Date", "Amount", "Type", "Channel", "Fraud Status", "Risk Score"],
      ...filteredTransactions.map((t) => [
        t.id,
        t.date,
        t.amount,
        t.type,
        t.channel,
        t.isFraud ? "Fraud" : "Legitimate",
        (t.fraudProbability * 100).toFixed(2) + "%",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fraud-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Report downloaded successfully!");
  };

  const handleRefresh = async () => {
    const csvTransactions = await loadTransactionsFromCSV();
    if (csvTransactions.length > 0) {
      setTransactions(csvTransactions);
    }
    toast.info("Dashboard refreshed");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading transaction data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
                <Shield className="h-8 w-8" />
                Predictive Transaction Intelligence
              </h1>
              <p className="text-muted-foreground mt-1">
                BFSI Fraud Detection Dashboard — Real-time Analytics & Insights
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button size="sm" onClick={handleDownloadReport}>
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <FilterBar
          timeRange={timeRange}
          transactionType={transactionType}
         
          onTimeRangeChange={setTimeRange}
          onTransactionTypeChange={setTransactionType}
       
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Transactions"
            value={stats.total.toLocaleString()}
            subtitle="Processed transactions"
            icon={IndianRupee}
            variant="default"
          />
          <MetricCard
            title="Total Customers"
            value="5000"
            subtitle="Active accounts"
            icon={Users}
            variant="default"
          />
          <MetricCard
            title="Fraud Cases"
            value={stats.fraudCount.toLocaleString()}
            subtitle={`${stats.fraudRate.toFixed(2)}% of total`}
            icon={AlertTriangle}
            variant="danger"
          />
          <MetricCard
            title="Fraud Detection"
            value={`${stats.fraudRate.toFixed(2)}%`}
            // subtitle="Model accuracy: 90%"
            icon={TrendingDown}
            variant="warning"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MetricCard
            title="Average Transaction"
            value={`₹${Math.round(stats.avgAmount).toLocaleString()}`}
            icon={IndianRupee}
            variant="default"
          />
          <MetricCard
            title="Maximum Transaction"
            value={`₹${Math.round(stats.maxAmount).toLocaleString()}`}
            icon={IndianRupee}
            variant="success"
          />
          <MetricCard
            title="Minimum Transaction"
            value={`₹${Math.round(stats.minAmount).toLocaleString()}`}
            icon={IndianRupee}
            variant="default"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FraudDistributionChart
            fraudCount={stats.fraudCount}
            legitimateCount={stats.legitimateCount}
          />
          <ModelPerformance {...modelMetrics} />
        </div>

        <FraudTrendChart transactions={filteredTransactions} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FraudByTypeChart transactions={filteredTransactions} />
          <FraudHeatmap transactions={filteredTransactions} />
        </div>

        <TransactionsTable transactions={filteredTransactions} showFraudOnly />

        <TransactionsTable transactions={filteredTransactions} />
      </main>

      <footer className="border-t bg-card mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p className="font-medium">Developed by Team Predictive Intelligence</p>
            <p className="mt-1">BFSI Fraud Detection System</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
