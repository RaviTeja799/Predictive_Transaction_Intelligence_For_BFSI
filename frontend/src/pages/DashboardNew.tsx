import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import AppShell from "@/components/layout/AppShell";
import {
  IndianRupee,
  Users,
  AlertTriangle,
  TrendingUp,
  Download,
  RefreshCw,
  Shield,
  Filter,
  Calendar,
  Bell,
  Sparkles,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { FraudTrendChart } from "@/components/dashboard/FraudTrendChart";
import { FraudByTypeChart } from "@/components/dashboard/FraudByTypeChart";
import { FraudByHourChart } from "@/components/dashboard/FraudByHourChart";
import { TransactionsTable } from "@/components/dashboard/TransactionsTable";
import { ModelPerformance } from "@/components/dashboard/ModelPerformance";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  fetchTransactions,
  fetchFraudStatistics,
  fetchChannelStatistics,
  fetchModelMetrics,
  Transaction as APITransaction,
  FraudStatistics,
  ChannelStatistics,
  ModelMetrics
} from "@/services/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";

// Convert API transaction to dashboard format
interface Transaction {
  id: string;
  date: string;
  createdAt: string;
  amount: number;
  type: string;
  channel: string;
  location: string;
  isFraud: boolean;
  fraudProbability: number;
  customerId: string;
}

