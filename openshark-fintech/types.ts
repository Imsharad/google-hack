export interface Transaction {
  id: string;
  date: string;
  amount: number;
  merchant: string;
  category: string;
  isSubscription?: boolean;
  isAnomaly?: boolean;
  logo?: string;
}

export interface FinancialInsight {
  type: 'dna' | 'anomaly' | 'subscription' | 'forecast';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  actionItem?: string;
}

export interface FinancialDNA {
  spenderType: string; // e.g., "The Optimizer", "Impulse Buyer"
  topCategories: { name: string; percentage: number }[];
  riskScore: number; // 0-100
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  DNA = 'DNA',
  LEDGER_AGENT = 'LEDGER_AGENT',
  SETTINGS = 'SETTINGS'
}