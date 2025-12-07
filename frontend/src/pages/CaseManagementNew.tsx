import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import AppShell from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { storeSimulationTransactionsBatch, SimulationTransaction } from "@/services/api";
import { Database, ThumbsUp, ThumbsDown, CheckCircle } from "lucide-react";
import { useTransactionStore } from "@/context/TransactionStoreContext";

const CaseManagement = () => {
  const queryClient = useQueryClient();
  const [savingToMongo, setSavingToMongo] = useState(false);

  // Transaction Store for Simulation/Model Testing workflow
  const {
    pendingTransactions,
    verifiedTransactions,
    markTransactionVerified,
    clearVerifiedTransactions,
    getPendingCount,
    getVerifiedCount
  } = useTransactionStore();

  // Feedback loop for simulation/model testing transactions
  const handleMarkCorrect = (id: string) => {
    const txn = pendingTransactions.find((t) => t.id === id);
    if (!txn) return;

    const actualLabel = txn.prediction.prediction as "Fraud" | "Legitimate";
    markTransactionVerified(id, true, actualLabel, "Verified as correct");
    toast.success("Transaction verified as correct");
  };

  const handleMarkIncorrect = (id: string) => {
    const txn = pendingTransactions.find((t) => t.id === id);
    if (!txn) return;

    // Flip the label
    const actualLabel = txn.prediction.prediction === "Fraud" ? "Legitimate" : "Fraud";
    markTransactionVerified(id, false, actualLabel, "Corrected by user");
    toast.success("Transaction corrected and verified");
  };

  // Save verified transactions to MongoDB
  const saveVerifiedToMongoDB = async () => {
    if (verifiedTransactions.length === 0) {
      toast.error("No verified transactions to save");
      return;
    }

    setSavingToMongo(true);
    try {
      const transactions: SimulationTransaction[] = verifiedTransactions.map((t) => ({
        transaction_id: t.id,
        customer_id: t.payload.customer_id,
        transaction_amount: t.payload.amount,
        channel: t.payload.channel,
        timestamp: t.payload.timestamp || new Date().toISOString(),
        is_fraud: t.feedback!.actualLabel === "Fraud" ? 1 : 0,
        fraud_probability: t.prediction.risk_score ?? t.prediction.fraud_probability ?? 0,
        risk_level: t.prediction.risk_level || "Low",
        source: t.source,
        account_age_days: t.payload.account_age_days,
        kyc_verified: t.payload.kyc_verified,
        hour: t.payload.hour,
      }));

      const result = await storeSimulationTransactionsBatch(transactions);
      toast.success(`Saved ${result.stored_count} verified transactions to MongoDB`);
      clearVerifiedTransactions(verifiedTransactions.map((t) => t.id));
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    } catch (error: any) {
      toast.error(`Failed to save: ${error.message}`);
    } finally {
      setSavingToMongo(false);
    }
  };



  return (
    <AppShell
      title="Case Management"
      subtitle="Transaction verification & feedback loop"
    >
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending" className="text-xs sm:text-sm">
            Pending ({getPendingCount()})
          </TabsTrigger>
          <TabsTrigger value="verified" className="text-xs sm:text-sm">
            Verified ({getVerifiedCount()})
          </TabsTrigger>
        </TabsList>

        {/* NEW: PENDING VERIFICATION TAB */}
        <TabsContent value="pending">
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Pending Verification</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Review predictions and verify before saving to MongoDB
              </p>
            </CardHeader>
            <CardContent>
              {pendingTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-muted-foreground">
                  <Database className="h-10 w-10 sm:h-12 sm:w-12 mb-3 opacity-20" />
                  <p className="text-sm sm:text-base font-semibold">No pending transactions</p>
                  <p className="text-xs sm:text-sm text-center px-4">Run a simulation or model test to generate transactions</p>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="space-y-3 pr-2">
                    {pendingTransactions.map((txn) => (
                      <div
                        key={txn.id}
                        className={`p-3 sm:p-4 rounded-lg border-2 transition-all ${txn.prediction.prediction === "Fraud"
                          ? "border-destructive/50 bg-destructive/5"
                          : "border-border bg-muted/30"
                          }`}
                      >
                        {/* Header Row */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-xs sm:text-sm font-semibold truncate">{txn.id}</span>
                            <Badge variant="secondary" className="text-[10px] shrink-0">{txn.source}</Badge>
                          </div>
                          <Badge
                            variant={txn.prediction.prediction === "Fraud" ? "destructive" : "default"}
                            className="text-[10px] sm:text-xs shrink-0"
                          >
                            {txn.prediction.prediction}
                          </Badge>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-4 gap-2 text-[10px] sm:text-xs mb-3">
                          <div className="text-center p-1.5 rounded bg-background/50">
                            <p className="text-muted-foreground">Amount</p>
                            <p className="font-semibold">₹{txn.payload.amount.toLocaleString()}</p>
                          </div>
                          <div className="text-center p-1.5 rounded bg-background/50">
                            <p className="text-muted-foreground">Channel</p>
                            <p className="font-semibold">{txn.payload.channel}</p>
                          </div>
                          <div className="text-center p-1.5 rounded bg-background/50">
                            <p className="text-muted-foreground">Age</p>
                            <p className="font-semibold">{txn.payload.account_age_days}d</p>
                          </div>
                          <div className="text-center p-1.5 rounded bg-background/50">
                            <p className="text-muted-foreground">Risk</p>
                            <p className="font-semibold">{((txn.prediction.risk_score ?? 0) * 100).toFixed(0)}%</p>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleMarkCorrect(txn.id)}
                            className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700 text-white"
                          >
                            <ThumbsUp className="mr-1.5 h-3 w-3" />
                            Correct
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMarkIncorrect(txn.id)}
                            className="flex-1 h-8 text-xs bg-red-600 hover:bg-red-700 text-white"
                          >
                            <ThumbsDown className="mr-1.5 h-3 w-3" />
                            Incorrect
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* NEW: VERIFIED TRANSACTIONS TAB */}
        <TabsContent value="verified">
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <div className="space-y-3">
                <div>
                  <CardTitle className="text-base sm:text-lg">Verified Transactions</CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Ready to save to MongoDB for retraining
                  </p>
                </div>
                <Button
                  onClick={saveVerifiedToMongoDB}
                  disabled={verifiedTransactions.length === 0 || savingToMongo}
                  size="sm"
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md"
                >
                  <Database className="mr-2 h-4 w-4" />
                  {savingToMongo ? "Saving..." : `Save ${verifiedTransactions.length} to MongoDB`}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {verifiedTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-muted-foreground">
                  <CheckCircle className="h-10 w-10 sm:h-12 sm:w-12 mb-3 opacity-20" />
                  <p className="text-sm sm:text-base font-semibold">No verified transactions</p>
                  <p className="text-xs sm:text-sm text-center px-4">Verify transactions from the Pending tab first</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px] sm:h-[600px]">
                  <div className="space-y-2 pr-2">
                    {verifiedTransactions.map((txn) => (
                      <div
                        key={txn.id}
                        className={`p-3 rounded-lg border transition-all ${txn.feedback?.isCorrect
                          ? "border-green-500/50 bg-green-500/10"
                          : "border-orange-500/50 bg-orange-500/10"
                          }`}
                      >
                        {/* Header Row */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-xs font-semibold truncate">{txn.id}</span>
                            <Badge variant="secondary" className="text-[10px] shrink-0">{txn.source}</Badge>
                          </div>
                          {txn.feedback?.isCorrect ? (
                            <Badge className="bg-green-600 text-white text-[10px]">
                              <ThumbsUp className="mr-1 h-2.5 w-2.5" />Correct
                            </Badge>
                          ) : (
                            <Badge className="bg-orange-600 text-white text-[10px]">
                              <ThumbsDown className="mr-1 h-2.5 w-2.5" />Corrected
                            </Badge>
                          )}
                        </div>

                        {/* Details Row */}
                        <div className="grid grid-cols-3 gap-2 text-[10px] sm:text-xs">
                          <div className="text-center p-1.5 rounded bg-background/50">
                            <p className="text-muted-foreground">Amount</p>
                            <p className="font-semibold">₹{txn.payload.amount.toLocaleString()}</p>
                          </div>
                          <div className="text-center p-1.5 rounded bg-background/50">
                            <p className="text-muted-foreground">Model Said</p>
                            <p className="font-semibold">{txn.prediction.prediction}</p>
                          </div>
                          <div className="text-center p-1.5 rounded bg-background/50">
                            <p className="text-muted-foreground">Actual</p>
                            <p className="font-semibold">{txn.feedback?.actualLabel}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
};

export default CaseManagement;
