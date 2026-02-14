import { Transaction } from '../types';

const CATEGORIES = ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Utilities', 'Health', 'Travel'];
const MERCHANTS = {
  'Food & Dining': ['Uber Eats', 'Starbucks', 'Chipotle', 'Whole Foods', 'Local Diner'],
  'Transportation': ['Uber', 'Lyft', 'Shell Station', 'Metro Transit'],
  'Shopping': ['Amazon', 'Target', 'Nike', 'Apple Store'],
  'Entertainment': ['Netflix', 'Spotify', 'Steam', 'AMC Theaters'],
  'Utilities': ['Electric Co', 'Water Dept', 'Comcast Xfinity'],
  'Health': ['CVS Pharmacy', 'Gym Membership', 'Doctor Visit'],
  'Travel': ['Delta Airlines', 'Airbnb', 'Hotel Tonight']
};

// Helper to generate random date within last 90 days
const getRandomDate = (daysBack: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysBack);
  return date.toISOString().split('T')[0];
};

export const generateMockTransactions = (count: number = 50): Transaction[] => {
  const transactions: Transaction[] = [];
  
  // 1. Generate standard random transactions
  for (let i = 0; i < count; i++) {
    const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    const merchantList = MERCHANTS[category as keyof typeof MERCHANTS];
    const merchant = merchantList[Math.floor(Math.random() * merchantList.length)];
    
    // Weighted random amount
    let amount = Math.floor(Math.random() * 100) + 5;
    if (category === 'Shopping' && Math.random() > 0.8) amount += 200;
    
    transactions.push({
      id: `txn_${Math.random().toString(36).substr(2, 9)}`,
      date: getRandomDate(Math.floor(Math.random() * 90)),
      amount: -amount, // Expenses are negative
      merchant,
      category,
      isSubscription: ['Netflix', 'Spotify', 'Gym Membership', 'Comcast Xfinity'].includes(merchant),
      isAnomaly: false,
    });
  }

  // 2. Inject Anomalies (High value, unusual location/merchant)
  transactions.push({
    id: 'txn_anomaly_1',
    date: getRandomDate(2),
    amount: -2450.00,
    merchant: 'Luxury Watch Boutique',
    category: 'Shopping',
    isAnomaly: true,
  });

  // 3. Inject Recurring Subscriptions (Fixed dates)
  [30, 60, 90].forEach(days => {
    transactions.push({
      id: `txn_sub_netflix_${days}`,
      date: getRandomDate(days),
      amount: -15.99,
      merchant: 'Netflix',
      category: 'Entertainment',
      isSubscription: true,
    });
  });

  // 4. Inject Income
  [15, 45, 75].forEach(days => {
    transactions.push({
      id: `txn_income_${days}`,
      date: getRandomDate(days),
      amount: 4500.00,
      merchant: 'Payroll Deposit',
      category: 'Income',
      isSubscription: false,
    });
  });

  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};