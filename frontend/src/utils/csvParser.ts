import Papa from "papaparse";
import { Transaction } from "@/data/mockTransactions";

export interface CSVTransaction {
  transaction_id: string;
  customer_id: string;
  kyc_verified: string;
  account_age_days: string;
  transaction_amount: string;
  channel: string;
  timestamp: string;
  is_fraud: string;
}

const channelMap: Record<string, string> = {
  Mobile: "Mobile",
  Web: "Online",
  ATM: "ATM",
  POS: "POS",
};

const typeMap: Record<string, string> = {
  Mobile: "Transfer",
  Web: "Payment",
  ATM: "Withdrawal",
  POS: "Purchase",
};

export const parseCSVTransactions = (csvData: string): Transaction[] => {
  const parsed = Papa.parse<CSVTransaction>(csvData, {
    header: true,
    skipEmptyLines: true,
  });

  return parsed.data.map((row) => {
    const isFraud = row.is_fraud === "1";
    const amount = parseFloat(row.transaction_amount);
    const date = row.timestamp.split(" ")[0];
    const channel = channelMap[row.channel] || row.channel;

    return {
      id: row.transaction_id,
      amount,
      date,
      channel,
      type: typeMap[row.channel] || "Transaction",
      location: "India", // Default location since not in CSV
      customerSegment: row.kyc_verified === "Yes" ? "Verified" : "Unverified",
      isFraud,
      fraudProbability: isFraud ? Math.random() * 0.4 + 0.6 : Math.random() * 0.3,
      deviceType: row.channel === "Mobile" ? "Mobile" : row.channel === "Web" ? "Desktop" : "ATM",
    };
  });
};

export const loadTransactionsFromCSV = async (): Promise<Transaction[]> => {
  try {
    const response = await fetch("/data/transactions.csv");
    const csvData = await response.text();
    return parseCSVTransactions(csvData);
  } catch (error) {
    console.error("Error loading CSV data:", error);
    return [];
  }
};
