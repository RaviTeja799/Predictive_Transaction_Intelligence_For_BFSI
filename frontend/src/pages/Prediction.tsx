import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, AlertTriangle, CheckCircle, Brain, Sparkles, RefreshCw, ThumbsUp, ThumbsDown, MessageSquare, ArrowRight, Mail, Bell } from "lucide-react";
import { toast } from "sonner";
import { predictFraud, PredictionRequest, PredictionResponse, getLLMExplanation, submitFeedback } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useTransactionStore } from "@/context/TransactionStoreContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PredictionPage = () => {
  const navigate = useNavigate();
  const { addPendingTransaction, getPendingCount } = useTransactionStore();
  const [loading, setLoading] = useState(false);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmExplanation, setLlmExplanation] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [showFeedbackNotes, setShowFeedbackNotes] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [formData, setFormData] = useState<PredictionRequest>({
    customer_id: "",
    account_age_days: 365,
    amount: 5000,              // Changed from transaction_amount
    channel: "Mobile",
    kyc_verified: "Yes",
    hour: new Date().getHours(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPrediction(null);
    setLlmExplanation(null);  // Clear LLM explanation for new prediction
    setFeedbackSubmitted(null);  // Reset feedback state
    setFeedbackNotes("");
    setShowFeedbackNotes(false);
    setAlertSent(false);

    try {
      const result = await predictFraud(formData);
      setPrediction(result);

      // Auto-send to Case Management for verification
      addPendingTransaction({
        id: result.transaction_id,
        source: 'model_testing',
        payload: formData,
        prediction: result,
        createdAt: Date.now(),
      });

      if (result.prediction === "Fraud") {
        toast.error("⚠️ High Risk Transaction Detected!");
        // Show email alert dialog for fraud detection
        setTimeout(() => {
          setShowAlertDialog(true);
          setTimeout(() => {
            setAlertSent(true);
          }, 1500);
        }, 500);
      } else {
        toast.success("✓ Transaction Appears Legitimate");
      }

      toast.info("Result sent to Case Management for verification");
    } catch (error: any) {
      console.error("Prediction error:", error);
      toast.error("Failed to analyze transaction. Please check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleGetLLMExplanation = async () => {
    if (!prediction) return;

    setLlmLoading(true);
    try {
      const response = await getLLMExplanation({
        transaction_id: prediction.transaction_id,
        customer_id: formData.customer_id,
        amount: formData.amount,
        channel: formData.channel,
        account_age_days: formData.account_age_days,
        kyc_verified: formData.kyc_verified,
        hour: formData.hour || 0,
        prediction: prediction.prediction,
        risk_score: prediction.risk_score,
        risk_level: prediction.risk_level || (prediction.risk_score >= 0.7 ? "High" : prediction.risk_score >= 0.4 ? "Medium" : "Low"),
        risk_factors: prediction.rule_flags || [],
      });
      setLlmExplanation(response.explanation);
      toast.success("AI explanation generated!");
    } catch (error) {
      toast.error("Failed to generate AI explanation");
    } finally {
      setLlmLoading(false);
    }
  };

  const handleFeedback = async (isCorrect: boolean) => {
    if (!prediction) return;

    setFeedbackLoading(true);
    try {
      await submitFeedback({
        transaction_id: prediction.transaction_id,
        prediction: prediction.prediction,
        is_correct: isCorrect,
        risk_score: prediction.risk_score,
        notes: feedbackNotes || undefined,
      });

      setFeedbackSubmitted(isCorrect);

      if (isCorrect) {
        toast.success("✓ Feedback recorded: Prediction marked as correct");
      } else {
        toast.info("Feedback recorded: Prediction marked as incorrect - flagged for review");
      }
    } catch (error) {
      toast.error("Failed to submit feedback");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleInputChange = (field: keyof PredictionRequest, value: any) => {
    if (field === 'account_age_days' || field === 'amount' || field === 'hour') {
      const numValue = parseFloat(value);
      setFormData(prev => ({ ...prev, [field]: isNaN(numValue) ? 0 : numValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const getRiskColor = (prediction: string) => {
    if (prediction === "Fraud") {
      return "border-red-500 bg-red-500/10 dark:bg-red-950/30";
    }
    return "border-green-500 bg-green-500/10 dark:bg-green-950/30";
  };

  const getRiskIcon = (prediction: string) => {
    return prediction === "Fraud"
      ? <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
      : <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />;
  };

  return (
    <AppShell
      title="Model Testing"
      subtitle="Single transaction fraud prediction and analysis"
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setPrediction(null)}
            disabled={!prediction}
            className="h-8 px-3 text-xs sm:text-sm"
          >
            New
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/cases')}
            disabled={getPendingCount() === 0}
            className="h-8 px-3 text-xs sm:text-sm"
          >
            <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
            Cases ({getPendingCount()})
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>Enter transaction information to analyze fraud risk</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="customer_id" className="text-sm">Customer ID</Label>
                <Input
                  id="customer_id"
                  placeholder="e.g., CUST_12345"
                  value={formData.customer_id}
                  onChange={(e) => handleInputChange("customer_id", e.target.value)}
                  required
                  className="text-sm sm:text-base text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="amount" className="text-sm">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="5000"
                    value={formData.amount}
                    onChange={(e) => handleInputChange("amount", parseFloat(e.target.value))}
                    required
                    className="text-sm sm:text-base"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="account_age_days" className="text-sm">Account Age</Label>
                  <Input
                    id="account_age_days"
                    type="number"
                    min="0"
                    placeholder="365"
                    value={formData.account_age_days}
                    onChange={(e) => handleInputChange("account_age_days", parseInt(e.target.value))}
                    required
                    className="text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="channel" className="text-sm">Channel</Label>
                  <Select value={formData.channel} onValueChange={(value) => handleInputChange("channel", value)}>
                    <SelectTrigger id="channel" className="text-sm sm:text-base">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mobile">Mobile</SelectItem>
                      <SelectItem value="Web">Web</SelectItem>
                      <SelectItem value="ATM">ATM</SelectItem>
                      <SelectItem value="POS">POS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="kyc_verified" className="text-sm">KYC Status</Label>
                  <Select value={formData.kyc_verified} onValueChange={(value) => handleInputChange("kyc_verified", value)}>
                    <SelectTrigger id="kyc_verified" className="text-sm sm:text-base">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Verified</SelectItem>
                      <SelectItem value="No">Not Verified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="hour" className="text-sm">Transaction Hour (0-23)</Label>
                <Input
                  id="hour"
                  type="number"
                  min="0"
                  max="23"
                  placeholder="e.g., 14"
                  value={formData.hour}
                  onChange={(e) => handleInputChange("hour", parseInt(e.target.value))}
                  className="text-sm sm:text-base"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Analyze Transaction
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prediction Result</CardTitle>
            <CardDescription>ML model analysis with business rules</CardDescription>
          </CardHeader>
          <CardContent>
            {!prediction && !loading && (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                <div className="text-center space-y-2">
                  <Shield className="h-16 w-16 mx-auto opacity-20" />
                  <p>Submit a transaction to see prediction results</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
                  <p className="text-muted-foreground">Analyzing transaction...</p>
                </div>
              </div>
            )}

            {prediction && !loading && (
              <div className="space-y-4 sm:space-y-6">
                {/* Main Prediction Result */}
                <div className={`border-2 rounded-lg p-4 sm:p-6 ${getRiskColor(prediction.prediction)}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {getRiskIcon(prediction.prediction)}
                      <div>
                        <h3 className="text-lg sm:text-2xl font-bold">
                          {prediction.prediction === "Fraud" ? (
                            <span className="text-red-600 dark:text-red-400">FRAUD DETECTED</span>
                          ) : (
                            <span className="text-green-600 dark:text-green-400">Legitimate</span>
                          )}
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {prediction.risk_level === "High" ? "High Risk Transaction" :
                            prediction.risk_level === "Medium" ? "Medium Risk Transaction" :
                              "Low Risk Transaction"}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                      <Badge
                        variant={prediction.risk_level === "High" ? "destructive" :
                          prediction.risk_level === "Medium" ? "secondary" : "outline"}
                        className="text-sm sm:text-lg px-2 sm:px-4 py-1 sm:py-2 font-bold"
                      >
                        {prediction.risk_level || "Low"} Risk
                      </Badge>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {(prediction.risk_score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transaction ID and Confidence */}
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  <Card className="bg-card/50">
                    <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                      <CardTitle className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">
                        Transaction ID
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                      <p className="text-sm sm:text-xl font-bold font-mono text-foreground truncate">{prediction.transaction_id}</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50">
                    <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                      <CardTitle className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">
                        Confidence
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                      <p className="text-sm sm:text-xl font-bold text-primary">{prediction.confidence.toFixed(1)}%</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Decision Reason - NEW from Task 1 */}
                {prediction.reason && (
                  <Card className="border-l-4 border-l-warning bg-warning/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        Decision Reason
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-foreground">{prediction.reason}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Business Rules Triggered - NEW from Task 1 */}
                {prediction.rule_flags && prediction.rule_flags.length > 0 && (
                  <Card className="border-l-4 border-l-destructive bg-destructive/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4 text-destructive" />
                        Business Rules Triggered ({prediction.rule_flags.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {prediction.rule_flags.map((flag, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs bg-background border-destructive text-destructive font-medium"
                          >
                            {flag.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* LLM-Powered Explanation - Milestone 3 */}
                <Card className="border-l-4 border-l-purple-500 bg-purple-500/5 dark:bg-purple-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        AI-Powered Explanation
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleGetLLMExplanation}
                        disabled={llmLoading}
                        className="h-7 text-xs"
                      >
                        {llmLoading ? (
                          <>
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3 mr-1" />
                            {llmExplanation ? "Regenerate" : "Generate"}
                          </>
                        )}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {llmExplanation ? (
                      <p className="text-sm leading-relaxed text-foreground">{llmExplanation}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Click "Generate" to get an AI-powered natural language explanation of this prediction using Google Gemini.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Analysis Details */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Analysis Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer ID:</span>
                      <span className="font-medium">{formData.customer_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-medium">₹{formData.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Channel:</span>
                      <span className="font-medium">{formData.channel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">KYC Status:</span>
                      <span className="font-medium">{formData.kyc_verified}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Age:</span>
                      <span className="font-medium">{formData.account_age_days} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Model Version:</span>
                      <span className="font-medium">{prediction.model_version || "RandomForest"}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Button */}
                <Button
                  onClick={() => setPrediction(null)}
                  variant="outline"
                  className="w-full"
                >
                  Analyze Another Transaction
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Email Alert Dialog */}
      <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              High-Risk Transaction Alert
            </DialogTitle>
            <DialogDescription>
              Automated security alert system
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Alert Animation */}
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className={`absolute inset-0 ${alertSent ? 'animate-ping' : ''}`}>
                  <div className="rounded-full h-20 w-20 bg-red-500/20"></div>
                </div>
                <div className="relative flex items-center justify-center h-20 w-20 rounded-full bg-red-500/10 border-2 border-red-500">
                  {!alertSent ? (
                    <Mail className="h-10 w-10 text-red-600 dark:text-red-400 animate-pulse" />
                  ) : (
                    <CheckCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Alert Status */}
            <div className="text-center space-y-2">
              {!alertSent ? (
                <>
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500" />
                    <p className="font-medium">Sending alert notifications...</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Notifying security team and risk managers
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                    <Bell className="h-4 w-4" />
                    <p className="font-semibold">Alert sent successfully!</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Security team has been notified via email
                  </p>
                </>
              )}
            </div>

            {/* Alert Details */}
            {alertSent && prediction && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction ID:</span>
                  <span className="font-mono font-medium">{prediction.transaction_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Risk Score:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {(prediction.risk_score * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-medium">₹{formData.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Channel:</span>
                  <span className="font-medium">{formData.channel}</span>
                </div>
              </div>
            )}

            {/* Recipients */}
            {alertSent && (
              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground mb-2">Alert sent to:</p>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>security@bank.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>risk-management@bank.com</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>fraud-detection@bank.com</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {alertSent && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAlertDialog(false)}
              >
                Close
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setShowAlertDialog(false);
                  navigate('/cases');
                }}
              >
                View in Case Management
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
};

export default PredictionPage;