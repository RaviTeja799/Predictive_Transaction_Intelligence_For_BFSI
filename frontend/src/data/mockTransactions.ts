export interface Transaction {
  id: string;
  amount: number;
  date: string;
  channel: string;
  type: string;
  location: string;
  customerSegment: string;
  isFraud: boolean;
  fraudProbability: number;
  deviceType: string;
}

// Generate realistic mock transaction data
const generateMockTransactions = (): Transaction[] => {
  const channels = ["Online", "Mobile", "ATM", "Branch", "POS"];
  const types = ["Transfer", "Withdrawal", "Deposit", "Payment", "Purchase"];
  const locations = ["Mumbai", "Delhi", "Bangalore", "Chennai", "Kolkata", "Hyderabad", "Pune"];
  const segments = ["Premium", "Regular", "New", "Corporate"];
  const devices = ["Desktop", "Mobile", "Tablet", "ATM"];

  const transactions: Transaction[] = [];
  const startDate = new Date("2024-01-01");
  const endDate = new Date("2024-12-31");

  for (let i = 0; i < 5000; i++) {
    const randomDate = new Date(
      startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
    );

    const amount = Math.random() > 0.9 
      ? Math.floor(Math.random() * 90000) + 10000 // Large transactions
      : Math.floor(Math.random() * 5000) + 100; // Normal transactions

    const isFraud = Math.random() < 0.08; // 8% fraud rate
    const fraudProbability = isFraud 
      ? Math.random() * 0.4 + 0.6 // 0.6-1.0 for fraud
      : Math.random() * 0.3; // 0.0-0.3 for legitimate

    transactions.push({
      id: `TXN${String(i + 1).padStart(6, "0")}`,
      amount,
      date: randomDate.toISOString().split("T")[0],
      channel: channels[Math.floor(Math.random() * channels.length)],
      type: types[Math.floor(Math.random() * types.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      customerSegment: segments[Math.floor(Math.random() * segments.length)],
      isFraud,
      fraudProbability,
      deviceType: devices[Math.floor(Math.random() * devices.length)],
    });
  }

  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const mockTransactions = generateMockTransactions();

export const modelMetrics = {
  accuracy: 0.9534,
  precision: 0.8912,
  recall: 0.8756,
  f1Score: 0.8833,
};
