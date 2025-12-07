import { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Download, AlertTriangle, CheckCircle, Filter } from "lucide-react";
import { toast } from "sonner";
import { fetchAllResults } from "@/services/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PredictionResult {
  transaction_id: string;
  customer_id?: string;
  prediction: string;
  risk_score?: number;
  fraud_probability?: number;
  confidence?: number;
  reason?: string;
  rule_flags?: string[];
  amount?: number;
  channel?: string;
  processed_at?: string;
  predicted_at?: string;
  risk_level?: string;
}

const ResultsHistory = () => {
  const [results, setResults] = useState<PredictionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const data = await fetchAllResults(100, false);
      setResults(data.results || []);
      toast.success(`Loaded ${data.returned || 0} predictions`);
    } catch (error) {
      console.error("Failed to load results:", error);
      toast.error("Failed to load prediction history");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter(result => {
    if (filter === "fraud") return result.prediction === "Fraud";
    if (filter === "legitimate") return result.prediction === "Legitimate";
    return true;
  });

  const fraudCount = results.filter(r => r.prediction === "Fraud").length;
  const legitimateCount = results.length - fraudCount;
  const fraudRate = results.length > 0 ? (fraudCount / results.length) * 100 : 0;

  const handleExport = () => {
    const csvContent = [
      ["Transaction ID", "Customer ID", "Prediction", "Risk Score", "Confidence", "Amount", "Channel", "Reason", "Processed At"],
      ...filteredResults.map(r => {
        const riskScore = r.risk_score ?? r.fraud_probability ?? 0;
        const timestamp = r.processed_at || r.predicted_at;
        return [
          r.transaction_id || "",
          r.customer_id || r.transaction_id || "",
          r.prediction || "",
          (riskScore * 100).toFixed(2) + "%",
          (r.confidence ?? riskScore * 100).toFixed(2) + "%",
          r.amount ?? "N/A",
          r.channel || "N/A",
          r.reason || "",
          timestamp ? new Date(timestamp).toLocaleString() : "N/A"
        ];
      })
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fraud-predictions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Report downloaded successfully!");
  };

  return (
    <AppShell
      title="History"
      subtitle="Fraud detection predictions"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadResults} className="h-8 text-xs sm:text-sm">
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleExport} disabled={filteredResults.length === 0} className="h-8 text-xs sm:text-sm">
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
        </div>
      }
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <Card>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total Predictions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-3 sm:p-6">
            <p className="text-xl sm:text-2xl font-bold">{results.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Fraud Detected
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-3 sm:p-6">
            <p className="text-xl sm:text-2xl font-bold text-red-600">{fraudCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Legitimate
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-3 sm:p-6">
            <p className="text-xl sm:text-2xl font-bold text-green-600">{legitimateCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Fraud Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-3 sm:p-6">
            <p className="text-xl sm:text-2xl font-bold">{fraudRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card className="mb-4 sm:mb-6">
        <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm font-medium">Filter:</span>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[140px] sm:w-[200px] h-8 sm:h-10 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="fraud">Fraud Only</SelectItem>
                  <SelectItem value="legitimate">Legitimate Only</SelectItem>
                </SelectContent>
              </Select>
              {filter !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs sm:text-sm"
                  onClick={() => setFilter("all")}
                >
                  Clear Filter
                </Button>
              )}
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground sm:ml-auto">
              Showing {filteredResults.length} of {results.length} results
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader className="pb-2 sm:pb-4">
          <CardTitle className="text-base sm:text-lg">Prediction Results</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Complete history of fraud detection predictions with ML model + business rules
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="text-center space-y-4">
                <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground text-sm">Loading prediction history...</p>
              </div>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <div className="text-center space-y-2">
                <AlertTriangle className="h-8 w-8 sm:h-12 sm:w-12 mx-auto text-muted-foreground opacity-50" />
                <p className="text-muted-foreground text-sm">No predictions found</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Submit a transaction from the Prediction page to see results here
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Transaction ID</TableHead>
                    <TableHead className="hidden lg:table-cell text-xs">Customer</TableHead>
                    <TableHead className="text-xs">Prediction</TableHead>
                    <TableHead className="text-xs">Risk Score</TableHead>
                    <TableHead className="hidden sm:table-cell text-xs">Amount</TableHead>
                    <TableHead className="hidden md:table-cell text-xs">Channel</TableHead>
                    <TableHead className="hidden lg:table-cell text-xs">Rules Triggered</TableHead>
                    <TableHead className="hidden sm:table-cell text-xs">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((result, idx) => {
                    // Handle both risk_score and fraud_probability from API
                    const riskScore = result.risk_score ?? result.fraud_probability ?? 0;
                    const timestamp = result.processed_at || result.predicted_at;

                    return (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-[10px] sm:text-xs">
                          {(result.transaction_id || "N/A").slice(-8)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs">{result.customer_id || result.transaction_id || "N/A"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={result.prediction === "Fraud" ? "destructive" : "default"}
                            className="flex items-center gap-1 w-fit text-[10px] sm:text-xs"
                          >
                            {result.prediction === "Fraud" ? (
                              <AlertTriangle className="h-3 w-3" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                            {result.prediction}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs ${riskScore > 0.5 ? "text-red-600 font-semibold" : ""}`}>
                            {(riskScore * 100).toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs">
                          {result.amount ? `₹${result.amount.toLocaleString()}` : "N/A"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {result.channel ? (
                            <Badge variant="outline" className="text-xs">{result.channel}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {result.rule_flags && result.rule_flags.length > 0 ? (
                            <Badge variant="secondary" className="text-xs">
                              {result.rule_flags.length} rules
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">None</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                          {timestamp ? new Date(timestamp).toLocaleDateString() : "N/A"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
};

export default ResultsHistory;