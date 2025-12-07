import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppShell from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Filter, Download, Calendar } from "lucide-react";
import { fetchTransactions } from "@/services/api";

interface Transaction {
  transaction_id: string;
  customer_id: string;
  amount: number;
  merchant_name: string;
  transaction_type: string;
  transaction_time: string;
  location: string;
  device_type: string;
  risk_score: number;
  is_fraud: boolean;
}

const TransactionSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [limit, setLimit] = useState<number>(500);
  const [filters, setFilters] = useState({
    dateRange: "all",
    minAmount: "",
    maxAmount: "",
    channel: "all",
    riskLevel: "all",
  });

  // Fetch real transaction data from API with filters applied
  const { data: transactionResponse, isLoading, refetch } = useQuery({
    queryKey: ["search-transactions", limit, filters.channel, filters.riskLevel],
    queryFn: async () => {
      // Build API filters
      const isFraud = filters.riskLevel === "all" ? undefined :
        filters.riskLevel === "high" ? 1 :
          filters.riskLevel === "low" ? 0 : undefined;

      // Map channel to API format (Mobile, Web, ATM, POS)
      let channel: string | undefined;
      if (filters.channel !== "all") {
        channel = filters.channel.charAt(0).toUpperCase() + filters.channel.slice(1);
        // Handle special cases
        if (channel === "Atm") channel = "ATM";
        if (channel === "Pos") channel = "POS";
      }

      console.log('Fetching transactions with filters:', { limit, isFraud, channel });
      const response = await fetchTransactions(0, limit, isFraud, channel);
      console.log('Received transactions:', response.transactions?.length);
      return response;
    },
  });

  // Map API response to expected format with null safety
  const transactions: Transaction[] = (transactionResponse?.transactions || []).map((txn: any) => ({
    transaction_id: txn.transaction_id || `TXN${Math.random().toString(36).substr(2, 9)}`,
    customer_id: txn.customer_id || "Unknown",
    amount: txn.amount ?? txn.transaction_amount ?? 0,
    merchant_name: txn.merchant_name || txn.merchant || "Unknown Merchant",
    transaction_type: txn.channel || txn.transaction_type || "Mobile",
    transaction_time: txn.created_at || txn.timestamp || txn.transaction_time || new Date().toISOString(),
    location: txn.location || "Unknown",
    device_type: txn.channel || txn.device_type || "Mobile",
    risk_score: txn.fraud_probability ?? txn.risk_score ?? (txn.is_fraud === 1 ? 0.95 : 0.05),
    is_fraud: txn.is_fraud === 1,
  }));

  const filteredTransactions = transactions?.filter((txn) => {
    // Search across ALL columns
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      txn.transaction_id.toLowerCase().includes(searchLower) ||
      txn.customer_id.toLowerCase().includes(searchLower) ||
      txn.amount.toString().includes(searchLower) ||
      txn.transaction_type.toLowerCase().includes(searchLower) ||
      txn.device_type.toLowerCase().includes(searchLower) ||
      txn.location.toLowerCase().includes(searchLower) ||
      new Date(txn.transaction_time).toLocaleString().toLowerCase().includes(searchLower) ||
      (txn.is_fraud ? "fraud" : "legitimate").includes(searchLower);

    const matchesAmount =
      (!filters.minAmount || filters.minAmount.trim() === "" || txn.amount >= parseFloat(filters.minAmount)) &&
      (!filters.maxAmount || filters.maxAmount.trim() === "" || txn.amount <= parseFloat(filters.maxAmount));

    // Date range filtering
    let matchesDate = true;
    if (filters.dateRange !== "all") {
      const txnDate = new Date(txn.transaction_time);
      const now = new Date();

      // Check if date is valid
      if (!isNaN(txnDate.getTime())) {
        const diffMs = now.getTime() - txnDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (filters.dateRange === "today") {
          // Check if same day
          matchesDate = txnDate.getFullYear() === now.getFullYear() &&
            txnDate.getMonth() === now.getMonth() &&
            txnDate.getDate() === now.getDate();
        } else if (filters.dateRange === "week") {
          matchesDate = diffDays >= 0 && diffDays <= 7;
        } else if (filters.dateRange === "month") {
          matchesDate = diffDays >= 0 && diffDays <= 30;
        } else if (filters.dateRange === "year") {
          matchesDate = diffDays >= 0 && diffDays <= 365;
        }
      } else {
        matchesDate = false;
      }
    }

    // Medium risk is client-side filter since API only supports fraud/legitimate
    const matchesRisk =
      filters.riskLevel === "all" ||
      filters.riskLevel === "medium" ||
      (filters.riskLevel === "high" && txn.is_fraud) ||
      (filters.riskLevel === "low" && !txn.is_fraud);

    // Apply medium risk filter on client side
    const matchesMediumRisk =
      filters.riskLevel !== "medium" ||
      (txn.risk_score >= 0.4 && txn.risk_score < 0.7);

    return matchesSearch && matchesAmount && matchesDate && matchesRisk && matchesMediumRisk;
  });

  const handleExport = () => {
    if (!filteredTransactions) return;

    const csv = [
      ["Transaction ID", "Customer ID", "Amount", "Type", "Time", "Location", "Device", "Risk Score", "Fraud"],
      ...filteredTransactions.map((txn) => [
        txn.transaction_id,
        txn.customer_id,
        (txn.amount ?? 0).toFixed(2),
        txn.transaction_type,
        txn.transaction_time,
        txn.location,
        txn.device_type,
        (txn.risk_score ?? 0).toFixed(3),
        txn.is_fraud ? "Yes" : "No",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const getRiskColor = (score: number) => {
    if (score >= 0.7) return "text-red-600 bg-red-50";
    if (score >= 0.4) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  return (
    <AppShell
      title="Transaction Search"
      subtitle="Search and analyze transaction history"
      actions={
        <Button size="sm" onClick={handleExport} className="h-8 text-xs sm:text-sm">
          <Download className="h-4 w-4 mr-1.5" />
          Export
        </Button>
      }
    >
      <div className="space-y-3 sm:space-y-4">
        <Card>
          <CardHeader className="pb-2 sm:pb-6">
            <CardTitle className="text-base sm:text-lg">Search & Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm font-medium">Show:</span>
                <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                  <SelectTrigger className="w-24 sm:w-32 text-xs sm:text-sm h-8 sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 txns</SelectItem>
                    <SelectItem value="100">100 txns</SelectItem>
                    <SelectItem value="500">500 txns</SelectItem>
                    <SelectItem value="1000">1000 txns</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                <Select
                  value={filters.dateRange}
                  onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
                >
                  <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <SelectValue placeholder="Date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">7 Days</SelectItem>
                    <SelectItem value="month">30 Days</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Min Amt"
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                  className="text-xs sm:text-sm h-8 sm:h-10"
                />

                <Input
                  placeholder="Max Amt"
                  type="number"
                  value={filters.maxAmount}
                  onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                  className="text-xs sm:text-sm h-8 sm:h-10"
                />

                <Select
                  value={filters.channel}
                  onValueChange={(value) => setFilters({ ...filters, channel: value })}
                >
                  <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10">
                    <SelectValue placeholder="Channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Channels</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="web">Web</SelectItem>
                    <SelectItem value="atm">ATM</SelectItem>
                    <SelectItem value="pos">POS</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filters.riskLevel}
                  onValueChange={(value) => setFilters({ ...filters, riskLevel: value })}
                >
                  <SelectTrigger className="text-xs sm:text-sm h-8 sm:h-10">
                    <SelectValue placeholder="Risk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm text-muted-foreground">
                <span>
                  {isLoading ? (
                    "Loading..."
                  ) : (
                    <>{filteredTransactions?.length || 0} of {transactions?.length || 0} txns</>
                  )}
                </span>
                {(searchQuery || filters.dateRange !== "all" || filters.minAmount || filters.maxAmount || filters.channel !== "all" || filters.riskLevel !== "all") && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 sm:h-8 text-xs sm:text-sm"
                    onClick={() => {
                      setSearchQuery("");
                      setFilters({
                        dateRange: "all",
                        minAmount: "",
                        maxAmount: "",
                        channel: "all",
                        riskLevel: "all",
                      });
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 sm:pb-4 px-3 sm:px-6">
            <CardTitle className="text-sm sm:text-base lg:text-lg">Transactions</CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-6 pb-3 sm:pb-6">
            <ScrollArea className="h-[400px] sm:h-[500px]">
              <div className="overflow-x-auto px-3 sm:px-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/50">
                      <TableHead className="text-[10px] sm:text-xs font-medium w-[90px] sm:w-auto">ID</TableHead>
                      <TableHead className="text-[10px] sm:text-xs font-medium text-right w-[70px] sm:w-auto">Amount</TableHead>
                      <TableHead className="text-[10px] sm:text-xs font-medium text-center w-[50px] sm:w-auto">Risk</TableHead>
                      <TableHead className="text-[10px] sm:text-xs font-medium text-center w-[50px] sm:w-auto">Status</TableHead>
                      <TableHead className="text-[10px] sm:text-xs font-medium hidden sm:table-cell">Customer</TableHead>
                      <TableHead className="text-[10px] sm:text-xs font-medium hidden md:table-cell">Type</TableHead>
                      <TableHead className="text-[10px] sm:text-xs font-medium hidden lg:table-cell">Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions?.map((txn) => (
                      <TableRow
                        key={txn.transaction_id}
                        onClick={() => setSelectedTransaction(txn)}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-mono text-[10px] sm:text-xs py-2.5">
                          <span className="truncate block max-w-[80px] sm:max-w-[120px]">{txn.transaction_id.slice(-8)}</span>
                        </TableCell>
                        <TableCell className="font-medium text-[10px] sm:text-xs text-right py-2.5">
                          ₹{(txn.amount ?? 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center py-2.5">
                          <span className={`text-[10px] sm:text-xs font-medium ${(txn.risk_score ?? 0) > 0.5 ? 'text-red-500' : 'text-green-500'}`}>
                            {((txn.risk_score ?? 0) * 100).toFixed(0)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center py-2.5">
                          <span className={`text-[10px] sm:text-xs font-medium ${txn.is_fraud ? 'text-red-500' : 'text-green-500'}`}>
                            {txn.is_fraud ? "Fraud" : "Legitimate"}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-[10px] sm:text-xs hidden sm:table-cell py-2.5">{txn.customer_id}</TableCell>
                        <TableCell className="capitalize text-[10px] sm:text-xs hidden md:table-cell py-2.5">{txn.transaction_type}</TableCell>
                        <TableCell className="text-[10px] sm:text-xs hidden lg:table-cell py-2.5">{new Date(txn.transaction_time).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedTransaction} onOpenChange={(open) => !open && setSelectedTransaction(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Transaction Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs sm:text-sm">Transaction ID</Label>
                  <p className="font-mono text-xs sm:text-sm truncate">{selectedTransaction.transaction_id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs sm:text-sm">Customer ID</Label>
                  <p className="font-mono text-xs sm:text-sm">{selectedTransaction.customer_id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs sm:text-sm">Amount</Label>
                  <p className="text-lg sm:text-xl font-bold">₹{(selectedTransaction.amount ?? 0).toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs sm:text-sm">Risk Score</Label>
                  <Badge className={`${getRiskColor(selectedTransaction.risk_score ?? 0)} text-xs sm:text-sm`}>
                    {((selectedTransaction.risk_score ?? 0) * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs sm:text-sm">Merchant</Label>
                  <p className="text-xs sm:text-sm">{selectedTransaction.merchant_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs sm:text-sm">Type</Label>
                  <p className="capitalize text-xs sm:text-sm">{selectedTransaction.transaction_type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs sm:text-sm">Location</Label>
                  <p className="text-xs sm:text-sm">{selectedTransaction.location}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs sm:text-sm">Device</Label>
                  <p className="capitalize text-xs sm:text-sm">{selectedTransaction.device_type}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground text-xs sm:text-sm">Timestamp</Label>
                  <p className="text-xs sm:text-sm">{new Date(selectedTransaction.transaction_time).toLocaleString()}</p>
                </div>
              </div>

              <div className="pt-3 sm:pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium">Fraud Status</span>
                  {selectedTransaction.is_fraud ? (
                    <Badge variant="destructive" className="text-xs sm:text-base">Fraudulent</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs sm:text-base">Legitimate</Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

const Label = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <label className={`text-sm font-medium ${className}`}>{children}</label>
);

export default TransactionSearch;
