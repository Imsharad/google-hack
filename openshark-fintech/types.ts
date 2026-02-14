export interface Transaction {
  id: string;
  date: string;
  amount: number; // negative = expense, positive = income (frontend convention)
  merchant: string;
  category: string;
  isSubscription?: boolean;
  isAnomaly?: boolean;
  logo?: string;
}

// Backend returns positive = expense, need to negate for frontend
export interface BackendTransaction {
  id: number;
  account_id: number | null;
  provider_transaction_id: string | null;
  amount: number; // positive = expense in backend
  date: string; // ISO datetime e.g. "2025-06-15T00:00:00"
  name: string;
  merchant_name: string | null;
  category_primary: string | null;
  payment_channel: string | null;
  pending: boolean;
}

export interface BalanceResponse {
  total_balance: number;
  currency: string;
}

export interface InsightsV2Response {
  health_score: number;
  month_summary: {
    total_income: number;
    total_expenses: number;
    net_savings: number;
    savings_rate: number;
  };
  category_breakdown: { category: string; amount: number; percentage: number }[];
  alerts: { severity: string; title: string; body: string }[];
  subscriptions: { subscriptions: { name: string; amount: number; frequency: string }[]; total: number };
  daily_trend: { date: string; amount: number }[];
  narrative: { headline: string; text: string; generated_at: string };
  spending_velocity: number;
}

export type DataSource = 'demo' | 'random' | 'sparkov';

export interface FinancialInsight {
  type: 'dna' | 'anomaly' | 'subscription' | 'forecast';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  actionItem?: string;
}

export interface FinancialDNA {
  spenderType: string;
  topCategories: { name: string; percentage: number }[];
  riskScore: number; // 0-100
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  DNA = 'DNA',
  LEDGER_AGENT = 'LEDGER_AGENT',
  SETTINGS = 'SETTINGS'
}
