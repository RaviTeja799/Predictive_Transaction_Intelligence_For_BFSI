import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: string;
  channel: string;
  location: string;
  fraudProbability: number;
  isFraud: boolean;
}

interface TransactionsTableProps {
  transactions: Transaction[];
  showFraudOnly?: boolean;
}

const ITEMS_PER_PAGE = 10;

export const TransactionsTable = ({
  transactions,
  showFraudOnly = false,
}: TransactionsTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const displayTransactions = showFraudOnly
    ? transactions.filter((t) => t.isFraud)
    : transactions;

  const totalPages = Math.ceil(displayTransactions.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTransactions = displayTransactions.slice(startIndex, endIndex);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 sm:pb-4">
        <CardTitle className="text-base sm:text-lg">
          {showFraudOnly ? "Suspicious Transactions" : "Recent Transactions"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-2 sm:p-6">
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap">ID</TableHead>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap">Amount</TableHead>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">Channel</TableHead>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap">Risk</TableHead>
                  <TableHead className="text-xs sm:text-sm whitespace-nowrap">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTransactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="font-mono text-xs sm:text-sm max-w-[80px] sm:max-w-none truncate">{txn.id}</TableCell>
                    <TableCell className="text-xs sm:text-sm hidden sm:table-cell whitespace-nowrap">{txn.date}</TableCell>
                    <TableCell className="font-semibold text-xs sm:text-sm whitespace-nowrap">
                      ₹{txn.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm hidden md:table-cell">{txn.channel}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className="w-10 sm:w-16 bg-muted rounded-full h-1.5 sm:h-2">
                          <div
                            className={`h-1.5 sm:h-2 rounded-full ${
                              txn.fraudProbability > 0.7
                                ? "bg-destructive"
                                : txn.fraudProbability > 0.4
                                ? "bg-warning"
                                : "bg-success"
                            }`}
                            style={{ width: `${txn.fraudProbability * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {(txn.fraudProbability * 100).toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={txn.isFraud ? "destructive" : "default"}
                        className={`text-xs ${txn.isFraud ? "" : "bg-success text-success-foreground"}`}
                      >
                        {txn.isFraud ? "Fraud" : "OK"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-3">
          <div className="text-xs sm:text-sm text-muted-foreground">
            {startIndex + 1}-{Math.min(endIndex, displayTransactions.length)} of {displayTransactions.length}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="text-xs sm:text-sm h-8"
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline ml-1">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="text-xs sm:text-sm h-8"
            >
              <span className="hidden sm:inline mr-1">Next</span>
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
