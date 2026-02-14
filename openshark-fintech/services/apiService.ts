import { Transaction, BackendTransaction, BalanceResponse, InsightsV2Response, DataSource } from '../types';

const API_URL = process.env.API_URL || 'http://localhost:8001';

// Backend: positive amount = expense. Frontend: negative amount = expense.
// Also map field names and normalize dates.
function mapTransaction(bt: BackendTransaction): Transaction {
  const merchant = bt.merchant_name || bt.name;
  const category = mapCategory(bt.category_primary || 'Other');
  // Negate: backend positive expenses → frontend negative expenses
  // Backend negative (income like salary -3500) → frontend positive (+3500)
  const amount = -bt.amount;

  return {
    id: String(bt.id),
    date: bt.date.split('T')[0], // "2025-06-15T00:00:00" → "2025-06-15"
    amount,
    merchant,
    category,
    isSubscription: false,
    isAnomaly: false,
  };
}

// Normalize backend category names to frontend display names
function mapCategory(backendCategory: string): string {
  const map: Record<string, string> = {
    'Food and Drink': 'Food & Dining',
    'Food & Drink': 'Food & Dining',
    'Service': 'Utilities',
    'Shops': 'Shopping',
    'Transfer': 'Income',
    'Payment': 'Utilities',
    'Recreation': 'Entertainment',
    'Healthcare': 'Health',
    'Travel': 'Travel',
    'Transportation': 'Transportation',
    'Groceries': 'Food & Dining',
  };
  return map[backendCategory] || backendCategory;
}

export async function fetchTransactions(limit = 200): Promise<Transaction[]> {
  const res = await fetch(`${API_URL}/transactions?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status}`);
  const data: BackendTransaction[] = await res.json();
  return data.map(mapTransaction);
}

export async function fetchBalance(): Promise<BalanceResponse> {
  const res = await fetch(`${API_URL}/balance`);
  if (!res.ok) throw new Error(`Failed to fetch balance: ${res.status}`);
  return res.json();
}

export async function fetchInsightsV2(): Promise<InsightsV2Response> {
  const res = await fetch(`${API_URL}/insights/v2`);
  if (!res.ok) throw new Error(`Failed to fetch insights: ${res.status}`);
  return res.json();
}

export async function seedDataSource(source: DataSource): Promise<{ message: string; count?: number }> {
  const endpoints: Record<DataSource, string> = {
    demo: '/seed/demo',
    random: '/seed_transactions',
    sparkov: '/seed/sparkov',
  };

  const res = await fetch(`${API_URL}${endpoints[source]}`, { method: 'POST' });
  if (!res.ok) throw new Error(`Seed failed: ${res.status}`);
  const data = await res.json();
  return {
    message: data.message || data.status || 'Done',
    count: data.transactions_created || data.transactions_loaded,
  };
}

export async function resetDatabase(): Promise<void> {
  const res = await fetch(`${API_URL}/reset`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Reset failed: ${res.status}`);
}