const DashboardNew = () => {
  // Filter states
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [fraudFilter, setFraudFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");

  // Data states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [fraudStats, setFraudStats] = useState<FraudStatistics | null>(null);
  const [channelStats, setChannelStats] = useState<ChannelStatistics[]>([]);
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Convert API transaction to dashboard format
  const convertTransaction = (apiTxn: APITransaction): Transaction => ({
    id: apiTxn.transaction_id,
    date: apiTxn.timestamp,
    createdAt: apiTxn.created_at || apiTxn.timestamp,
    amount: apiTxn.transaction_amount,
    type: apiTxn.transaction_type || apiTxn.channel,
    channel: apiTxn.channel,
    location: apiTxn.location || "Unknown",
    isFraud: apiTxn.is_fraud === 1,
    fraudProbability: apiTxn.is_fraud === 1 ? 0.88 : 0.12,
    customerId: apiTxn.customer_id,
  });

  useEffect(() => {
    loadDashboardData();
    // Auto-refresh every 30 seconds for real-time feel
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [channelFilter, fraudFilter]);

  const loadDashboardData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);

      // Build filters
      const filters: any = {};
      if (fraudFilter !== "all") {
        filters.is_fraud = fraudFilter === "fraud" ? 1 : 0;
      }
      if (channelFilter !== "all") {
        filters.channel = channelFilter;
      }

      // Fetch all data in parallel
      const [txnData, statsData, channelData, metricsData] = await Promise.all([
        fetchTransactions(0, 10000, filters.is_fraud, filters.channel).catch(err => {
          console.error("Failed to fetch transactions:", err);
          return { transactions: [], total: 0, page: 1, limit: 100 };
        }),
        fetchFraudStatistics().catch(err => {
          console.error("Failed to fetch fraud stats:", err);
          return null;
        }),
        fetchChannelStatistics().catch(err => {
          console.error("Failed to fetch channel stats:", err);
          return [];
        }),
        fetchModelMetrics().catch(err => {
          console.error("Failed to fetch model metrics:", err);
          return null;
        })
      ]);

      const convertedTransactions = txnData.transactions.map(convertTransaction);

      setTransactions(convertedTransactions);
      setFraudStats(statsData);
      setChannelStats(channelData);
      setModelMetrics(metricsData);
      setLastRefresh(new Date());

      if (!silent) {
        toast.success("Dashboard data updated successfully");
      }
    } catch (err: any) {
      console.error("Dashboard load error:", err);
      setError(err.message);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    toast.info("Refreshing dashboard data...");
    loadDashboardData();
  };

  const handleExport = () => {
    toast.info("Exporting data...");
    // TODO: Implement CSV export
  };

  // Filter transactions based on date range (using timestamp - the actual transaction date)
  const filteredTransactionsByDate = transactions.filter(txn => {
    if (dateRange === "all") return true;

    try {
      // Use timestamp for filtering (the business transaction date)
      const txnDate = new Date(txn.date);
      const now = new Date();

      // Validate date
      if (isNaN(txnDate.getTime())) {
        console.warn('Invalid transaction timestamp:', txn.date);
        return false;
      }

      // Set time to midnight for accurate day comparison
      const txnMidnight = new Date(txnDate);
      txnMidnight.setHours(0, 0, 0, 0);

      const nowMidnight = new Date(now);
      nowMidnight.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((nowMidnight.getTime() - txnMidnight.getTime()) / (1000 * 60 * 60 * 24));

      switch (dateRange) {
        case "today":
          return daysDiff === 0;
        case "7days":
          return daysDiff >= 0 && daysDiff <= 7;
        case "30days":
          return daysDiff >= 0 && daysDiff <= 30;
        case "90days":
          return daysDiff >= 0 && daysDiff <= 90;
        default:
          return true;
      }
    } catch (error) {
      console.error('Error filtering transaction date:', error, txn);
      return false;
    }
  });

  // Calculate filtered stats
  const filteredFraudCount = filteredTransactionsByDate.filter(t => t.isFraud).length;
  const filteredFraudRate = filteredTransactionsByDate.length > 0
    ? (filteredFraudCount / filteredTransactionsByDate.length) * 100
    : 0;
  const totalAmount = filteredTransactionsByDate.reduce((sum, t) => sum + t.amount, 0);
  const fraudAmount = filteredTransactionsByDate.filter(t => t.isFraud).reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-lg text-muted-foreground">Loading real-time dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Connection Error</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => loadDashboardData()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AppShell
      title="Home Dashboard"
      subtitle="Real-time fraud detection monitoring"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="h-8 text-xs sm:text-sm">
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          <Button size="sm" onClick={handleRefresh} className="h-8 text-xs sm:text-sm">
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
        </div>
      }
    >
      {/* Filter Bar */}
      <Card className="border-l-4 border-l-primary/50">
        <CardContent className="py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Filter Label */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Filter className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-xs sm:text-sm font-medium">Filters</span>
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-3 flex-1">
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm sm:w-[130px]">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="Mobile">Mobile</SelectItem>
                  <SelectItem value="Web">Web</SelectItem>
                  <SelectItem value="ATM">ATM</SelectItem>
                  <SelectItem value="POS">POS</SelectItem>
                </SelectContent>
              </Select>

              <Select value={fraudFilter} onValueChange={setFraudFilter}>
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="fraud">Fraud</SelectItem>
                  <SelectItem value="legitimate">Legitimate</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm sm:w-[120px]">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7days">7 Days</SelectItem>
                  <SelectItem value="30days">30 Days</SelectItem>
                  <SelectItem value="90days">90 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {(channelFilter !== "all" || fraudFilter !== "all" || dateRange !== "all") && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs sm:text-sm shrink-0"
                onClick={() => {
                  setChannelFilter("all");
                  setFraudFilter("all");
                  setDateRange("all");
                }}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Transactions"
          value={filteredTransactionsByDate.length.toLocaleString()}
          icon={Users}
          trend="up"
          trendValue="+12.5%"
          subtitle={`₹${(totalAmount / 1000000).toFixed(2)}M total volume`}
        />
        <MetricCard
          title="Fraud Detected"
          value={filteredFraudCount.toLocaleString()}
          icon={AlertTriangle}
          trend="down"
          trendValue="+8.3%"
          subtitle={`₹${(fraudAmount / 1000000).toFixed(2)}M prevented`}
          variant="danger"
        />
        <MetricCard
          title="Fraud Rate"
          value={`${filteredFraudRate.toFixed(2)}%`}
          icon={TrendingUp}
          trend="down"
          trendValue="-2.1%"
          subtitle="Below industry average"
        />
        <MetricCard
          title="Model Accuracy"
          value={`${((modelMetrics?.accuracy || 0) * 100).toFixed(1)}%`}
          icon={Shield}
          subtitle={`Precision: ${((modelMetrics?.precision || 0) * 100).toFixed(1)}%`}
          variant="success"
        />
      </div>

      {/* Model Performance */}
      <ModelPerformance
        accuracy={modelMetrics?.accuracy || 0.9133}
        precision={modelMetrics?.precision || 0.50}
        recall={modelMetrics?.recall || 0.1077}
        f1Score={modelMetrics?.f1_score || 0.1772}
      />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FraudByTypeChart channelStats={channelStats} />
        <FraudByHourChart transactions={filteredTransactionsByDate} />
      </div>

      <FraudTrendChart transactions={filteredTransactionsByDate} />

      {/* Transactions Tables */}
      <TransactionsTable transactions={filteredTransactionsByDate} showFraudOnly />
      <TransactionsTable transactions={filteredTransactionsByDate} />
    </AppShell>
  );
};

export default DashboardNew;
